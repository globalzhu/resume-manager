import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  ArrowLeft, Briefcase, MapPin, GraduationCap, Clock, DollarSign, Users,
  Edit3, Trash2, Star, UserCheck, Plus, X, ChevronDown, ChevronUp, Save,
} from 'lucide-react'

const statusOptions = [
  { value: 'open', label: '招聘中', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'paused', label: '已暂停', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'closed', label: '已关闭', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
]

export default function MobilePositionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [position, setPosition] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [matches, setMatches] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [expandedMatch, setExpandedMatch] = useState({})
  const [showProfilePicker, setShowProfilePicker] = useState(false)
  const [allProfiles, setAllProfiles] = useState([])

  const load = useCallback(async () => {
    const data = await api.getPosition(id)
    setPosition(data)
    setForm({
      ...data,
      skills_required: (data.skills_required || []).join(', '),
      requirements: (data.requirements || []).join('\n'),
    })
  }, [id])

  useEffect(() => { load() }, [load])

  if (!position) return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>

  const handleSave = async () => {
    try {
      await api.updatePosition(id, {
        ...form,
        skills_required: form.skills_required ? String(form.skills_required).split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
        requirements: form.requirements ? String(form.requirements).split('\n').map(s => s.trim()).filter(Boolean) : [],
      })
      setEditing(false)
      load()
    } catch (err) { alert('保存失败: ' + err.message) }
  }

  const handleDelete = async () => {
    if (!confirm('确认删除？')) return
    await api.deletePosition(id)
    navigate('/positions')
  }

  const handleStatusChange = async (status) => {
    await api.updatePosition(id, { status })
    load()
  }

  const handleMatch = async () => {
    setMatchLoading(true)
    try {
      const res = await api.matchResumes(id)
      setMatches(res)
    } catch (err) { alert('匹配失败: ' + err.message) }
    setMatchLoading(false)
  }

  const linkedIds = new Set((position.profiles || []).map(p => p.id))

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/positions')} className="p-1.5 rounded-lg bg-white/5 text-slate-400">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate">{position.title}</h1>
          <p className="text-xs text-slate-400">{position.department}{position.department && position.location ? ' · ' : ''}{position.location}</p>
        </div>
        <div className="flex gap-1.5">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="p-2 rounded-lg bg-white/5 text-slate-400"><Edit3 size={16} /></button>
          ) : (
            <button onClick={handleSave} className="p-2 rounded-lg bg-indigo-500 text-white"><Save size={16} /></button>
          )}
          <button onClick={handleDelete} className="p-2 rounded-lg bg-white/5 text-red-400"><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {statusOptions.map(opt => (
          <button key={opt.value} onClick={() => handleStatusChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition ${position.status === opt.value ? opt.color : 'border-white/10 text-slate-500'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {editing ? (
        /* Edit Form */
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 mb-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">岗位名称</label>
            <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">部门</label>
              <input value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">地点</label>
              <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">技能要求 (逗号分隔)</label>
            <input value={form.skills_required || ''} onChange={e => setForm({ ...form, skills_required: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">岗位描述</label>
            <textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm">取消</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium">保存</button>
          </div>
        </div>
      ) : (
        /* Info Display */
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 mb-3">
            {position.location && <div className="flex items-center gap-1.5"><MapPin size={12} className="text-slate-500" />{position.location}</div>}
            {position.education_requirement && <div className="flex items-center gap-1.5"><GraduationCap size={12} className="text-slate-500" />{position.education_requirement}</div>}
            {(position.experience_min > 0 || position.experience_max > 0) && <div className="flex items-center gap-1.5"><Clock size={12} className="text-slate-500" />{position.experience_min}-{position.experience_max}年</div>}
            {(position.salary_min > 0 || position.salary_max > 0) && <div className="flex items-center gap-1.5"><DollarSign size={12} className="text-slate-500" />{position.salary_min}-{position.salary_max}k</div>}
            <div className="flex items-center gap-1.5"><Users size={12} className="text-slate-500" />招{position.headcount}人</div>
          </div>

          {position.description && (
            <div className="mb-3">
              <h4 className="text-[11px] text-slate-500 uppercase mb-1">岗位描述</h4>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{position.description}</p>
            </div>
          )}

          {position.requirements?.length > 0 && (
            <div className="mb-3">
              <h4 className="text-[11px] text-slate-500 uppercase mb-1">岗位要求</h4>
              {position.requirements.map((r, i) => (
                <p key={i} className="text-xs text-slate-300 flex gap-1.5 mb-0.5"><span className="text-indigo-400">•</span>{r}</p>
              ))}
            </div>
          )}

          {position.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {position.skills_required.map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profiles */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">候选人画像</h3>
          <div className="flex gap-2">
            <button onClick={async () => { const res = await api.listProfiles({ page_size: 100 }); setAllProfiles(res.items); setShowProfilePicker(true) }}
              className="text-xs text-indigo-400 flex items-center gap-1"><Plus size={12} />关联</button>
            <button onClick={() => navigate('/profiles/new')} className="text-xs text-indigo-400">新建</button>
          </div>
        </div>

        {(position.profiles || []).length === 0 ? (
          <p className="text-xs text-slate-500">暂未关联画像</p>
        ) : (
          <div className="space-y-2">
            {position.profiles.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="min-w-0 flex-1" onClick={() => navigate(`/profiles/${p.id}/edit`)}>
                  <p className="text-xs text-white font-medium truncate">{p.name}</p>
                  {p.skills_required?.length > 0 && (
                    <div className="flex gap-1 mt-1 overflow-hidden">
                      {p.skills_required.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-300 whitespace-nowrap">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={async () => { await api.unlinkProfile(id, p.id); load() }} className="text-slate-500 hover:text-red-400 ml-2"><X size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Matching */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-1.5">
            <Star size={14} className="text-amber-400" /> 智能匹配
          </h3>
          <button onClick={handleMatch} disabled={matchLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-50">
            <UserCheck size={12} />{matchLoading ? '匹配中...' : '开始匹配'}
          </button>
        </div>

        {matches && (
          <div className="space-y-2">
            {matches.length === 0 && <p className="text-xs text-slate-500">未找到匹配候选人</p>}
            {matches.map((m, idx) => (
              <div key={m.resume.id} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      m.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                      m.score >= 60 ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-500/20 text-zinc-400'
                    }`}>{idx + 1}</div>
                    <div className="min-w-0" onClick={() => navigate(`/resumes/${m.resume.id}`)}>
                      <p className="text-xs text-white font-medium truncate">{m.resume.name || m.resume.filename}</p>
                      <p className="text-[10px] text-slate-500">{m.resume.current_title} · {m.resume.years_experience}年</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${m.score >= 80 ? 'text-emerald-400' : m.score >= 60 ? 'text-amber-400' : 'text-zinc-400'}`}>{m.score}</span>
                    <button onClick={() => setExpandedMatch(p => ({ ...p, [m.resume.id]: !p[m.resume.id] }))} className="text-slate-500">
                      {expandedMatch[m.resume.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                {expandedMatch[m.resume.id] && (
                  <div className="mt-2 pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
                    {Object.entries(m.details).map(([key, d]) => (
                      <div key={key} className="text-[10px]">
                        <span className="text-slate-500">{
                          key === 'skills_required' ? '必需技能' :
                          key === 'skills_preferred' ? '优先技能' :
                          key === 'experience' ? '经验' :
                          key === 'education' ? '学历' :
                          key === 'title' ? '岗位' : key
                        }</span>
                        <span className={`ml-1 font-medium ${d.score >= 80 ? 'text-emerald-300' : d.score >= 60 ? 'text-amber-300' : 'text-red-300'}`}>{d.score}分</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Picker Modal */}
      {showProfilePicker && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowProfilePicker(false)}>
          <div className="w-full bg-slate-800 rounded-t-3xl p-5 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">关联画像</h3>
              <button onClick={() => setShowProfilePicker(false)} className="text-slate-400"><X size={18} /></button>
            </div>
            {allProfiles.length === 0 ? (
              <p className="text-xs text-slate-500">暂无画像</p>
            ) : (
              <div className="space-y-2">
                {allProfiles.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.03]">
                    <div>
                      <p className="text-xs text-white">{p.name}</p>
                      {p.description && <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>}
                    </div>
                    {linkedIds.has(p.id) ? (
                      <span className="text-[10px] text-indigo-300">已关联</span>
                    ) : (
                      <button onClick={async () => { await api.linkProfile(id, p.id); load(); setShowProfilePicker(false) }}
                        className="text-xs px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300">关联</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
