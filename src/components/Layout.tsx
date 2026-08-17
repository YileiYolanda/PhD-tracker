import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Mail,
  FileText,
  Users,
  BarChart3,
  Archive,
  Download,
  Upload,
  RotateCcw,
  GraduationCap,
} from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { daysUntil } from '../lib/utils'

const navItems = [
  { to: '/', label: '申请总览', icon: LayoutDashboard },
  { to: '/materials', label: '材料清单', icon: ClipboardList },
  { to: '/outreach', label: '导师沟通', icon: Mail },
  { to: '/professors', label: '导师管理', icon: GraduationCap },
  { to: '/documents', label: '文书资料库', icon: FileText },
  { to: '/recommenders', label: '推荐人管理', icon: Users },
  { to: '/tiers', label: '申请梯队', icon: BarChart3 },
  { to: '/on-hold', label: '备选与搁置', icon: Archive },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { schools, exportData, importData, resetData } = useAppStore()

  const activeSchools = schools.filter((s) => s.status !== 'on-hold')
  const appliedCount = schools.filter((s) => s.status === 'applied' || s.status === 'admitted').length
  const urgentCount = activeSchools.filter((s) => {
    const days = daysUntil(s.deadline)
    return days <= 7 && days >= 0
  }).length

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `phd-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result as string
        importData(content)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-screen z-10">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-400" />
            博士申请管理器
          </h1>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ' +
                  (isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800')
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 w-full transition-colors"
          >
            <Download className="w-4 h-4" />
            导出备份
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 w-full transition-colors"
          >
            <Upload className="w-4 h-4" />
            导入备份
          </button>
          <button
            onClick={() => {
              if (confirm('确定重置为示例数据吗？当前数据将丢失。')) resetData()
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-300 hover:bg-slate-800 w-full transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置数据
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-56">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-400">{activeSchools.length}</span>
                <span className="text-sm text-slate-400">活跃申请</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-400">{appliedCount}</span>
                <span className="text-sm text-slate-400">已提交</span>
              </div>
              {urgentCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-400">{urgentCount}</span>
                  <span className="text-sm text-red-300">截止临近</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
