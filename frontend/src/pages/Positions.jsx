import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Briefcase, Plus, Search, Filter, MoreVertical, Users, MapPin, DollarSign } from 'lucide-react'

const statusLabels = {
  open: '招聘中',
  paused: '已暂停',
  closed: '已关闭',
}

const statusColors = {
  open: 'bg-green-500/20 text-green-300 border-green-500/30',
  paused: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export default function Positions() {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate = useNavigate()

  const loadPositions = async () => {
    setLoading(true)
    try {
      const data = await api.listPositions({ search, status: statusFilter })
      setPositions(data.items)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadPositions()
  }, [search, statusFilter])

  const handleCreate = async (formData) => {
    try {
      await api.createPosition(formData)
      setShowForm(false)
      loadPositions()
    } catch (e) {
      alert('创建失败: ' + e.message)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">招聘岗位</h1>
          <p className="text-sm text-zinc-500 mt-1">管理招聘岗位和候选人画像</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          新建岗位
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="搜索岗位名称、部门..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
        >
          <option value="">全部状态</option>
          <option value="open">招聘中</option>
          <option value="paused">已暂停</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      {/* Positions Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {positions.map((pos) => (
            <div
              key={pos.id}
              onClick={() => navigate(`/positions/${pos.id}`)}
              className="glass rounded-2xl p-5 cursor-pointer hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Briefcase size={20} className="text-white" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs border ${statusColors[pos.status] || statusColors.open}`}>
                  {statusLabels[pos.status] || pos.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                {pos.title}
              </h3>
              <p className="text-sm text-zinc-500 mb-4">{pos.department || '未指定部门'}</p>

              <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                {pos.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {pos.location}
                  </span>
                )}
                {(pos.salary_min || pos.salary_max) && (
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} />
                    {pos.salary_min || 0}-{pos.salary_max || 0}K
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  HC: {pos.headcount || 1}
                </span>
              </div>

              {pos.skills_required && pos.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {pos.skills_required.slice(0, 4).map((skill) => (
                    <span key={skill} className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-300 text-xs">
                      {skill}
                    </span>
                  ))}
                  {pos.skills_required.length > 4 && (
                    <span className="px-2 py-1 rounded-md bg-zinc-700 text-zinc-400 text-xs">
                      +{pos.skills_required.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && positions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Briefcase size={24} className="text-zinc-500" />
          </div>
          <p className="text-zinc-500">暂无招聘岗位</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm"
          >
            创建第一个岗位
          </button>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <PositionFormModal
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  )
}

function PositionFormModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    salary_min: '',
    salary_max: '',
    experience_min: '',
    experience_max: '',
    education_requirement: '',
    description: '',
    skills_required: '',
    headcount: 1,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      salary_min: Number(formData.salary_min) || 0,
      salary_max: Number(formData.salary_max) || 0,
      experience_min: Number(formData.experience_min) || 0,
      experience_max: Number(formData.experience_max) || 0,
      skills_required: formData.skills_required.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-white mb-6">新建岗位</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">岗位名称 *</label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              placeholder="例如：高级Java工程师"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">部门</label>
              <input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                placeholder="技术部"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">工作地点</label>
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                placeholder="杭州"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">最低薪资 (K)</label>
              <input
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">最高薪资 (K)</label>
              <input
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">学历要求</label>
            <select
              value={formData.education_requirement}
              onChange={(e) => setFormData({ ...formData, education_requirement: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">不限</option>
              <option value="大专">大专及以上</option>
              <option value="本科">本科及以上</option>
              <option value="硕士">硕士及以上</option>
              <option value="博士">博士</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">技能要求 (逗号分隔)</label>
            <input
              value={formData.skills_required}
              onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              placeholder="Java, Spring, MySQL..."
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-1 block">岗位描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none"
              placeholder="描述岗位职责和要求..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 text-zinc-400 text-sm hover:bg-white/10 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium"
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
