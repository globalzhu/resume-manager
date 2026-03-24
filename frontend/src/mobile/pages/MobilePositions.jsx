import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Plus, Search, Briefcase, MapPin, Clock, DollarSign, Users, X } from 'lucide-react'

const statusColors = {
  open: 'bg-emerald-500/20 text-emerald-300',
  closed: 'bg-zinc-500/20 text-zinc-400',
  paused: 'bg-amber-500/20 text-amber-300',
}
const statusLabels = { open: '招聘中', closed: '已关闭', paused: '已暂停' }

export default function MobilePositions() {
  const navigate = useNavigate()
  const [positions, setPositions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ title: '', department: '', location: '', description: '', education_requirement: '', experience_min: 0, experience_max: 0, salary_min: 0, salary_max: 0, headcount: 1, skills_required: '' })

  const load = useCallback(async () => {
    const params = { page, page_size: 20 }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    const res = await api.listPositions(params)
    setPositions(res.items)
    setTotal(res.total)
    setPages(res.pages)
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...form,
        skills_required: form.skills_required ? form.skills_required.split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
      }
      const pos = await api.createPosition(data)
      setShowCreate(false)
      navigate(`/positions/${pos.id}`)
    } catch (err) {
      alert('创建失败: ' + err.message)
    }
  }

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">招聘岗位</h2>
          <p className="text-xs text-slate-400">共 {total} 个岗位</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium">
          <Plus size={14} /> 新建
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" placeholder="搜索岗位..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50" />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[{ v: '', l: '全部' }, { v: 'open', l: '招聘中' }, { v: 'paused', l: '已暂停' }, { v: 'closed', l: '已关闭' }].map(s => (
          <button key={s.v} onClick={() => { setStatusFilter(s.v); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition ${statusFilter === s.v ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
            {s.l}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {positions.map(pos => (
          <div key={pos.id} onClick={() => navigate(`/positions/${pos.id}`)}
            className="bg-white/5 rounded-2xl p-4 border border-white/10 active:bg-white/10 transition">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Briefcase size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{pos.title}</h3>
                  {pos.department && <p className="text-[11px] text-slate-500">{pos.department}</p>}
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[pos.status] || statusColors.open}`}>
                {statusLabels[pos.status] || pos.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 mb-2">
              {pos.location && <span className="flex items-center gap-1"><MapPin size={10} />{pos.location}</span>}
              {(pos.experience_min > 0 || pos.experience_max > 0) && <span className="flex items-center gap-1"><Clock size={10} />{pos.experience_min}-{pos.experience_max}年</span>}
              {(pos.salary_min > 0 || pos.salary_max > 0) && <span className="flex items-center gap-1"><DollarSign size={10} />{pos.salary_min}-{pos.salary_max}k</span>}
              <span className="flex items-center gap-1"><Users size={10} />招{pos.headcount}人</span>
            </div>

            {pos.skills_required?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pos.skills_required.slice(0, 4).map((s, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300">{s}</span>
                ))}
                {pos.skills_required.length > 4 && <span className="text-[10px] text-slate-500">+{pos.skills_required.length - 4}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">暂无岗位</p>
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-4 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 bg-white/5 disabled:opacity-30">上一页</button>
          <span className="text-sm text-slate-500 py-2">{page}/{pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 bg-white/5 disabled:opacity-30">下一页</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowCreate(false)}>
          <div className="w-full bg-slate-800 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">新建岗位</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">岗位名称 *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">部门</label>
                  <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">地点</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">经验(年)</label>
                  <div className="flex gap-1 items-center">
                    <input type="number" min="0" value={form.experience_min} onChange={e => setForm({ ...form, experience_min: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
                    <span className="text-slate-500">-</span>
                    <input type="number" min="0" value={form.experience_max} onChange={e => setForm({ ...form, experience_max: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">薪资(k)</label>
                  <div className="flex gap-1 items-center">
                    <input type="number" min="0" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
                    <span className="text-slate-500">-</span>
                    <input type="number" min="0" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">技能要求 (逗号分隔)</label>
                <input value={form.skills_required} onChange={e => setForm({ ...form, skills_required: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">岗位描述</label>
                <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none resize-none" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium">创建岗位</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
