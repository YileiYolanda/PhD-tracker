import { useState } from 'react'
import { Plus, Pencil, Trash2, X, FileText, BookOpen, User, Folder } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { formatDate } from '../lib/utils'
import { type Document, type DocCategory } from '../types'

const categoryLabels: Record<DocCategory, string> = {
  sop: '个人陈述',
  ws: 'Writing Sample',
  cv: '简历',
  other: '其他',
}

const categoryIcons: Record<DocCategory, typeof FileText> = {
  sop: BookOpen,
  ws: FileText,
  cv: User,
  other: Folder,
}

export default function DocumentsPage() {
  const { schools, documents, addDocument, updateDocument, deleteDocument } = useAppStore()
  const [editing, setEditing] = useState<Document | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [viewing, setViewing] = useState<Document | null>(null)

  const emptyForm: Omit<Document, 'id' | 'updatedAt'> = {
    title: '',
    category: 'sop',
    targetSchool: undefined,
    targetDirection: undefined,
    content: '',
  }

  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (doc: Document) => {
    setForm(doc)
    setEditing(doc)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateDocument(editing.id, form)
    } else {
      addDocument(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditing(null)
  }

  const grouped = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<DocCategory, Document[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">文书资料库</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加文书
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editing ? '编辑文书' : '添加文书'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">标题</label>
                  <input
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">分类</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as DocCategory })}
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">目标学校（可选）</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.targetSchool}
                    onChange={(e) => setForm({ ...form, targetSchool: e.target.value })}
                  >
                    <option value="">通用</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">目标方向（可选）</label>
                  <input
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                    value={form.targetDirection}
                    onChange={(e) => setForm({ ...form, targetDirection: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">内容</label>
                <textarea
                  rows={10}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="在此编辑你的文书内容..."
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

      {viewing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{viewing.title}</h3>
                <div className="flex gap-2 mt-1 text-xs text-slate-400">
                  <span>{categoryLabels[viewing.category]}</span>
                  {viewing.targetSchool && <span>· {viewing.targetSchool}</span>}
                  {viewing.targetDirection && <span>· {viewing.targetDirection}</span>}
                  <span>· 更新于 {formatDate(viewing.updatedAt)}</span>
                </div>
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
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-4 whitespace-pre-wrap text-sm text-slate-200 leading-relaxed font-mono">
              {viewing.content || <span className="text-slate-500 italic">暂无内容</span>}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {(Object.keys(grouped) as DocCategory[]).map((category) => {
          const Icon = categoryIcons[category]
          return (
            <div key={category}>
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-3">
                <Icon className="w-4 h-4 text-indigo-400" />
                {categoryLabels[category]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {grouped[category].map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors cursor-pointer"
                    onClick={() => setViewing(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-100">{doc.title}</h4>
                        <div className="flex gap-2 mt-1 text-xs text-slate-500">
                          {doc.targetSchool && <span>{doc.targetSchool}</span>}
                          {doc.targetDirection && <span>{doc.targetDirection}</span>}
                          <span>更新于 {formatDate(doc.updatedAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEdit(doc)}
                          className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('确定移入回收站吗？之后可在回收站恢复。')) deleteDocument(doc.id)
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                      {doc.content || '暂无内容'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {documents.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>暂无文书</p>
          <button onClick={openAdd} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
            添加第一份文书 →
          </button>
        </div>
      )}
    </div>
  )
}
