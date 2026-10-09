import { useState } from 'react'
import { Plus, Pencil, Trash2, Calendar, Clock } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { formatDate } from '../lib/utils'
import {
  INTERVIEW_FORMAT_LABELS,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_COLORS,
  INTERVIEW_RESULT_LABELS,
  type Interview,
  type InterviewFormat,
  type InterviewStatus,
} from '../types'

const resultColors: Record<string, string> = {
  positive: 'text-emerald-400',
  neutral: 'text-sky-400',
  negative: 'text-red-400',
  unknown: 'text-slate-400',
}

export default function InterviewsPage() {
  const { schools, professors, interviews, addInterview, updateInterview, deleteInterview } = useAppStore()
  const [editing, setEditing] = useState<Interview | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<Interview | null>(null)

  const activeSchools = schools.filter((s) => s.status !== 'on-hold')

  const emptyForm: Omit<Interview, 'id'> = {
    schoolId: activeSchools[0]?.id || '',
    professorId: undefined,
    professorName: '',
    dateTime: '',
    format: 'zoom',
    duration: 30,
    interviewer: '',
    status: 'scheduled',
    notesBefore: '',
    notesAfter: '',
    feedback: '',
    result: 'unknown',
  }

  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (interview: Interview) => {
    setForm(interview)
    setEditing(interview)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateInterview(editing.id, form)
    } else {
      addInterview(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditing(null)
  }

  const sortedInterviews = [...interviews].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">面试管理</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加面试
        </button>
      </div>

      {/* 添加/编辑弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? '编辑面试' : '添加面试'}</h3>
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
                  <label className="block text-sm text-slate-400 mb-1">关联导师（可选）</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.professorId || ''}
                    onChange={(e) => {
                      const pid = e.target.value || undefined
                      const prof = professors.find((p) => p.id === pid)
                      setForm({ ...form, professorId: pid, professorName: prof?.name || '' })
                    }}
                  >
                    <option value="">不关联</option>
                    {professors.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">面试时间</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.dateTime}
                    onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">面试形式</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value as InterviewFormat })}
                  >
                    {Object.entries(INTERVIEW_FORMAT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">时长（分钟）</label>
                  <input
                    type="number"
                    min={5}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">状态</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as InterviewStatus })}
                  >
                    {Object.entries(INTERVIEW_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">面试官</label>
                <input
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.interviewer}
                  onChange={(e) => setForm({ ...form, interviewer: e.target.value })}
                  placeholder="Prof. Smith + 1 committee member"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">面试前准备/备注</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.notesBefore}
                  onChange={(e) => setForm({ ...form, notesBefore: e.target.value })}
                  placeholder="需要准备的内容、想提问的问题..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">面试后记录</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.notesAfter}
                  onChange={(e) => setForm({ ...form, notesAfter: e.target.value })}
                  placeholder="面试过程中的感受、被问到的问题..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">反馈/结果</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.feedback}
                  onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                  placeholder="导师的反馈、后续安排..."
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">整体评估</label>
                <select
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  value={form.result}
                  onChange={(e) => setForm({ ...form, result: e.target.value as 'positive' | 'neutral' | 'negative' | 'unknown' })}
                >
                  {Object.entries(INTERVIEW_RESULT_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">
                    {schools.find((s) => s.id === viewing.schoolId)?.name} 面试
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-xs border ${INTERVIEW_STATUS_COLORS[viewing.status]}`}>
                    {INTERVIEW_STATUS_LABELS[viewing.status]}
                  </span>
                </div>
                {viewing.professorName && (
                  <p className="text-sm text-slate-400">导师：{viewing.professorName}</p>
                )}
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

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {viewing.dateTime ? formatDate(viewing.dateTime.split('T')[0]) : '-'} {viewing.dateTime?.split('T')[1] || ''}
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {viewing.duration ? `${viewing.duration} 分钟` : '-'} · {INTERVIEW_FORMAT_LABELS[viewing.format]}
                </div>
              </div>

              {viewing.interviewer && (
                <div className="text-sm text-slate-400">
                  <span className="text-slate-500">面试官：</span>{viewing.interviewer}
                </div>
              )}

              {viewing.notesBefore && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">面试前准备</h4>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400 whitespace-pre-wrap">
                    {viewing.notesBefore}
                  </div>
                </div>
              )}

              {viewing.notesAfter && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">面试记录</h4>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400 whitespace-pre-wrap">
                    {viewing.notesAfter}
                  </div>
                </div>
              )}

              {viewing.feedback && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">反馈</h4>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400 whitespace-pre-wrap">
                    {viewing.feedback}
                  </div>
                </div>
              )}

              {viewing.result && viewing.result !== 'unknown' && (
                <div className={`text-sm font-medium ${resultColors[viewing.result]}`}>
                  整体评估：{INTERVIEW_RESULT_LABELS[viewing.result]}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 面试列表 */}
      <div className="space-y-4">
        {sortedInterviews.map((interview) => {
          const school = schools.find((s) => s.id === interview.schoolId)
          const isPast = new Date(interview.dateTime) < new Date()
          return (
            <div
              key={interview.id}
              className={`bg-slate-900 border rounded-xl p-5 hover:border-slate-700 transition-colors cursor-pointer ${
                interview.status === 'completed'
                  ? 'border-slate-800/60'
                  : interview.status === 'cancelled'
                  ? 'border-slate-800/40 opacity-70'
                  : 'border-slate-800'
              }`}
              onClick={() => setViewing(interview)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100">{school?.name || '未知学校'}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs border ${INTERVIEW_STATUS_COLORS[interview.status]}`}>
                      {INTERVIEW_STATUS_LABELS[interview.status]}
                    </span>
                    {isPast && interview.status === 'scheduled' && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                        已过期
                      </span>
                    )}
                  </div>
                  {interview.professorName && (
                    <p className="text-sm text-slate-400">导师：{interview.professorName}</p>
                  )}
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(interview)}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('确定移入回收站吗？之后可在回收站恢复。')) deleteInterview(interview.id)
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-3 text-sm">
                <span className="flex items-center gap-1 text-slate-300">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {interview.dateTime ? `${formatDate(interview.dateTime.split('T')[0])} ${interview.dateTime.split('T')[1]}` : '-'}
                </span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {interview.duration ? `${interview.duration} 分钟` : '-'} · {INTERVIEW_FORMAT_LABELS[interview.format]}
                </span>
              </div>

              {interview.interviewer && (
                <p className="text-sm text-slate-400 mb-2">面试官：{interview.interviewer}</p>
              )}

              {interview.notesBefore && interview.status !== 'completed' && (
                <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
                  <p className="text-xs text-slate-500 mb-1">准备</p>
                  <p className="text-sm text-slate-300 line-clamp-2">{interview.notesBefore}</p>
                </div>
              )}

              {interview.feedback && interview.status === 'completed' && (
                <div className="bg-slate-800/50 rounded-lg p-3 mb-2">
                  <p className="text-xs text-slate-500 mb-1">反馈</p>
                  <p className="text-sm text-slate-300 line-clamp-2">{interview.feedback}</p>
                </div>
              )}

              {interview.result && interview.result !== 'unknown' && (
                <div className={`text-sm ${resultColors[interview.result]}`}>
                  评估：{INTERVIEW_RESULT_LABELS[interview.result]}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {interviews.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>暂无面试记录</p>
          <button onClick={openAdd} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
            添加第一条面试记录 →
          </button>
        </div>
      )}
    </div>
  )
}
