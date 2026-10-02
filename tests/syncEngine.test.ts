import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SyncEngine } from '../src/lib/syncEngine.ts'
import type { Cache, RemoteSnapshot, SyncView } from '../src/lib/syncEngine.ts'
import { emptyData, parseData, sameData } from '../src/lib/trackerData.ts'
import type { TrackerData } from '../src/lib/trackerData.ts'

function documentData(content: string): TrackerData {
  return { ...emptyData(), documents: [{ id: 'doc1', title: 'SOP', category: 'sop', content, updatedAt: '2026-10-02' }] }
}
function harness(cached?: Cache) {
  const state = {
    remote: null as RemoteSnapshot | null,
    persisted: undefined as Cache | undefined,
    shown: emptyData(),
    view: undefined as SyncView | undefined,
    writes: 0,
    offline: false,
    quota: false,
    race: false,
    afterSave: () => {},
  }
  const engine = new SyncEngine({
    read: async () => { if (state.offline) throw new Error('offline'); return structuredClone(state.remote) },
    save: async (version, data) => {
      if (state.offline) throw new Error('offline')
      state.writes++
      if (state.race || (state.remote?.version ?? 0) !== version) return null
      state.remote = { version: version + 1, data: structuredClone(data) }
      state.afterSave()
      return structuredClone(state.remote)
    },
    persist: cache => { if (state.quota) throw new Error('quota'); state.persisted = structuredClone(cache) },
    apply: data => { state.shown = data },
    notify: view => { state.view = view },
  }, cached)
  return { engine, state }
}

test('new account starts empty without uploading sample data', async () => {
  const { engine, state } = harness()
  await engine.tick()
  assert.deepEqual(state.shown, emptyData())
  assert.equal(state.writes, 0)
  assert.equal(state.view?.ready, true)
})
test('new device reads cloud data before editing', async () => {
  const { engine, state } = harness()
  state.remote = { version: 3, data: documentData('cloud') }
  engine.edit(documentData('must not overwrite'))
  await engine.tick()
  assert.deepEqual(state.shown, documentData('cloud'))
  assert.equal(state.writes, 0)
})
test('edits are durable before upload and become synced after atomic save', async () => {
  const { engine, state } = harness()
  await engine.tick()
  engine.edit(documentData('edit'))
  assert.equal(state.persisted?.pending, true)
  await engine.tick()
  assert.equal(state.remote?.version, 1)
  assert.deepEqual(state.remote?.data, documentData('edit'))
  assert.equal(state.persisted?.pending, false)
})
test('offline reload retains edits and retries on reconnect', async () => {
  const { engine, state } = harness({ version: 1, data: documentData('offline edit'), pending: true })
  state.remote = { version: 1, data: documentData('old') }
  state.offline = true
  await engine.tick()
  assert.equal(state.view?.ready, true)
  assert.deepEqual(state.shown, documentData('offline edit'))
  state.offline = false
  await engine.tick()
  assert.equal(state.remote?.version, 2)
  assert.equal(state.view?.status, 'saved')
})
test('remote changes are pulled when this device has no edits', async () => {
  const { engine, state } = harness()
  await engine.tick()
  state.remote = { version: 8, data: documentData('another device') }
  await engine.tick()
  assert.deepEqual(state.shown, state.remote.data)
})
test('concurrent changes preserve both versions and pause uploads', async () => {
  const { engine, state } = harness({ version: 1, data: documentData('local'), pending: true })
  state.remote = { version: 2, data: documentData('remote') }
  await engine.tick()
  await engine.tick()
  assert.equal(state.view?.status, 'conflict')
  assert.equal(state.writes, 0)
  assert.deepEqual(state.shown, documentData('local'))
  assert.deepEqual(state.remote.data, documentData('remote'))
  await engine.useCloud()
  assert.deepEqual(state.shown, documentData('remote'))
  assert.equal(state.persisted?.pending, false)
})
test('compare-and-swap race never reports a rejected write as saved', async () => {
  const { engine, state } = harness()
  await engine.tick()
  engine.edit(documentData('local'))
  state.race = true
  await engine.tick()
  assert.equal(state.view?.status, 'conflict')
  assert.equal(state.persisted?.pending, true)
})
test('edits made during an upload stay pending for the next upload', async () => {
  const { engine, state } = harness()
  await engine.tick()
  engine.edit(documentData('first'))
  state.afterSave = () => engine.edit(documentData('second'))
  await engine.tick()
  assert.equal(state.persisted?.version, 1)
  assert.equal(state.persisted?.pending, true)
  state.afterSave = () => {}
  await engine.tick()
  assert.deepEqual(state.remote?.data, documentData('second'))
  assert.equal(state.persisted?.pending, false)
})
test('lost success response is recognized without overwriting cloud', async () => {
  const { engine, state } = harness({ version: 1, data: documentData('same'), pending: true })
  state.remote = { version: 2, data: documentData('same') }
  await engine.tick()
  assert.equal(state.view?.status, 'saved')
  assert.equal(state.writes, 0)
})
test('storage failure keeps edit in memory and reports failure', async () => {
  const { engine, state } = harness()
  await engine.tick()
  state.quota = true
  engine.edit(documentData('keep me'))
  assert.equal(state.view?.status, 'error')
  assert.equal(state.view?.pending, true)
  state.quota = false
  await engine.tick()
  assert.deepEqual(state.remote?.data, documentData('keep me'))
})
test('stopped workers cannot apply responses after account switch', async () => {
  const { engine, state } = harness()
  state.remote = { version: 1, data: documentData('private') }
  const pending = engine.tick()
  engine.stop()
  await pending
  assert.deepEqual(state.shown, emptyData())
  assert.equal(state.persisted, undefined)
})
test('malformed backups are rejected and older missing collections remain compatible', () => {
  assert.throws(() => parseData({}))
  assert.throws(() => parseData({ schools: 'bad' }))
  assert.throws(() => parseData({ schools: [{ id: 'bad' }] }))
  const valid = documentData('ok')
  assert.throws(() => parseData({ ...valid, documents: [...valid.documents, ...valid.documents] }))
  assert.deepEqual(parseData({ schools: [] }), emptyData())
})

test('JSONB object key order does not change content equality', () => {
  const data = documentData('same')
  const reordered = Object.fromEntries(Object.entries(data).reverse()) as unknown as TrackerData
  reordered.documents = [{ content: 'same', category: 'sop', updatedAt: '2026-10-02', title: 'SOP', id: 'doc1' }]
  assert.equal(sameData(data, reordered), true)
})
