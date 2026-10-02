import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getReminders, localDay, pendingReminders, readHistory } from '../src/lib/reminders.ts'
import { emptyData } from '../src/lib/trackerData.ts'
import type { School, Professor, Recommender } from '../src/types/index.ts'

const now = new Date(2026, 9, 2, 23, 59)
const school = (change: Partial<School> = {}): School => ({ id: 's', name: '学校', program: 'PhD', deadline: '2026-10-09', status: 'active', location: { city: '', country: '' }, funding: 'unknown', tier: 'target', website: '', direction: '', notes: '', ...change })
const professor = (change: Partial<Professor> = {}): Professor => ({ id: 'p', schoolId: 's', name: '导师', title: '', email: '', lastEmailContent: '', result: 'no-reply', impact: 'medium', notes: '', followUpDate: '2026-10-02', ...change })
const recommender = (change: Partial<Recommender> = {}): Recommender => ({ id: 'r', name: '推荐人', email: '', totalLetters: 3, submittedCount: 1, reminderDate: '2026-10-02', status: 'pending', notes: '', ...change })

test('deadline includes day 7 and today, excludes day 8 and expired deadlines', () => {
  for (const [date, expected] of [['2026-10-09', 1], ['2026-10-02', 1], ['2026-10-10', 0], ['2026-10-01', 0]] as const) {
    assert.equal(getReminders({ ...emptyData(), schools: [school({ deadline: date })] }, now).length, expected)
  }
})
test('submitted, on-hold and completed school applications do not produce deadline reminders', () => {
  for (const status of ['applied', 'on-hold', 'admitted', 'rejected'] as const) {
    assert.equal(getReminders({ ...emptyData(), schools: [school({ status })] }, now).length, 0)
  }
})
test('recommendations remind on due date and overdue, but stop when submitted', () => {
  const check = (change: Partial<Recommender>) => getReminders({ ...emptyData(), recommenders: [recommender(change)] }, now)
  assert.equal(check({}).length, 1)
  assert.equal(check({ reminderDate: '2026-10-01' }).length, 1)
  assert.equal(check({ reminderDate: '2026-10-03' }).length, 0)
  assert.equal(check({ status: 'submitted' }).length, 0)
  assert.equal(check({ submittedCount: 3 }).length, 0)
  assert.equal(check({ totalLetters: 0 }).length, 0)
})
test('follow-ups include overdue and applied schools; exclude missing and inactive schools', () => {
  const check = (schools: School[], change: Partial<Professor> = {}) => getReminders({ ...emptyData(), schools, professors: [professor(change)] }, now).filter(r => r.kind === 'follow-up')
  assert.equal(check([school()]).length, 1)
  assert.equal(check([school({ status: 'applied' })], { followUpDate: '2026-09-30' }).length, 1)
  assert.equal(check([school()], { followUpDate: '2026-10-03' }).length, 0)
  assert.equal(check([school()], { followUpDate: '' }).length, 0)
  assert.equal(check([]).length, 0)
  assert.equal(check([school({ status: 'on-hold' })]).length, 0)
  assert.equal(check([school({ status: 'rejected' })]).length, 0)
})
test('missing and impossible dates cannot produce reminders', () => {
  for (const date of ['', 'bad', '2026-02-30', '2026-13-01', '2026-00-01', '2026-10-02T00:00:00Z']) {
    assert.equal(getReminders({ ...emptyData(), schools: [school({ deadline: date })], recommenders: [recommender({ reminderDate: date })], professors: [professor({ followUpDate: date })] }, now).length, 0)
  }
})
test('local calendar boundary and month rollover work regardless of UTC date', () => {
  assert.equal(localDay(new Date(2026, 9, 2, 0, 1)), '2026-10-02')
  const data = { ...emptyData(), schools: [school({ deadline: '2026-11-01' })] }
  assert.equal(getReminders(data, new Date(2026, 9, 31, 23, 59))[0].days, 1)
  assert.equal(getReminders(data, new Date(2026, 10, 1, 0, 0))[0].days, 0)
})
test('daily dedup survives reload; a changed date and next day become eligible again', () => {
  const items = getReminders({ ...emptyData(), schools: [school()] }, now)
  const history = readHistory(null, '2026-10-02')
  history.shown = [items[0].id]
  assert.equal(pendingReminders(items, readHistory(JSON.stringify(history), '2026-10-02'), 'shown').length, 0)
  assert.equal(pendingReminders(items, history, 'notified').length, 1)
  history.dismissed = [items[0].id]
  assert.equal(pendingReminders(items, history, 'notified').length, 0)
  const changed = getReminders({ ...emptyData(), schools: [school({ deadline: '2026-10-08' })] }, now)
  assert.equal(pendingReminders(changed, history, 'shown').length, 1)
  assert.equal(pendingReminders(items, readHistory(JSON.stringify(history), '2026-10-03'), 'shown').length, 1)
})
test('invalid local history recovers safely and filters malformed entries', () => {
  assert.deepEqual(readHistory('{bad', '2026-10-02'), { day: '2026-10-02', shown: [], notified: [], dismissed: [] })
  assert.deepEqual(readHistory(JSON.stringify({ day: '2026-10-02', shown: [2, 'ok'], notified: 'bad' }), '2026-10-02').shown, ['ok'])
})
