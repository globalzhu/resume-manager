import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import {
  ArrowLeft, Briefcase, MapPin, GraduationCap, Clock, DollarSign, Users,
  Edit3, Trash2, Save, X, Plus, UserCheck, Star, ChevronDown, ChevronUp,
} from 'lucide-react'

const statusOptions = [
  { value: 'open', label: '招聘中', color: 'bg-emerald-500/20 text-emerald-300' },
  { value: 'paused', label: '已暂停', color: 'bg-amber-500/20 text-amber-300' },
  { value: 'closed', label: '已关闭', color: 'bg-zinc-500/20 text-zinc-400' },
]

export default function PositionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [position, setPosition] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [matches, setMatches] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [allProfiles, setAllProfiles] = useState([])
  const [matchExpanded, setMatchExpanded] = useState({})

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

  if (!position) return <div className="flex items-center justify-center h-64 text-zinc-500">加载中...</div>

  const handleSave = async () => {
    try {
      await api.updatePosition(id, {
        ...form,
        skills_required: form.skills_required ? String(form.skills_required).split(/[,，]/).map(s => s.trim()).filter(Boolean) : [],
        requirements: form.requirements ? String(form.requirements).split('\n').map(s => s.trim()).filter(Boolean) : [],
      })
      setEditing(false)
      load()
    } catch (err) {
      alert('保存失败: ' + err.message)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确认删除该岗位？')) return
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
    } catch (err) {
      alert('匹配失败: ' + err.message)
    }
    setMatchLoading(false)
  }

  const handleLinkProfile = async (profileId) => {
    await api.linkProfile(id, profileId)
    load()
    setShowProfileForm(false)
  }

  const handleUnlinkProfile = async (profileId) => {
    await api.unlinkProfile(id, profileId)
    load()
  }

  const loadAllProfiles = async () => {
    const res = await api.listProfiles({ page_size: 100 })
    setAllProfiles(res.items)
    setShowProfileForm(true)
  }

  const linkedIds = new Set((position.profiles || []).map(p => p.id))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/positions')} className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{position.title}</h1>
          <p className="text-sm text-zinc-400">{position.department}{position.department && position.location ? ' · ' : ''}{position.location}</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06]">
              <Edit3 size={14} /> 编辑
            </button>
          ) : (
            <>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-indigo-500 text-white hover:brightness-110">
                <Save size={14} /> 保存
              </button>
              <button onClick={() => { setEditing(false); setForm({ ...position, skills_required: (position.skills_required || []).join(', '), requirements: (position.requirements || []).join('\n') }) }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06]">
                <X size={14} /> 取消
              </button>
            </>
          )}
          <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <Trash2 size={14} /> 删除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Position Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status */}
          <div className="flex gap-2">
            {statusOptions.map(opt => (
              <button key={opt.value} onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${position.status === opt.value ? opt.color + ' ring-1 ring-current' : 'text-zinc-500 hover:bg-white/[0.04]'}`}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Info Card */}
          <div className="glass rounded-2xl p-5 space-y-4">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">岗位名称</label>
                    <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">部门</label>
                    <input value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">地点</label>
                    <input value={form.location || ''} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">学历要求</label>
                    <select value={form.education_requirement || ''} onChange={e => setForm({ ...form, education_requirement: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none">
                      <option value="">不限</option>
                      <option value="大专">大专</option>
                      <option value="本科">本科</option>
                      <option value="硕士">硕士</option>
                      <option value="博士">博士</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">经验 (年)</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" min="0" step="0.5" value={form.experience_min || 0} onChange={e => setForm({ ...form, experience_min: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                      <span className="text-zinc-500">-</span>
                      <input type="number" min="0" step="0.5" value={form.experience_max || 0} onChange={e => setForm({ ...form, experience_max: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">薪资 (k)</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" min="0" value={form.salary_min || 0} onChange={e => setForm({ ...form, salary_min: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                      <span className="text-zinc-500">-</span>
                      <input type="number" min="0" value={form.salary_max || 0} onChange={e => setForm({ ...form, salary_max: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">招聘人数</label>
                    <input type="number" min="1" value={form.headcount || 1} onChange={e => setForm({ ...form, headcount: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">技能要求 (逗号分隔)</label>
                  <input value={form.skills_required || ''} onChange={e => setForm({ ...form, skills_required: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">岗位描述</label>
                  <textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">岗位要求 (每行一条)</label>
                  <textarea rows={3} value={form.requirements || ''} onChange={e => setForm({ ...form, requirements: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {position.location && (
                    <div className="flex items-center gap-2 text-zinc-300"><MapPin size={14} className="text-zinc-500" />{position.location}</div>
                  )}
                  {position.education_requirement && (
                    <div className="flex items-center gap-2 text-zinc-300"><GraduationCap size={14} className="text-zinc-500" />{position.education_requirement}</div>
                  )}
                  {(position.experience_min > 0 || position.experience_max > 0) && (
                    <div className="flex items-center gap-2 text-zinc-300"><Clock size={14} className="text-zinc-500" />{position.experience_min}-{position.experience_max}年经验</div>
                  )}
                  {(position.salary_min > 0 || position.salary_max > 0) && (
                    <div className="flex items-center gap-2 text-zinc-300"><DollarSign size={14} className="text-zinc-500" />{position.salary_min}-{position.salary_max}k</div>
                  )}
                  <div className="flex items-center gap-2 text-zinc-300"><Users size={14} className="text-zinc-500" />招聘 {position.headcount} 人</div>
                </div>

                {position.description && (
                  <div>
                    <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">岗位描述</h3>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{position.description}</p>
                  </div>
                )}

                {position.requirements?.length > 0 && (
                  <div>
                    <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">岗位要求</h3>
                    <ul className="space-y-1">
                      {position.requirements.map((r, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex gap-2">
                          <span className="text-indigo-400 shrink-0">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {position.skills_required?.length > 0 && (
                  <div>
                    <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-2">技能要求</h3>
                    <div className="flex flex-wrap gap-2">
                      {position.skills_required.map((s, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Smart Matching */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Star size={16} className="text-amber-400" /> 智能匹配
              </h3>
              <button onClick={handleMatch} disabled={matchLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 disabled:opacity-50">
                <UserCheck size={14} />
                {matchLoading ? '匹配中...' : '开始匹配'}
              </button>
            </div>

            {matches && (
              <div className="space-y-3">
                {matches.length === 0 && <p className="text-sm text-zinc-500">未找到匹配的候选人</p>}
                {matches.map((m, idx) => (
                  <div key={m.resume.id} className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          m.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                          m.score >= 60 ? 'bg-amber-500/20 text-amber-300' :
                          'bg-zinc-500/20 text-zinc-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <span className="text-white font-medium cursor-pointer hover:text-indigo-300"
                            onClick={() => navigate(`/resumes/${m.resume.id}`)}>
                            {m.resume.name || m.resume.filename}
                          </span>
                          <p className="text-xs text-zinc-500">{m.resume.current_title} · {m.resume.years_experience}年经验</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-lg font-bold ${
                          m.score >= 80 ? 'text-emerald-400' :
                          m.score >= 60 ? 'text-amber-400' :
                          'text-zinc-400'
                        }`}>
                          {m.score}分
                        </div>
                        <button onClick={() => setMatchExpanded(prev => ({ ...prev, [m.resume.id]: !prev[m.resume.id] }))}
                          className="text-zinc-500 hover:text-white">
                          {matchExpanded[m.resume.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {matchExpanded[m.resume.id] && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(m.details).map(([key, detail]) => (
                          <div key={key} className="text-xs">
                            <span className="text-zinc-500">{
                              key === 'skills_required' ? '必需技能' :
                              key === 'skills_preferred' ? '优先技能' :
                              key === 'experience' ? '工作经验' :
                              key === 'education' ? '学历' :
                              key === 'title' ? '岗位匹配' : key
                            }</span>
                            <div className={`mt-1 font-medium ${
                              detail.score >= 80 ? 'text-emerald-300' :
                              detail.score >= 60 ? 'text-amber-300' :
                              'text-red-300'
                            }`}>
                              {detail.score}分
                            </div>
                            {detail.matched && (
                              <p className="text-zinc-500 mt-0.5">匹配 {detail.matched.length}/{detail.total}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right - Linked Profiles */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">候选人画像</h3>
              <button onClick={loadAllProfiles}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <Plus size={14} /> 关联画像
              </button>
            </div>

            {(position.profiles || []).length === 0 ? (
              <p className="text-sm text-zinc-500">暂未关联候选人画像</p>
            ) : (
              <div className="space-y-3">
                {position.profiles.map(profile => (
                  <div key={profile.id} className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium cursor-pointer hover:text-indigo-300"
                        onClick={() => navigate(`/profiles/${profile.id}/edit`)}>
                        {profile.name}
                      </span>
                      <button onClick={() => handleUnlinkProfile(profile.id)} className="text-zinc-500 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                    {profile.description && <p className="text-xs text-zinc-400 mb-2">{profile.description}</p>}
                    {profile.skills_required?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {profile.skills_required.slice(0, 4).map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => navigate('/profiles/new')}
              className="mt-4 w-full py-2 rounded-lg border border-dashed border-white/[0.1] text-xs text-zinc-500 hover:text-indigo-300 hover:border-indigo-500/30 transition">
              + 新建画像
            </button>
          </div>
        </div>
      </div>

      {/* Link Profile Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileForm(false)}>
          <div className="w-full max-w-md mx-4 glass rounded-2xl p-6 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">关联候选人画像</h3>
              <button onClick={() => setShowProfileForm(false)} className="text-zinc-400 hover:text-white"><X size={18} /></button>
            </div>
            {allProfiles.length === 0 ? (
              <p className="text-sm text-zinc-500">暂无画像，请先创建</p>
            ) : (
              <div className="space-y-2">
                {allProfiles.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${linkedIds.has(p.id) ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                    <div>
                      <p className="text-sm text-white">{p.name}</p>
                      {p.description && <p className="text-xs text-zinc-500 mt-0.5">{p.description}</p>}
                    </div>
                    {linkedIds.has(p.id) ? (
                      <span className="text-xs text-indigo-300">已关联</span>
                    ) : (
                      <button onClick={() => handleLinkProfile(p.id)} className="text-xs px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">关联</button>
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
