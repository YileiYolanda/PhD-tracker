import { useState } from 'react'
import { ExternalLink, Plus, Pencil, Trash2, PauseCircle } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { daysUntil, formatDate } from '../lib/utils'
import { FUNDING_LABELS, TIER_LABELS, type School, type FundingType, type TierType } from '../types'

const fundingColors: Record<FundingType, string> = {
  full: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  partial: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  none: 'bg-red-500/20 text-red-300 border-red-500/30',
  unknown: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

const tierColors: Record<TierType, string> = {
  reach: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  target: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  safety: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
}

function CountdownBadge({ deadline }: { deadline: string }) {
  const days = daysUntil(deadline)
  if (days < 0) {
    return <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">已截止</span>
  }
  if (days <= 7) {
    return <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30 font-medium">{days} 天后截止</span>
  }
  if (days <= 30) {
    return <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">{days} 天后截止</span>
  }
  return <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">{days} 天后截止</span>
}

export default function Overview() {
  const { schools, addSchool, updateSchool, deleteSchool, moveSchoolToOnHold } = useAppStore()
  const [editing, setEditing] = useState<School | null>(null)
  const [showForm, setShowForm] = useState(false)

  const activeSchools = schools.filter((s) => s.status !== 'on-hold')

  const emptyForm: Omit<School, 'id'> = {
    name: '',
    program: '',
    location: { city: '', country: '' },
    deadline: '',
    funding: 'unknown',
    tier: 'target',
    status: 'active',
    website: '',
    direction: '',
    notes: '',
  }

  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (school: School) => {
    setForm(school)
    setEditing(school)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateSchool(editing.id, form)
    } else {
      addSchool(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">申请总览</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加学校
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? '编辑学校' : '添加学校'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">学校名称</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">项目</label>
                <input
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">城市</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.location.city}
                    onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">国家</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.location.country}
                    onChange={(e) => setForm({ ...form, location: { ...form.location, country: e.target.value } })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">截止日</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">申请方向</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">资助情况</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.funding}
                    onChange={(e) => setForm({ ...form, funding: e.target.value as FundingType })}
                  >
                    {Object.entries(FUNDING_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">梯队</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.tier}
                    onChange={(e) => setForm({ ...form, tier: e.target.value as TierType })}
                  >
                    {Object.entries(TIER_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">官网链接</label>
                <input
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://"
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeSchools.map((school) => (
          <div
            key={school.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-100">{school.name}</h3>
                <p className="text-sm text-slate-400">{school.program}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(school)}
                  className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSchoolToOnHold(school.id)}
                  className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="搁置"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定将该申请及关联的材料、导师与沟通记录、面试一起移入回收站吗？之后可以一起恢复。')) deleteSchool(school.id)
                  }}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs border ${tierColors[school.tier]}`}>
                {TIER_LABELS[school.tier]}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs border ${fundingColors[school.funding]}`}>
                {FUNDING_LABELS[school.funding]}
              </span>
              <CountdownBadge deadline={school.deadline} />
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">截止日</span>
                <span className="text-slate-300">{formatDate(school.deadline)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">位置</span>
                <span className="text-slate-300">{school.location.city}, {school.location.country}</span>
              </div>
              {school.direction && (
                <div className="flex justify-between">
                  <span className="text-slate-500">方向</span>
                  <span className="text-slate-300">{school.direction}</span>
                </div>
              )}
            </div>

            {school.website && (
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                访问官网
              </a>
            )}

            {school.notes && (
              <p className="mt-3 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-2">{school.notes}</p>
            )}
          </div>
        ))}
      </div>

      {activeSchools.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>暂无活跃申请学校</p>
          <button
            onClick={openAdd}
            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
          >
            添加第一个学校 →
          </button>
        </div>
      )}
    </div>
  )
}
