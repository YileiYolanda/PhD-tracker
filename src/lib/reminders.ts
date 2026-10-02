import type { TrackerData } from './trackerData.ts'

export interface Reminder {
  id: string
  kind: 'deadline' | 'recommendation' | 'follow-up'
  title: string
  detail: string
  date: string
  days: number
  to: string
}

export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// Calendar-day arithmetic avoids UTC parsing shifts and daylight-saving 23/25-hour days.
function dayNumber(value: string | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(0, 0, 0, 0)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return date.getTime() / 86400000
}

export function getReminders(data: Pick<TrackerData, 'schools' | 'professors' | 'recommenders'>, now = new Date()): Reminder[] {
  const today = dayNumber(localDay(now))!
  const daysTo = (date?: string) => { const day = dayNumber(date); return day === null ? null : day - today }
  const result: Reminder[] = []
  for (const school of data.schools) {
    const days = daysTo(school.deadline)
    if (school.status !== 'active' || days === null || days < 0 || days > 7) continue
    result.push({ id: JSON.stringify(['deadline', school.id, school.deadline]), kind: 'deadline', title: `${school.name} · 申请截止`, detail: `${school.program} · ${days === 0 ? '今天截止' : `还有 ${days} 天截止`}`, date: school.deadline, days, to: '/' })
  }
  for (const rec of data.recommenders) {
    const days = daysTo(rec.reminderDate)
    if (days === null || days > 0 || rec.status === 'submitted' || rec.totalLetters <= 0 || rec.submittedCount >= rec.totalLetters) continue
    result.push({ id: JSON.stringify(['recommendation', rec.id, rec.reminderDate]), kind: 'recommendation', title: `${rec.name} · 推荐信提醒`, detail: `还有 ${rec.totalLetters - rec.submittedCount} 封待提交 · ${days === 0 ? '今天需提醒' : `提醒日已过 ${-days} 天`}`, date: rec.reminderDate!, days, to: '/recommenders' })
  }
  const schools = new Map(data.schools.map(s => [s.id, s]))
  for (const prof of data.professors) {
    const school = schools.get(prof.schoolId)
    const days = daysTo(prof.followUpDate)
    if (!school || !['active', 'applied'].includes(school.status) || days === null || days > 0) continue
    result.push({ id: JSON.stringify(['follow-up', prof.id, prof.followUpDate]), kind: 'follow-up', title: `${prof.name} · 导师跟进`, detail: `${school.name} · ${days === 0 ? '今天需跟进' : `跟进日已过 ${-days} 天`}`, date: prof.followUpDate!, days, to: '/outreach' })
  }
  return result.sort((a, b) => a.days - b.days || a.id.localeCompare(b.id))
}

export interface ReminderHistory { day: string; shown: string[]; notified: string[]; dismissed: string[] }
export function readHistory(raw: string | null, day: string): ReminderHistory {
  const empty = { day, shown: [], notified: [], dismissed: [] }
  try {
    const value = JSON.parse(raw ?? 'null')
    if (value?.day !== day) return empty
    const strings = (v: unknown): string[] => Array.isArray(v) ? v.filter(x => typeof x === 'string') : []
    return { day, shown: strings(value.shown), notified: strings(value.notified), dismissed: strings(value.dismissed) }
  } catch { return empty }
}
export function pendingReminders(items: Reminder[], history: ReminderHistory, channel: 'shown' | 'notified') {
  return items.filter(item => !history[channel].includes(item.id) && !history.dismissed.includes(item.id))
}
