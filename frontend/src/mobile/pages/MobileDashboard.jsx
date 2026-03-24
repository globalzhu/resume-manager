import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  Users, UserPlus, Brain, TrendingUp, FolderInput,
  Briefcase, GraduationCap, Clock
} from 'lucide-react'

const statusLabels = {
  pending: '待处理', reviewed: '已查看', interview: '面试中',
  hired: '已录用', rejected: '已拒绝',
}

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-300',
  reviewed: 'bg-blue-500/20 text-blue-300',
  interview: 'bg-purple-500/20 text-purple-300',
  hired: 'bg-green-500/20 text-green-300',
  rejected: 'bg-red-500/20 text-red-300',
}

export default function MobileDashboard() {
  const [stats, setStats] = useState(null)
  const [importing, setImporting] = useState(false)
  const navigate = useNavigate()

  const loadStats = () => api.getStats().then(setStats).catch(console.error)

  useEffect(() => { loadStats() }, [])

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await api.importResumes()
      alert(`导入完成: 新增 ${res.imported} 份`)
      loadStats()
    } catch (e) {
      alert('导入失败: ' + e.message)
    }
    setImporting(false)
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    { icon: Users, label: '总简历', value: stats.total, color: 'from-indigo-500 to-purple-600' },
    { icon: UserPlus, label: '今日新增', value: stats.today_new, color: 'from-emerald-500 to-teal-600' },
    { icon: Brain, label: 'AI已解析', value: stats.parsed, color: 'from-blue-500 to-cyan-600' },
    { icon: TrendingUp, label: '面试中', value: stats.status_distribution.interview || 0, color: 'from-orange-500 to-red-600' },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleImport}
          disabled={importing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
        >
          <FolderInput size={16} />
          {importing ? '导入中...' : '扫描导入'}
        </button>
        <button
          onClick={() => navigate('/resumes')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white text-sm font-medium active:scale-95 transition-transform"
        >
          <Users size={16} />
          查看简历
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} shadow-lg`}
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={18} className="text-white/80" />
              <span className="text-xs text-white/70">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Status Distribution */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Briefcase size={16} className="text-indigo-400" />
          状态分布
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.status_distribution).map(([status, count]) => (
            <span
              key={status}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-slate-700 text-slate-300'}`}
            >
              {statusLabels[status] || status}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Experience Distribution */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={16} className="text-purple-400" />
          经验分布
        </h3>
        <div className="space-y-2">
          {Object.entries(stats.experience_distribution).map(([exp, count]) => {
            const total = Object.values(stats.experience_distribution).reduce((a, b) => a + b, 0)
            const percentage = Math.round((count / total) * 100)
            return (
              <div key={exp} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-12">{exp}</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-300 w-10 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Education Distribution */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <GraduationCap size={16} className="text-blue-400" />
          学历分布
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.education_distribution).map(([edu, count]) => (
            <span
              key={edu}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs"
            >
              {edu}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Top Skills */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">热门技能</h3>
        <div className="flex flex-wrap gap-2">
          {stats.top_skills.slice(0, 15).map(([skill, count]) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/30"
            >
              {skill}
              <span className="ml-1 text-indigo-400/60">{count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">最近活动</h3>
        <div className="space-y-3">
          {stats.recent_activity.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/resumes/${item.id}`)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 active:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {(item.name || '?')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.name || '未解析'}</p>
                <p className="text-xs text-slate-500 truncate">{item.filename}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${statusColors[item.status] || 'bg-slate-700'}`}>
                {statusLabels[item.status] || item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="h-8" />
    </div>
  )
}
