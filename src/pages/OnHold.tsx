import { PlayCircle, ExternalLink, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { formatDate } from '../lib/utils'
import { FUNDING_LABELS, TIER_LABELS } from '../types'

export default function OnHold() {
  const { schools, moveSchoolToActive, deleteSchool } = useAppStore()
  const onHoldSchools = schools.filter((s) => s.status === 'on-hold')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">备选与搁置</h2>
        <span className="text-sm text-slate-400">{onHoldSchools.length} 个项目</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {onHoldSchools.map((school) => (
          <div
            key={school.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors opacity-80"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-300">{school.name}</h3>
                <p className="text-sm text-slate-500">{school.program}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => moveSchoolToActive(school.id)}
                  className="p-1.5 text-slate-500 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="重新激活"
                >
                  <PlayCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定删除吗？')) deleteSchool(school.id)
                  }}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs border bg-slate-800 text-slate-400 border-slate-700">
                {TIER_LABELS[school.tier]}
              </span>
              <span className="px-2 py-0.5 rounded text-xs border bg-slate-800 text-slate-400 border-slate-700">
                {FUNDING_LABELS[school.funding]}
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">截止日</span>
                <span className="text-slate-500">{formatDate(school.deadline)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">位置</span>
                <span className="text-slate-500">{school.location.city}, {school.location.country}</span>
              </div>
              {school.direction && (
                <div className="flex justify-between">
                  <span className="text-slate-600">方向</span>
                  <span className="text-slate-500">{school.direction}</span>
                </div>
              )}
            </div>

            {school.website && (
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-3 text-sm text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                访问官网
              </a>
            )}

            {school.notes && (
              <p className="mt-3 text-xs text-slate-600 bg-slate-900 rounded-lg p-2">{school.notes}</p>
            )}
          </div>
        ))}
      </div>

      {onHoldSchools.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>暂无搁置项目</p>
          <p className="text-sm mt-2">在申请总览中点击「搁置」按钮可将项目移入此处</p>
        </div>
      )}
    </div>
  )
}
