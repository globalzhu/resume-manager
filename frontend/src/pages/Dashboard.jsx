import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import StatsCard from '../components/StatsCard'
import {
  Users, UserPlus, Brain, Clock, FolderInput, Sparkles,
  ArrowRight, TrendingUp, Activity, BarChart3,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#ef4444', '#f59e0b']

const statusLabels = {
  pending: '待处理', reviewed: '已查看', interview: '面试中',
  hired: '已录用', rejected: '已拒绝',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [importing, setImporting] = useState(false)
  const navigate = useNavigate()

  const loadStats = () => api.getStats().then(setStats).catch(console.error)

  useEffect(() => { loadStats() }, [])

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await api.importResumes()
      alert(`导入完成: 新增 ${res.imported} 份, 总共 ${res.total} 份`)
      loadStats()
    } catch (e) {
      alert('导入失败: ' + e.message)
    }
    setImporting(false)
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statusData = Object.entries(stats.status_distribution).map(([k, v]) => ({
    name: statusLabels[k] || k, value: v,
  }))

  const expData = Object.entries(stats.experience_distribution).map(([k, v]) => ({
    name: k, value: v,
  }))

  const eduData = Object.entries(stats.education_distribution).map(([k, v]) => ({
    name: k, value: v,
  }))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">简历管理概览</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <FolderInput size={16} />
            {importing ? '导入中...' : '扫描导入'}
          </button>
          <button
            onClick={() => navigate('/resumes')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm text-zinc-300 hover:text-white transition-colors"
          >
            查看全部 <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Users} label="总简历" value={stats.total} color="indigo" delay={0} />
        <StatsCard icon={UserPlus} label="今日新增" value={stats.today_new} color="purple" delay={100} />
        <StatsCard icon={Brain} label="AI已解析" value={stats.parsed} color="blue" delay={200} />
        <StatsCard icon={TrendingUp} label="面试中" value={stats.status_distribution.interview || 0} color="green" delay={300} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status pie */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Activity size={16} className="text-indigo-400" /> 状态分布
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-600 text-sm text-center py-16">暂无数据</p>
          )}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {statusData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Experience bar */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-purple-400" /> 经验分布
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expData}>
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Education */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-blue-400" /> 学历分布
          </h3>
          {eduData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eduData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={60} tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-600 text-sm text-center py-16">需要AI解析后显示</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top skills */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-amber-400" /> 热门技能
          </h3>
          {stats.top_skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.top_skills.map(([skill, count]) => {
                const max = stats.top_skills[0][1]
                const intensity = 0.3 + (count / max) * 0.7
                return (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-lg text-xs border border-indigo-500/20 transition-transform hover:scale-105 cursor-default"
                    style={{
                      background: `rgba(99, 102, 241, ${intensity * 0.2})`,
                      color: `rgba(165, 180, 252, ${intensity})`,
                      fontSize: `${Math.max(11, Math.min(16, 11 + (count / max) * 5))}px`,
                    }}
                  >
                    {skill}
                    <span className="ml-1 opacity-50">{count}</span>
                  </span>
                )
              })}
            </div>
          ) : (
            <p className="text-zinc-600 text-sm text-center py-8">需要AI解析后显示</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Clock size={16} className="text-emerald-400" /> 最近活动
          </h3>
          <div className="space-y-3 max-h-64 overflow-auto">
            {stats.recent_activity.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
                onClick={() => navigate(`/resumes/${item.id}`)}
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0">
                  <Users size={14} className="text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{item.name || '未解析'}</p>
                  <p className="text-[11px] text-zinc-600 truncate">{item.filename}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`badge ${item.status === 'pending' ? 'badge-pending' : item.status === 'hired' ? 'badge-hired' : 'badge-reviewed'}`}>
                    {statusLabels[item.status] || item.status}
                  </span>
                  <p className="text-[10px] text-zinc-600 mt-1">{item.created_at?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
            {stats.recent_activity.length === 0 && (
              <p className="text-zinc-600 text-sm text-center py-8">暂无简历</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
