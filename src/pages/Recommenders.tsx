import { useState } from 'react'
import { Plus, Pencil, Trash2, Mail, Bell, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { formatDate, daysUntil } from '../lib/utils'
import { type Recommender, type RecommenderStatus } from '../types'

const statusColors: Record<RecommenderStatus, string> = {
  pending: 'text-amber-400',
  submitted: 'text-emerald-400',
  overdue: 'text-red-400',
}

const statusLabels: Record<RecommenderStatus, string> = {
  pending: '待提交',
  submitted: '已提交',
  overdue: '已逾期',
}

export default function RecommendersPage() {
  const { recommenders, addRecommender, updateRecommender, deleteRecommender } = useAppStore()
  const [editing, setEditing] = useState<Recommender | null>(null)
  const [showForm, setShowForm] = useState(false)

  const emptyForm: Omit<Recommender, 'id'> = {
    name: '',
    email: '',
    totalLetters: 5,
    submittedCount: 0,
    reminderDate: undefined,
    status: 'pending',
    notes: '',
  }

  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (rec: Recommender) => {
    setForm(rec)
    setEditing(rec)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateRecommender(editing.id, form)
    } else {
      addRecommender(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">推荐人管理</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加推荐人
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editing ? '编辑推荐人' : '添加推荐人'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">姓名</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
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
                  <label className="block text-sm text-slate-400 mb-1">需提交数量</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.totalLetters}
                    onChange={(e) => setForm({ ...form, totalLetters: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">已提交数量</label>
                  <input
                    type="number"
                    min={0}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.submittedCount}
                    onChange={(e) => setForm({ ...form, submittedCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">提醒日期</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.reminderDate}
                  onChange={(e) => setForm({ ...form, reminderDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">状态</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as RecommenderStatus })}
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommenders.map((rec) => {
          const progress = rec.totalLetters > 0 ? (rec.submittedCount / rec.totalLetters) * 100 : 0
          const isOverdue = rec.reminderDate && daysUntil(rec.reminderDate) < 0 && rec.status !== 'submitted'

          return (
            <div
              key={rec.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-100">{rec.name}</h3>
                  {rec.email && (
                    <a
                      href={`mailto:${rec.email}`}
                      className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      {rec.email}
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(rec)}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定移入回收站吗？之后可在回收站恢复。')) deleteRecommender(rec.id)
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className={`text-sm font-medium ${statusColors[rec.status]}`}>
                  {statusLabels[rec.status]}
                </span>
                {isOverdue && (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    已逾期
                  </span>
                )}
                {rec.reminderDate && !isOverdue && rec.status !== 'submitted' && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Bell className="w-3 h-3" />
                    提醒：{formatDate(rec.reminderDate)}
                  </span>
                )}
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">进度</span>
                  <span className="text-slate-300">{rec.submittedCount}/{rec.totalLetters}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {rec.notes && (
                <p className="mt-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-2">{rec.notes}</p>
              )}
            </div>
          )
        })}
      </div>

      {recommenders.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>暂无推荐人记录</p>
          <button onClick={openAdd} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
            添加第一位推荐人 →
          </button>
        </div>
      )}
    </div>
  )
}
