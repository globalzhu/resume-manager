import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import {
  ArrowLeft, Brain, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Clock, Save, Tag, X, Download, Trash2, Building, BookOpen, FileText,
} from 'lucide-react'

// PDF viewer: only loads when user clicks "查看原文"
function PdfViewer({ fileUrl }) {
  const [show, setShow] = useState(false)
  if (!show) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-500">
        <FileText size={48} className="text-zinc-700" />
        <p className="text-sm">点击查看简历原文</p>
        <button
          onClick={() => setShow(true)}
          className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm hover:bg-indigo-500/20 transition"
        >
          查看原文
        </button>
      </div>
    )
  }
  return (
    <iframe
      src={fileUrl}
      className="w-full flex-1 border-0"
      style={{ minHeight: '100%' }}
      title="Resume Preview"
    />
  )
}

const statusOptions = [
  { value: 'pending', label: '待处理', color: 'badge-pending' },
  { value: 'reviewed', label: '已查看', color: 'badge-reviewed' },
  { value: 'interview', label: '面试中', color: 'badge-interview' },
  { value: 'hired', label: '已录用', color: 'badge-hired' },
  { value: 'rejected', label: '已拒绝', color: 'badge-rejected' },
]

export default function ResumeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [notes, setNotes] = useState('')
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const r = await api.getResume(id)
      setResume(r)
      setNotes(r.notes || '')
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  // Poll while parsing
  useEffect(() => {
    if (!resume || resume.parse_status !== 'parsing') return
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [resume?.parse_status])

  const handleParse = async () => {
    setParsing(true)
    try {
      await api.parseResume(id)
      setTimeout(load, 2000)
    } catch (e) {
      alert('Parse error: ' + e.message)
    }
    setParsing(false)
  }

  const handleStatusChange = async (status) => {
    await api.updateResume(id, { status })
    load()
  }

  const handleSaveNotes = async () => {
    setSaving(true)
    await api.updateResume(id, { notes })
    setSaving(false)
  }

  const handleAddTag = async () => {
    if (!newTag.trim()) return
    await api.addTag(id, newTag.trim())
    setNewTag('')
    load()
  }

  const handleRemoveTag = async (tag) => {
    const newTags = resume.tags.filter(t => t !== tag)
    await api.updateResume(id, { tags: newTags })
    load()
  }

  const handleDelete = async () => {
    if (!confirm('确定删除此简历？')) return
    await api.deleteResume(id)
    navigate('/resumes')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">简历未找到</p>
        <button onClick={() => navigate('/resumes')} className="mt-4 text-indigo-400 text-sm">返回列表</button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 px-8 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/resumes')} className="p-2 rounded-lg hover:bg-white/[0.05] text-zinc-400 hover:text-white transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{resume.name || '未解析'}</h1>
            <p className="text-xs text-zinc-500">{resume.filename}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleParse} disabled={parsing || resume.parse_status === 'parsing'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition">
            <Brain size={15} className={resume.parse_status === 'parsing' ? 'animate-spin' : ''} />
            {resume.parse_status === 'parsing' ? '解析中...' : resume.parse_status === 'parsed' ? '重新解析' : 'AI解析'}
          </button>

          <a href={api.getFileUrl(id)} target="_blank" rel="noopener"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass text-sm text-zinc-300 hover:text-white transition">
            <Download size={15} /> 下载
          </a>
          <button onClick={handleDelete} className="p-2 rounded-xl glass text-red-400 hover:text-red-300 hover:bg-red-500/10 transition">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Content: split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: structured data */}
        <div className="w-1/2 overflow-auto p-6 space-y-5 border-r border-white/[0.06]">
          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map(s => (
              <button key={s.value} onClick={() => handleStatusChange(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  resume.status === s.value
                    ? 'ring-2 ring-indigo-500/50 bg-white/[0.08] text-white'
                    : 'glass text-zinc-400 hover:text-white'
                }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Basic info */}
          <div className="glass p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">基本信息</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {resume.phone && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone size={14} className="text-zinc-600" /> {resume.phone}
                </div>
              )}
              {resume.email && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Mail size={14} className="text-zinc-600" /> {resume.email}
                </div>
              )}
              {resume.city && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin size={14} className="text-zinc-600" /> {resume.city}
                </div>
              )}
              {resume.current_title && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Briefcase size={14} className="text-zinc-600" /> {resume.current_title}
                </div>
              )}
              {resume.education && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <GraduationCap size={14} className="text-zinc-600" /> {resume.education}
                </div>
              )}
              {resume.years_experience > 0 && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Clock size={14} className="text-zinc-600" /> {resume.years_experience}年经验
                </div>
              )}
              {resume.salary_range && (
                <div className="flex items-center gap-2 text-zinc-400">
                  <Briefcase size={14} className="text-zinc-600" /> {resume.salary_range}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {resume.summary && (
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-white mb-2">个人总结</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{resume.summary}</p>
            </div>
          )}

          {/* Skills */}
          {resume.skills?.length > 0 && (
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-white mb-3">技能</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map(skill => (
                  <span key={skill} className="px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work history */}
          {resume.work_history?.length > 0 && (
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Building size={14} /> 工作经历
              </h3>
              <div className="space-y-4">
                {resume.work_history.map((w, i) => (
                  <div key={i} className="border-l-2 border-indigo-500/30 pl-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">{w.title || w.position}</p>
                      <span className="text-xs text-zinc-600">{w.period}</span>
                    </div>
                    <p className="text-xs text-indigo-400 mt-0.5">{w.company}</p>
                    {w.description && <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{w.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education history */}
          {resume.education_history?.length > 0 && (
            <div className="glass p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen size={14} /> 教育经历
              </h3>
              <div className="space-y-3">
                {resume.education_history.map((e, i) => (
                  <div key={i} className="border-l-2 border-purple-500/30 pl-4">
                    <p className="text-sm font-medium text-white">{e.school}</p>
                    <p className="text-xs text-zinc-400">{e.degree} · {e.major}</p>
                    <p className="text-xs text-zinc-600">{e.period}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="glass p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Tag size={14} /> 标签
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {resume.tags?.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-white ml-0.5"><X size={11} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                placeholder="添加标签..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
              />
              <button onClick={handleAddTag} className="px-3 py-1.5 rounded-lg glass text-xs text-zinc-400 hover:text-white transition">添加</button>
            </div>
          </div>

          {/* Notes */}
          <div className="glass p-5">
            <h3 className="text-sm font-semibold text-white mb-3">备注</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none"
              placeholder="添加备注..."
            />
            <button onClick={handleSaveNotes} disabled={saving}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs hover:bg-indigo-500/20 transition">
              <Save size={13} /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* Right: PDF preview */}
        <div className="w-1/2 bg-black/20 flex flex-col">
          <PdfViewer fileUrl={api.getFileUrl(id)} />
        </div>
      </div>
    </div>
  )
}
