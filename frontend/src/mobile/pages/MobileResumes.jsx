import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Search, Filter, ChevronDown, User, Phone, Mail, Briefcase } from 'lucide-react'

const statusLabels = {
  pending: '待处理', reviewed: '已查看', interview: '面试中',
  hired: '已录用', rejected: '已拒绝',
}

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  reviewed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  interview: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  hired: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function MobileResumes() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    education: '',
    min_years: 0,
    max_years: 100,
  })
  const navigate = useNavigate()

  const loadResumes = async (reset = false) => {
    if (loading) return
    setLoading(true)
    const currentPage = reset ? 1 : page

    try {
      const data = await api.getResumes({
        page: currentPage,
        page_size: 20,
        search,
        ...filters,
      })

      if (reset) {
        setResumes(data.items)
        setPage(2)
      } else {
        setResumes((prev) => [...prev, ...data.items])
        setPage((p) => p + 1)
      }
      setHasMore(data.items.length === 20)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadResumes(true)
  }, [])

  const handleSearch = () => {
    loadResumes(true)
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setShowFilters(false)
    loadResumes(true)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索姓名、技能、职位..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 rounded-xl border transition-colors ${
            showFilters
              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">状态</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="reviewed">已查看</option>
              <option value="interview">面试中</option>
              <option value="hired">已录用</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">学历</label>
            <select
              value={filters.education}
              onChange={(e) => handleFilterChange('education', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">全部</option>
              <option value="本科">本科</option>
              <option value="硕士">硕士</option>
              <option value="博士">博士</option>
            </select>
          </div>
          <button
            onClick={applyFilters}
            className="w-full py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium"
          >
            应用筛选
          </button>
        </div>
      )}

      {/* Resume List */}
      <div className="space-y-3">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            onClick={() => navigate(`/resumes/${resume.id}`)}
            className="bg-white/5 rounded-2xl p-4 active:bg-white/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {(resume.name || '?')[0]}
                </div>
                <div>
                  <h3 className="text-white font-medium">{resume.name || '未解析'}</h3>
                  <p className="text-xs text-slate-400">{resume.current_title || '暂无职位'}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs border ${statusColors[resume.status] || 'bg-slate-700'}`}>
                {statusLabels[resume.status] || resume.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
              {resume.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={12} />
                  <span>{resume.phone}</span>
                </div>
              )}
              {resume.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail size={12} />
                  <span className="truncate">{resume.email}</span>
                </div>
              )}
              {resume.years_experience > 0 && (
                <div className="flex items-center gap-1.5">
                  <Briefcase size={12} />
                  <span>{resume.years_experience}年经验</span>
                </div>
              )}
              {resume.education && (
                <div className="flex items-center gap-1.5">
                  <User size={12} />
                  <span>{resume.education}</span>
                </div>
              )}
            </div>

            {resume.skills && resume.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {resume.skills.length > 5 && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-400 text-xs">
                    +{resume.skills.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => loadResumes()}
          disabled={loading}
          className="w-full py-3 bg-white/5 rounded-xl text-slate-400 text-sm disabled:opacity-50"
        >
          {loading ? '加载中...' : '加载更多'}
        </button>
      )}

      {/* Empty State */}
      {resumes.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <User size={24} className="text-slate-500" />
          </div>
          <p className="text-slate-500 text-sm">暂无简历</p>
        </div>
      )}

      {/* Bottom Spacer */}
      <div className="h-8" />
    </div>
  )
}
