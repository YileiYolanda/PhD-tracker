import type { School, Material, Professor, Document, Recommender, Interview } from '../types'

export interface ActiveData {
  schools: School[]
  materials: Material[]
  professors: Professor[]
  documents: Document[]
  recommenders: Recommender[]
  interviews: Interview[]
}

export interface TrashEntry {
  id: string
  kind: keyof ActiveData
  label: string
  deletedAt: string
  data: ActiveData
}
export interface TrackerData extends ActiveData { trash: TrashEntry[] }

export const collections = ['schools', 'materials', 'professors', 'documents', 'recommenders', 'interviews'] as const
export const emptyData = (): TrackerData => ({ schools: [], materials: [], professors: [], documents: [], recommenders: [], interviews: [], trash: [] })
export function snapshot(state: TrackerData): TrackerData {
  return { ...activeSnapshot(state), trash: state.trash ?? [] }
}
export function activeSnapshot(state: ActiveData): ActiveData {
  return Object.fromEntries(collections.map(key => [key, state[key]])) as unknown as ActiveData
}

// Validate both legacy backups and remote data before they reach the existing pages.
function parseActiveData(value: unknown): ActiveData {
  if (!value || typeof value !== 'object' || !('schools' in value)) throw new Error('数据格式不正确：缺少学校列表')
  const data = value as Record<string, unknown>
  const required: Record<string, string[]> = {
    schools: ['name', 'program', 'deadline', 'funding', 'tier', 'status', 'website', 'direction', 'notes'],
    materials: ['schoolId', 'type', 'status', 'notes'],
    professors: ['schoolId', 'name', 'title', 'email', 'lastEmailContent', 'result', 'impact', 'notes'],
    documents: ['title', 'category', 'content', 'updatedAt'],
    recommenders: ['name', 'email', 'status', 'notes'],
    interviews: ['schoolId', 'dateTime', 'format', 'status'],
  }
  for (const key of collections) {
    const rows = data[key] ?? []
    if (!Array.isArray(rows)) throw new Error(`${key} 必须是列表`)
    const ids = new Set<string>()
    for (const row of rows) {
      if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id || ids.has(row.id)) throw new Error(`${key} 存在无效或重复记录`)
      ids.add(row.id)
      if (required[key].some(field => typeof row[field] !== 'string')) throw new Error(`${key} 缺少必要字段`)
      if (key === 'schools' && (!row.location || typeof row.location.city !== 'string' || typeof row.location.country !== 'string')) throw new Error('学校地点格式不正确')
      if (key === 'recommenders' && (!Number.isFinite(row.totalLetters) || !Number.isFinite(row.submittedCount))) throw new Error('推荐信数量格式不正确')
    }
  }
  return Object.fromEntries(collections.map(key => [key, data[key] ?? []])) as unknown as ActiveData
}

export function parseData(value: unknown): TrackerData {
  const active = parseActiveData(value)
  const raw = (value as Record<string, unknown>).trash ?? []
  if (!Array.isArray(raw)) throw new Error('回收站必须是列表')
  const ids = new Set<string>()
  const trash = raw.map(entry => {
    if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) || !collections.includes(entry.kind) || typeof entry.label !== 'string' || typeof entry.deletedAt !== 'string' || !Number.isFinite(Date.parse(entry.deletedAt))) throw new Error('回收站记录格式不正确')
    ids.add(entry.id)
    const data = parseActiveData(entry.data)
    if (!data[entry.kind as keyof ActiveData].length) throw new Error('回收站记录缺少主体数据')
    return { id: entry.id, kind: entry.kind, label: entry.label, deletedAt: entry.deletedAt, data }
  })
  return { ...active, trash }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  }
  return value
}

// PostgreSQL jsonb normalizes object key order; compare content, not serialization order.
export const sameData = (a: TrackerData, b: TrackerData) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
