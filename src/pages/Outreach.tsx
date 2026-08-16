import { useState } from 'react'
import { Plus, Pencil, Trash2, Mail, Calendar, AlertCircle } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { formatDate } from '../lib/utils'
import { OUTREACH_RESULT_LABELS, IMPACT_LABELS, type Professor, type OutreachResult, type ImpactLevel } from '../types'

const resultColors: Record<OutreachResult, string> = {
  'no-reply': 'text-slate-400',
  positive: 'text-emerald-400',
  neutral: 'text-sky-400',
  negative: 'text-red-400',
  interview: 'text-amber-400',
}

const impactColors: Record<ImpactLevel, string> = {
  high: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export default function Outreach() {
  const { schools, professors, addProfessor, updateProfessor, deleteProfessor } = useAppStore()
  const [editing, setEditing] = useState<Professor | null>(null)
  const [showForm, setShowForm] = useState(false)

  const activeSchools = schools.filter((s) => s.status !== 'on-hold')

  const emptyForm: Omit<Professor, 'id'> = {
    schoolId: activeSchools[0]?.id || '',
    name: '',
    title: '',
    email: '',
    firstContactDate: undefined,
    followUpDate: undefined,
    lastEmailContent: '',
    result: 'no-reply',
    impact: 'medium',
    notes: '',
  }

  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (prof: Professor) => {
    setForm(prof)
    setEditing(prof)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateProfessor(editing.id, form)
    } else {
      addProfessor(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">导师沟通</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加记录
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? '编辑沟通记录' : '添加沟通记录'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">学校</label>
                <select
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.schoolId}
                  onChange={(e) => setForm({ ...form, schoolId: e.target.value })}
                >
                  {activeSchools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">导师姓名</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">职务</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Professor / Associate Prof..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">邮箱</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">首次联系时间</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.firstContactDate}
                    onChange={(e) => setForm({ ...form, firstContactDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">跟进时间</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">沟通结果</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.result}
                    onChange={(e) => setForm({ ...form, result: e.target.value as OutreachResult })}
                  >
                    {Object.entries(OUTREACH_RESULT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">对申请影响</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.impact}
                    onChange={(e) => setForm({ ...form, impact: e.target.value as ImpactLevel })}
                  >
                    {Object.entries(IMPACT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">邮件内容摘要</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.lastEmailContent}
                  onChange={(e) => setForm({ ...form, lastEmailContent: e.target.value })}
                  placeholder="简述你发送的邮件内容和对方的回复..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">备注</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {professors.map((prof) => {
          const school = schools.find((s) => s.id === prof.schoolId)
          return (
            <div
              key={prof.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100">{prof.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs border ${impactColors[prof.impact]}`}>
                      影响：{IMPACT_LABELS[prof.impact]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {prof.title}{school ? ` · ${school.name}` : ''}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(prof)}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定删除吗？')) deleteProfessor(prof.id)
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-3 text-sm">
                {prof.email && (
                  <a
                    href={`mailto:${prof.email}`}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {prof.email}
                  </a>
                )}
                {prof.firstContactDate && (
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    首次联系：{formatDate(prof.firstContactDate)}
                  </span>
                )}
                {prof.followUpDate && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    跟进：{formatDate(prof.followUpDate)}
                  </span>
                )}
              </div>

              <div className={`text-sm mb-2 ${resultColors[prof.result]}`}>
                结果：{OUTREACH_RESULT_LABELS[prof.result]}
              </div>

              {prof.lastEmailContent && (
                <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{prof.lastEmailContent}</p>
                </div>
              )}

              {prof.notes && (
                <p className="text-xs text-slate-500">{prof.notes}</p>
              )}
            </div>
          )
        })}
      </div>

      {professors.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>暂无套磁记录</p>
          <button onClick={openAdd} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
            添加第一条记录 →
          </button>
        </div>
      )}
    </div>
  )
}
