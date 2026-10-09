import { test } from 'node:test'
import assert from 'node:assert/strict'
import { moveToTrash, restoreTrash } from '../src/lib/trash.ts'
import { activeSnapshot, collections, emptyData, parseData, sameData, snapshot } from '../src/lib/trackerData.ts'
import { seedSchools, seedMaterials, seedProfessors, seedDocuments, seedRecommenders, seedInterviews } from '../src/data/seed.ts'

const fixture = () => structuredClone({ ...emptyData(), schools: seedSchools, materials: seedMaterials, professors: seedProfessors, documents: seedDocuments, recommenders: seedRecommenders, interviews: seedInterviews })

for (const kind of collections) test(`${kind}: delete and restore preserves complete records`, () => {
  const before = fixture()
  assert.ok(before[kind].length)
  const row = before[kind][0]
  const deleted = moveToTrash(before, kind, row.id, 'batch')
  assert.ok(!deleted[kind].some(item => item.id === row.id))
  assert.deepEqual(deleted.trash[0].data[kind][0], row)
  const restored = restoreTrash(parseData(JSON.parse(JSON.stringify(snapshot(deleted)))), 'batch')
  for (const key of collections) assert.deepEqual([...restored[key]].sort((a,b) => a.id.localeCompare(b.id)), [...before[key]].sort((a,b) => a.id.localeCompare(b.id)))
  assert.equal(restored.trash.length, 0)
  assert.equal(before.trash.length, 0)
})

test('school deletion bundles dependent records and leaves unrelated data intact', () => {
  const before = fixture()
  const schoolId = before.schools[0].id
  const deleted = moveToTrash(before, 'schools', schoolId, 'batch')
  for (const key of ['materials', 'professors', 'interviews'] as const) {
    assert.deepEqual(deleted.trash[0].data[key], before[key].filter(row => row.schoolId === schoolId))
    assert.deepEqual(deleted[key], before[key].filter(row => row.schoolId !== schoolId))
  }
  assert.deepEqual(deleted.documents, before.documents)
  assert.deepEqual(deleted.recommenders, before.recommenders)
  assert.equal(moveToTrash(deleted, 'schools', schoolId, 'duplicate'), deleted)
})

test('restore requires a parent school and rejects ID conflicts without overwriting', () => {
  const before = fixture()
  const material = before.materials[0]
  let state = moveToTrash(before, 'materials', material.id, 'material')
  state = moveToTrash(state, 'schools', material.schoolId, 'school')
  assert.throws(() => restoreTrash(state, 'material'), /先从回收站恢复/)
  state = restoreTrash(state, 'school')
  assert.ok(restoreTrash(state, 'material').materials.some(row => row.id === material.id))
  const conflict = { ...state, materials: [...state.materials, material] }
  assert.throws(() => restoreTrash(conflict, 'material'), /相同编号/)
  assert.equal(conflict.trash.length, 1)
})

test('legacy backups load and trash participates in snapshot comparisons and validation', () => {
  const before = fixture()
  assert.deepEqual(parseData(activeSnapshot(before)).trash, [])
  const deleted = moveToTrash(before, 'schools', before.schools[0].id, 'batch')
  assert.equal(sameData(deleted, { ...deleted, trash: [] }), false)
  assert.throws(() => parseData({ ...deleted, trash: {} }), /回收站/)
  assert.throws(() => parseData({ ...deleted, trash: [{ ...deleted.trash[0], deletedAt: 'invalid' }] }), /回收站/)
})
