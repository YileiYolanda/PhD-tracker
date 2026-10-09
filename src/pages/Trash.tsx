import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { collections } from '../lib/trackerData'
import type { ActiveData } from '../lib/trackerData'
import { trashLabels } from '../lib/trash'

export default function TrashPage() {
  const { trash, restoreFromTrash, permanentlyDelete } = useAppStore()
  const [filter, setFilter] = useState<keyof ActiveData | ''>('')
  const [message, setMessage] = useState('')
  const visible = trash.filter(entry => !filter || entry.kind === filter)
  return <div className="space-y-5">
    <div><h2 className="text-xl font-semibold">回收站 <span className="text-slate-400 text-sm">{trash.length} 项</span></h2>
      <p className="mt-2 text-sm text-slate-400">删除的记录保留在这里，不自动清理。云端模式下随账号同步，也包含在导出备份中。</p>
      <p className="mt-1 text-sm text-slate-400">删除学校时，其材料、导师及沟通记录、面试会一起移入同一项，恢复时一起还原。导师管理与沟通记录共用同一条数据。</p>
    </div>
    <label className="flex items-center gap-3 text-sm">记录类型<select value={filter} onChange={e => setFilter(e.target.value as keyof ActiveData | '')} className="rounded-lg bg-slate-800 p-2">
      <option value="">全部类型</option>{collections.map(key => <option key={key} value={key}>{trashLabels[key]}</option>)}
    </select></label>
    {message && <p role="status" className="rounded-lg border border-indigo-500/30 p-3 text-sm text-indigo-200">{message}</p>}
    {!visible.length && <p className="py-16 text-center text-slate-500">{trash.length ? '此类型暂无删除记录' : '回收站是空的'}</p>}
    {visible.map(entry => <article key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap justify-between gap-4"><div>
        <p className="text-xs text-indigo-300">{trashLabels[entry.kind]}</p>
        <h3 className="mt-1 font-semibold">{entry.label}</h3>
        <p className="mt-1 text-xs text-slate-400">删除时间：{new Date(entry.deletedAt).toLocaleString('zh-CN')}</p>
      </div><div className="flex items-center gap-3">
        <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm" onClick={() => {
          try { restoreFromTrash(entry.id); setMessage(`已恢复「${entry.label}」及该项中关联的记录。`) }
          catch (error) { setMessage(error instanceof Error ? error.message : '恢复失败，请重试。') }
        }}><RotateCcw className="h-4 w-4" />恢复</button>
        <button className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300" onClick={() => {
          if (prompt(`永久删除「${entry.label}」及该项内所有关联记录后，无法从回收站恢复。请输入“永久删除”确认：`) !== '永久删除') return
          permanentlyDelete(entry.id); setMessage(`已永久删除「${entry.label}」。`)
        }}><Trash2 className="h-4 w-4" />永久删除</button>
      </div></div>
      <details className="mt-4 text-sm text-slate-400"><summary className="cursor-pointer">包含的记录（{collections.reduce((count, key) => count + entry.data[key].length, 0)} 条）</summary>
        <ul className="mt-2 space-y-1">{collections.filter(key => entry.data[key].length).map(key => <li key={key}>{trashLabels[key]}：{entry.data[key].length} 条</li>)}</ul>
      </details>
    </article>)}
  </div>
}
