import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { MATERIAL_LABELS, type Material, type MaterialType, type MaterialStatus } from '../types'

const statusIcons = {
  'not-started': Circle,
  'in-progress': Clock,
  'completed': CheckCircle2,
}

const statusColors = {
  'not-started': 'text-slate-500',
  'in-progress': 'text-amber-400',
  'completed': 'text-emerald-400',
}

const statusLabels: Record<MaterialStatus, string> = {
  'not-started': '未开始',
  'in-progress': '进行中',
  'completed': '已完成',
}

const nextStatus: Record<MaterialStatus, MaterialStatus> = {
  'not-started': 'in-progress',
  'in-progress': 'completed',
  'completed': 'not-started',
}

export default function Materials() {
  const { schools, materials, addMaterial, updateMaterial, deleteMaterial } = useAppStore()
  const [editing, setEditing] = useState<Material | null>(null)
  const [showForm, setShowForm] = useState(false)

  const activeSchools = schools.filter((s) => s.status !== 'on-hold')

  const emptyForm: Omit<Material, 'id'> = {
    schoolId: activeSchools[0]?.id || '',
    type: 'sop',
    status: 'not-started',
    dueDate: undefined,
    notes: '',
    targetProfessor: undefined,
    sentDate: undefined,
    amount: undefined,
  }

  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (material: Material) => {
    setForm(material)
    setEditing(material)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateMaterial(editing.id, form)
    } else {
      addMaterial(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditing(null)
  }

  const toggleStatus = (material: Material) => {
    updateMaterial(material.id, { status: nextStatus[material.status] })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">材料清单</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加材料
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">{editing ? '编辑材料' : '添加材料'}</h3>
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
                      <option key={s.id} value={s.id}>{s.name} - {s.program}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">材料类型</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as MaterialType })}
                  >
                    {Object.entries(MATERIAL_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">截止日期</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.dueDate || ''}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value || undefined })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">发送日期</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.sentDate || ''}
                    onChange={(e) => setForm({ ...form, sentDate: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">关联导师（可选）</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.targetProfessor || ''}
                    onChange={(e) => setForm({ ...form, targetProfessor: e.target.value || undefined })}
                    placeholder="Prof. Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">金额（申请费时填写）</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.amount || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      setForm({ ...form, amount: isNaN(val) ? undefined : val })
                    }}
                    placeholder="USD"
                  />
                </div>
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

      <div className="space-y-6">
        {activeSchools.map((school) => {
          const schoolMaterials = materials.filter((m) => m.schoolId === school.id)
          const completedCount = schoolMaterials.filter((m) => m.status === 'completed').length
          const progress = schoolMaterials.length > 0 ? (completedCount / schoolMaterials.length) * 100 : 0

          return (
            <div key={school.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-100">{school.name}</h3>
                  <p className="text-sm text-slate-400">{school.program}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-medium text-slate-300">{completedCount}/{schoolMaterials.length}</span>
                    <p className="text-xs text-slate-500">已完成</p>
                  </div>
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {schoolMaterials.length === 0 ? (
                <p className="text-sm text-slate-500">暂无材料记录</p>
              ) : (
                <div className="space-y-2">
                  {schoolMaterials.map((material) => {
                    const StatusIcon = statusIcons[material.status]
                    return (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleStatus(material)}
                            className={`${statusColors[material.status]} hover:opacity-80 transition-opacity`}
                            title={`当前：${statusLabels[material.status]}，点击切换`}
                          >
                            <StatusIcon className="w-5 h-5" />
                          </button>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-slate-200">{MATERIAL_LABELS[material.type]}</span>
                              {material.targetProfessor && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                                  {material.targetProfessor}
                                </span>
                              )}
                              {material.amount !== undefined && material.amount > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                                  ${material.amount}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {material.dueDate && (
                                <span className="text-xs text-slate-500">截止：{material.dueDate}</span>
                              )}
                              {material.sentDate && (
                                <span className="text-xs text-emerald-500/80">已发送：{material.sentDate}</span>
                              )}
                            </div>
                            {material.notes && (
                              <p className="text-xs text-slate-500 mt-0.5">{material.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(material)}
                            className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('确定删除吗？')) deleteMaterial(material.id)
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
