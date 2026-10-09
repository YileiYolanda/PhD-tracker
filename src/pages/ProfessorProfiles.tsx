import { useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, Mail, Calendar, AlertCircle, BookOpen, Users, FileCheck } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { formatDate } from '../lib/utils'
import {
  OUTREACH_RESULT_LABELS,
  IMPACT_LABELS,
  ADMISSION_STATUS_LABELS,
  ADMISSION_STATUS_COLORS,
  type Professor,
  type OutreachResult,
  type ImpactLevel,
  type AdmissionStatusType,
} from '../types'

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

export default function ProfessorProfiles() {
  const { schools, professors, addProfessor, updateProfessor, deleteProfessor } = useAppStore()
  const [editing, setEditing] = useState<Professor | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<Professor | null>(null)

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
    homepage: '',
    researchAreas: '',
    admissionStatus: 'unknown',
    requirements: '',
    recentPapers: '',
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
        <h2 className="text-xl font-semibold">导师管理</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加导师
        </button>
      </div>

      {/* 添加/编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? '编辑导师' : '添加导师'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm text-slate-400 mb-1">导师姓名</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">职务</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
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
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">个人主页</label>
                <input
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.homepage}
                  onChange={(e) => setForm({ ...form, homepage: e.target.value })}
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">研究方向</label>
                <input
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.researchAreas}
                  onChange={(e) => setForm({ ...form, researchAreas: e.target.value })}
                  placeholder="Computer Vision, NLP, Robotics..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">招收情况</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.admissionStatus}
                    onChange={(e) => setForm({ ...form, admissionStatus: e.target.value as AdmissionStatusType })}
                  >
                    {Object.entries(ADMISSION_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
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
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">具体要求</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  placeholder="导师对申请者的具体要求，如编程能力、论文发表、研究经历等..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">近年论文</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                  value={form.recentPapers}
                  onChange={(e) => setForm({ ...form, recentPapers: e.target.value })}
                  placeholder={`1. Author et al. (2026). "Title." Venue.\n2. Author et al. (2025). "Title." Venue.`}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">邮件内容摘要</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.lastEmailContent}
                  onChange={(e) => setForm({ ...form, lastEmailContent: e.target.value })}
                  placeholder="最近一次与导师的邮件沟通内容..."
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

      {/* 详情弹窗 */}
      {viewing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{viewing.name}</h3>
                <p className="text-sm text-slate-400">
                  {viewing.title} · {schools.find((s) => s.id === viewing.schoolId)?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setViewing(null)
                    openEdit(viewing)
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  编辑
                </button>
                <button
                  onClick={() => setViewing(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* 基本信息 */}
              <div className="flex flex-wrap gap-2">
                {viewing.admissionStatus && (
                  <span className={`px-2 py-0.5 rounded text-xs border ${ADMISSION_STATUS_COLORS[viewing.admissionStatus]}`}>
                    {ADMISSION_STATUS_LABELS[viewing.admissionStatus]}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded text-xs border ${impactColors[viewing.impact]}`}>
                  影响：{IMPACT_LABELS[viewing.impact]}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {viewing.email && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <a href={`mailto:${viewing.email}`} className="text-indigo-400 hover:text-indigo-300">{viewing.email}</a>
                  </div>
                )}
                {viewing.homepage && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <a href={viewing.homepage} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 truncate">{viewing.homepage}</a>
                  </div>
                )}
              </div>

              {/* 研究方向 */}
              {viewing.researchAreas && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    研究方向
                  </h4>
                  <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">{viewing.researchAreas}</p>
                </div>
              )}

              {/* 具体要求 */}
              {viewing.requirements && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    具体要求
                  </h4>
                  <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap">{viewing.requirements}</p>
                </div>
              )}

              {/* 近年论文 */}
              {viewing.recentPapers && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    近年论文
                  </h4>
                  <div className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed">
                    {viewing.recentPapers}
                  </div>
                </div>
              )}

              {/* 沟通记录 */}
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  沟通记录
                </h4>
                <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                  <div className={`text-sm ${resultColors[viewing.result]}`}>
                    结果：{OUTREACH_RESULT_LABELS[viewing.result]}
                  </div>
                  {viewing.firstContactDate && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      首次联系：{formatDate(viewing.firstContactDate)}
                    </div>
                  )}
                  {viewing.followUpDate && (
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      跟进时间：{formatDate(viewing.followUpDate)}
                    </div>
                  )}
                  {viewing.lastEmailContent && (
                    <div className="text-sm text-slate-300 mt-2 border-t border-slate-700 pt-2">
                      {viewing.lastEmailContent}
                    </div>
                  )}
                  {viewing.notes && (
                    <p className="text-xs text-slate-500 mt-1">备注：{viewing.notes}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 导师卡片列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {professors.map((prof) => {
          const school = schools.find((s) => s.id === prof.schoolId)
          return (
            <div
              key={prof.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors cursor-pointer"
              onClick={() => setViewing(prof)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-100 hover:text-indigo-300 transition-colors">{prof.name}</h3>
                  <p className="text-sm text-slate-400">{prof.title}{school ? ` · ${school.name}` : ''}</p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(prof)}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定移入回收站吗？之后可在回收站恢复。')) deleteProfessor(prof.id)
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {prof.admissionStatus && (
                  <span className={`px-2 py-0.5 rounded text-xs border ${ADMISSION_STATUS_COLORS[prof.admissionStatus]}`}>
                    {ADMISSION_STATUS_LABELS[prof.admissionStatus]}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded text-xs border ${impactColors[prof.impact]}`}>
                  影响：{IMPACT_LABELS[prof.impact]}
                </span>
              </div>

              <div className="space-y-1.5 text-sm">
                {prof.researchAreas && (
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                    <span className="text-slate-400 line-clamp-2">{prof.researchAreas}</span>
                  </div>
                )}
                {prof.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400 truncate">{prof.email}</span>
                  </div>
                )}
                <div className={`text-sm ${resultColors[prof.result]}`}>
                  沟通结果：{OUTREACH_RESULT_LABELS[prof.result]}
                </div>
              </div>

              {prof.notes && (
                <p className="mt-3 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-2">{prof.notes}</p>
              )}
            </div>
          )
        })}
      </div>

      {professors.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>暂无导师档案</p>
          <button onClick={openAdd} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
            添加第一位导师 →
          </button>
        </div>
      )}
    </div>
  )
}
