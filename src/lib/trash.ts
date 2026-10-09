import { activeSnapshot, collections, emptyData } from './trackerData.ts'
import type { ActiveData, TrackerData } from './trackerData.ts'

export const trashLabels: Record<keyof ActiveData, string> = {
  schools: '申请学校', materials: '申请材料', professors: '导师 / 沟通记录',
  documents: '文书', recommenders: '推荐人', interviews: '面试',
}

export function moveToTrash(state: TrackerData, kind: keyof ActiveData, id: string, batchId: string, deletedAt = new Date().toISOString()): TrackerData {
  const row = state[kind].find(row => row.id === id)
  if (!row) return state
  const removed = activeSnapshot(emptyData())
  const next = activeSnapshot(state)
  for (const key of collections) {
    const selected = state[key].filter(item => (key === kind && item.id === id) ||
      (kind === 'schools' && ['materials', 'professors', 'interviews'].includes(key) && 'schoolId' in item && item.schoolId === id))
    // Each collection is processed independently; preserve every entity's original fields.
    Object.assign(removed, { [key]: selected })
    const ids = new Set(selected.map(item => item.id))
    Object.assign(next, { [key]: state[key].filter(item => !ids.has(item.id)) })
  }
  const label = 'name' in row ? row.name : 'title' in row ? row.title : kind === 'materials' && 'type' in row ? `材料 ${row.type}` : 'dateTime' in row ? `面试 ${row.dateTime}` : id
  return { ...next, trash: [{ id: batchId, kind, label, deletedAt, data: removed }, ...(state.trash ?? [])] }
}

export function restoreTrash(state: TrackerData, entryId: string): TrackerData {
  const entry = state.trash.find(item => item.id === entryId)
  if (!entry) throw new Error('该记录已恢复或已被删除，请检查最新回收站。')
  // Never overwrite a live record, including after importing an older backup.
  for (const key of collections) {
    const ids = new Set(state[key].map(row => row.id))
    if (entry.data[key].some(row => ids.has(row.id))) throw new Error(`${trashLabels[key]}存在相同编号，恢复已取消，现有数据未被覆盖。`)
  }
  const schoolIds = new Set([...state.schools, ...entry.data.schools].map(row => row.id))
  for (const row of [...entry.data.materials, ...entry.data.professors, ...entry.data.interviews]) {
    if (!schoolIds.has(row.schoolId)) throw new Error('关联学校不存在，请先从回收站恢复该学校，再恢复这条记录。')
  }
  const next = activeSnapshot(state)
  for (const key of collections) Object.assign(next, { [key]: [...state[key], ...entry.data[key]] })
  return { ...next, trash: state.trash.filter(item => item.id !== entryId) }
}
