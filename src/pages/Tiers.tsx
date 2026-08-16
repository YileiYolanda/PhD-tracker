import { useState } from 'react'
import { ExternalLink, Filter } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { daysUntil, formatDate } from '../lib/utils'
import { FUNDING_LABELS, TIER_LABELS, type TierType, type FundingType } from '../types'

const tierOrder: TierType[] = ['reach', 'target', 'safety']

export default function Tiers() {
  const { schools } = useAppStore()
  const [filterCountry, setFilterCountry] = useState('')
  const [filterDirection, setFilterDirection] = useState('')
  const [filterFunding, setFilterFunding] = useState<FundingType | ''>('')

  const activeSchools = schools.filter((s) => s.status !== 'on-hold')

  const countries = Array.from(new Set(activeSchools.map((s) => s.location.country).filter(Boolean)))
  const directions = Array.from(new Set(activeSchools.map((s) => s.direction).filter(Boolean)))

  const filtered = activeSchools.filter((s) => {
    if (filterCountry && s.location.country !== filterCountry) return false
    if (filterDirection && s.direction !== filterDirection) return false
    if (filterFunding && s.funding !== filterFunding) return false
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">申请梯队</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Filter className="w-4 h-4" />
          筛选：
        </div>
        <select
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
        >
          <option value="">所有国家</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          value={filterDirection}
          onChange={(e) => setFilterDirection(e.target.value)}
        >
          <option value="">所有方向</option>
          {directions.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          value={filterFunding}
          onChange={(e) => setFilterFunding(e.target.value as FundingType | '')}
        >
          <option value="">所有资助</option>
          {Object.entries(FUNDING_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {(filterCountry || filterDirection || filterFunding) && (
          <button
            onClick={() => { setFilterCountry(''); setFilterDirection(''); setFilterFunding('') }}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            清除筛选
          </button>
        )}
      </div>

      <div className="space-y-8">
        {tierOrder.map((tier) => {
          const tierSchools = filtered.filter((s) => s.tier === tier)
          if (tierSchools.length === 0) return null

          return (
            <div key={tier}>
              <h3 className="flex items-center gap-2 text-lg font-medium mb-4">
                <span className={`w-3 h-3 rounded-full ${
                  tier === 'reach' ? 'bg-rose-500' : tier === 'target' ? 'bg-sky-500' : 'bg-emerald-500'
                }`} />
                {TIER_LABELS[tier]} · {tierSchools.length} 所
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="text-left py-2 px-3 font-medium">学校</th>
                      <th className="text-left py-2 px-3 font-medium">项目</th>
                      <th className="text-left py-2 px-3 font-medium">方向</th>
                      <th className="text-left py-2 px-3 font-medium">位置</th>
                      <th className="text-left py-2 px-3 font-medium">截止日</th>
                      <th className="text-left py-2 px-3 font-medium">倒计时</th>
                      <th className="text-left py-2 px-3 font-medium">资助</th>
                      <th className="text-left py-2 px-3 font-medium">状态</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierSchools.map((school) => {
                      const days = daysUntil(school.deadline)
                      return (
                        <tr key={school.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-100">{school.name}</td>
                          <td className="py-3 px-3 text-slate-300">{school.program}</td>
                          <td className="py-3 px-3 text-slate-400">{school.direction || '-'}</td>
                          <td className="py-3 px-3 text-slate-400">{school.location.city}, {school.location.country}</td>
                          <td className="py-3 px-3 text-slate-300">{formatDate(school.deadline)}</td>
                          <td className="py-3 px-3">
                            {days < 0 ? (
                              <span className="text-slate-500">已截止</span>
                            ) : days <= 7 ? (
                              <span className="text-red-400 font-medium">{days} 天</span>
                            ) : days <= 30 ? (
                              <span className="text-amber-400">{days} 天</span>
                            ) : (
                              <span className="text-slate-400">{days} 天</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs ${
                              school.funding === 'full' ? 'text-emerald-400' :
                              school.funding === 'partial' ? 'text-amber-400' :
                              school.funding === 'none' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                              {FUNDING_LABELS[school.funding]}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              school.status === 'applied' ? 'bg-sky-500/20 text-sky-300' :
                              school.status === 'admitted' ? 'bg-emerald-500/20 text-emerald-300' :
                              school.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {school.status === 'active' ? '进行中' : school.status === 'applied' ? '已提交' : school.status === 'admitted' ? '已录取' : school.status === 'rejected' ? '被拒' : school.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {school.website && (
                              <a
                                href={school.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-indigo-400 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p>没有符合条件的学校</p>
        </div>
      )}
    </div>
  )
}
