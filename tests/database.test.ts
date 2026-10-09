import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { emptyData } from '../src/lib/trackerData.ts'

test('SQL migration enforces account isolation, write permissions, and version checks', async () => {
  const db = new PGlite()
  try {
    // Emulate Supabase's trusted JWT identity in a real embedded PostgreSQL engine.
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users values
        ('00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000002');
    `)
    await db.exec(await readFile(new URL('../supabase/migrations/001_tracker.sql', import.meta.url), 'utf8'))
    await db.exec(await readFile(new URL('../supabase/migrations/002_trash.sql', import.meta.url), 'utf8'))
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'`)
    const first = await db.query<{ version: number }>('select * from public.save_tracker(0, $1::jsonb)', [JSON.stringify(emptyData())])
    assert.equal(Number(first.rows[0].version), 1)
    const stale = await db.query('select * from public.save_tracker(0, $1::jsonb)', [JSON.stringify(emptyData())])
    assert.equal(stale.rows.length, 0)
    const update = await db.query<{ version: number }>('select * from public.save_tracker(1, $1::jsonb)', [JSON.stringify(emptyData())])
    assert.equal(Number(update.rows[0].version), 2)
    const staleUpdate = await db.query('select * from public.save_tracker(1, $1::jsonb)', [JSON.stringify(emptyData())])
    assert.equal(staleUpdate.rows.length, 0)
    await assert.rejects(db.query('select * from public.save_tracker(2, $1::jsonb)', ['{}']), /tracker_shape/)
    await assert.rejects(db.exec('update public.tracker_snapshots set version = 99'), /permission denied/)
    await assert.rejects(db.exec('delete from public.tracker_snapshots'), /permission denied/)
    await assert.rejects(db.exec(`insert into public.tracker_snapshots(user_id, data) values ('00000000-0000-0000-0000-000000000002', '{}')`), /permission denied/)
    assert.equal((await db.query('select * from public.tracker_snapshots')).rows.length, 1)

    const withTrash = { ...emptyData(), trash: [{ id: 'deleted-record' }] }
    const savedTrash = await db.query<{ data: typeof withTrash }>('select * from public.save_tracker(2, $1::jsonb)', [JSON.stringify(withTrash)])
    assert.deepEqual(savedTrash.rows[0].data.trash, withTrash.trash)
    const { trash: _trash, ...legacyPayload } = emptyData()
    await assert.rejects(db.query('select * from public.save_tracker(3, $1::jsonb)', [JSON.stringify(legacyPayload)]), /请刷新网页/)
    assert.equal((await db.query('select * from public.save_tracker(2, $1::jsonb)', [JSON.stringify(legacyPayload)])).rows.length, 0)
    await assert.rejects(db.query('select * from public.save_tracker(3, $1::jsonb)', [JSON.stringify({ ...emptyData(), trash: {} })]), /tracker_trash_shape/)
    const cleared = await db.query<{ data: ReturnType<typeof emptyData> }>('select * from public.save_tracker(3, $1::jsonb)', [JSON.stringify(emptyData())])
    assert.deepEqual(cleared.rows[0].data.trash, [])

    await db.exec(`set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'`)
    assert.equal((await db.query('select * from public.tracker_snapshots')).rows.length, 0)
    assert.equal((await db.query('select * from public.save_tracker(2, $1::jsonb)', [JSON.stringify(emptyData())])).rows.length, 0)
    const second = await db.query<{ user_id: string }>('select * from public.save_tracker(0, $1::jsonb)', [JSON.stringify(emptyData())])
    assert.equal(second.rows[0].user_id, '00000000-0000-0000-0000-000000000002')

    await db.exec(`set request.jwt.claim.sub = ''`)
    await assert.rejects(db.query('select * from public.save_tracker(0, $1::jsonb)', [JSON.stringify(emptyData())]), /Authentication required/)
    await db.exec('reset role; set role anon')
    await assert.rejects(db.exec('select * from public.tracker_snapshots'), /permission denied/)
    await assert.rejects(db.query('select * from public.save_tracker(0, $1::jsonb)', [JSON.stringify(emptyData())]), /permission denied/)
  } finally { await db.close() }
})
