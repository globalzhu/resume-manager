import { useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'
import ResumeCard from '../components/ResumeCard'
import {
  Search, Filter, FolderInput, Upload, Brain, ChevronLeft, ChevronRight,
  Trash2, CheckCircle, X, LayoutGrid, List,
} from 'lucide-react'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'reviewed', label: '已查看' },
  { value: 'interview', label: '面试中' },
  { value: 'hired', label: '已录用' },
  { value: 'rejected', label: '已拒绝' },
]

export default function Resumes() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(new Set())
  const [importing, setImporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [minYears, setMinYears] = useState('')
  const [maxYears, setMaxYears] = useState('')
  const [education, setEducation] = useState('')
  const [tag, setTag] = useState('')
  const [tags, setTags] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 20, search, status }
      if (minYears) params.min_years = minYears
      if (maxYears) params.max_years = maxYears
      if (education) params.education = education
      if (tag) params.tag = tag
      const res = await api.listResumes(params)
      setData(res)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [page, search, status, minYears, maxYears, education, tag])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.getTags().then(setTags).catch(() => {}) }, [])

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await api.importResumes()
      alert(`导入完成: 新增 ${res.imported} 份, 总共 ${res.total} 份`)
      load()
    } catch (e) {
      alert('Import failed: ' + e.message)
    }
    setImporting(false)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await api.uploadResume(file)
      load()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    e.target.value = ''
  }

  const handleBulkDelete = async () => {
    if (!selected.size || !confirm(`确定删除 ${selected.size} 份简历？`)) return
    await api.bulkAction({ ids: [...selected], action: 'delete' })
    setSelected(new Set())
    load()
  }

  const handleBulkStatus = async (newStatus) => {
    if (!selected.size) return
    await api.bulkAction({ ids: [...selected], action: 'update_status', value: newStatus })
    setSelected(new Set())
    load()
  }

  const handleParseBatch = async () => {
    try {
      const ids = selected.size > 0 ? [...selected] : null
      const res = await api.parseBatch(ids)
      alert(`已加入解析队列: ${res.queued} 份`)
      setTimeout(load, 2000)
    } catch (e) {
      alert('Parse failed: ' + e.message)
    }
  }

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === data.items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(data.items.map(r => r.id)))
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">简历管理</h1>
          <p className="text-sm text-zinc-500 mt-1">共 {data.total} 份简历</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImport} disabled={importing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
            <FolderInput size={15} /> {importing ? '导入中...' : '扫描导入'}
          </button>
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass text-sm text-zinc-300 hover:text-white cursor-pointer transition">
            <Upload size={15} /> 上传
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload} />
          </label>
          <button onClick={handleParseBatch}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass text-sm text-zinc-300 hover:text-white transition">
            <Brain size={15} /> AI解析
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="搜索姓名、技能、职位..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer min-w-[120px]"
          >
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm transition ${
              showFilters ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400'
            }`}
          >
            <Filter size={15} /> 筛选
          </button>
        </div>

        {showFilters && (
          <div className="glass p-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">最少年限</label>
              <input type="number" value={minYears} onChange={e => setMinYears(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">最多年限</label>
              <input type="number" value={maxYears} onChange={e => setMaxYears(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none" placeholder="100" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">学历</label>
              <input type="text" value={education} onChange={e => setEducation(e.target.value)}
                className="w-32 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none" placeholder="本科" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">标签</label>
              <select value={tag} onChange={e => { setTag(e.target.value); setPage(1) }}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none min-w-[120px]">
                <option value="">全部</option>
                {tags.map(([t, c]) => <option key={t} value={t}>{t} ({c})</option>)}
              </select>
            </div>
            <button onClick={() => { setMinYears(''); setMaxYears(''); setEducation(''); setTag(''); setPage(1) }}
              className="text-xs text-zinc-500 hover:text-white transition flex items-center gap-1">
              <X size={12} /> 清除
            </button>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="glass-strong p-3 flex items-center gap-3">
          <span className="text-sm text-zinc-300 ml-2">已选 {selected.size} 项</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => handleBulkStatus('reviewed')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20 transition">
              <CheckCircle size={13} /> 标记已查看
            </button>
            <button onClick={() => handleBulkStatus('interview')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs hover:bg-purple-500/20 transition">
              <CheckCircle size={13} /> 标记面试
            </button>
            <button onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition">
              <Trash2 size={13} /> 删除
            </button>
          </div>
        </div>
      )}

      {/* Select all */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
          <input type="checkbox" checked={data.items.length > 0 && selected.size === data.items.length}
            onChange={toggleSelectAll} className="accent-indigo-500 w-3.5 h-3.5" />
          全选当前页
        </label>
      </div>

      {/* Resume list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-600">暂无简历</p>
          <p className="text-sm text-zinc-700 mt-2">点击"扫描导入"从 Downloads 文件夹导入</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.items.map(r => (
            <ResumeCard key={r.id} resume={r} selected={selected.has(r.id)} onSelect={toggleSelect} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg glass text-zinc-400 hover:text-white disabled:opacity-30 transition">
            <ChevronLeft size={18} />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
              let p
              if (data.pages <= 7) p = i + 1
              else if (page <= 4) p = i + 1
              else if (page >= data.pages - 3) p = data.pages - 6 + i
              else p = page - 3 + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm transition ${
                    p === page ? 'bg-indigo-500 text-white' : 'glass text-zinc-400 hover:text-white'
                  }`}>
                  {p}
                </button>
              )
            })}
          </div>
          <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
            className="p-2 rounded-lg glass text-zinc-400 hover:text-white disabled:opacity-30 transition">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
