import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import {
  ArrowLeft, Phone, Mail, MapPin, Briefcase, GraduationCap,
  Clock, Tag, FileText, Download, RefreshCw, CheckCircle,
  XCircle, MessageSquare, ChevronDown
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

const statusOptions = [
  { value: 'pending', label: '待处理', color: 'amber' },
  { value: 'reviewed', label: '已查看', color: 'blue' },
  { value: 'interview', label: '面试中', color: 'purple' },
  { value: 'hired', label: '已录用', color: 'green' },
  { value: 'rejected', label: '已拒绝', color: 'red' },
]

export default function MobileResumeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [notes, setNotes] = useState('')

  const loadResume = async () => {
    setLoading(true)
    try {
      const data = await api.getResume(id)
      setResume(data)
      setNotes(data.notes || '')
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadResume()
  }, [id])

  const handleParse = async () => {
    setParsing(true)
    try {
      await api.parseResume(id)
      await loadResume()
      alert('解析完成')
    } catch (e) {
      alert('解析失败: ' + e.message)
    }
    setParsing(false)
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await api.updateResume(id, { status: newStatus })
      setResume((prev) => ({ ...prev, status: newStatus }))
      setShowStatusMenu(false)
    } catch (e) {
      alert('更新失败: ' + e.message)
    }
  }

  const handleSaveNotes = async () => {
    try {
      await api.updateResume(id, { notes })
      alert('备注已保存')
    } catch (e) {
      alert('保存失败: ' + e.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="p-4 text-center">
        <p className="text-slate-500">简历不存在</p>
        <button
          onClick={() => navigate('/resumes')}
          className="mt-4 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg"
        >
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="pb-20">
      {/* Header Actions */}
      <div className="sticky top-14 z-30 bg-slate-900/95 backdrop-blur px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <button
          onClick={() => navigate('/resumes')}
          className="flex items-center gap-1 text-slate-400"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">返回</span>
        </button>
        <div className="flex gap-2">
          <a
            href={api.getResumeFileUrl(id)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-white/5 text-slate-400"
          >
            <Download size={18} />
          </a>
          <button
            onClick={handleParse}
            disabled={parsing}
            className="p-2 rounded-lg bg-white/5 text-slate-400 disabled:opacity-50"
          >
            <RefreshCw size={18} className={parsing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {(resume.name || '?')[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{resume.name || '未解析'}</h1>
              <p className="text-white/70 text-sm">{resume.current_title || '暂无职位'}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {resume.parse_status === 'parsed' ? (
              <span className="px-2 py-1 rounded-full bg-green-500/30 text-green-200 text-xs flex items-center gap-1">
                <CheckCircle size={12} /> AI已解析
              </span>
            ) : resume.parse_status === 'failed' ? (
              <span className="px-2 py-1 rounded-full bg-red-500/30 text-red-200 text-xs flex items-center gap-1">
                <XCircle size={12} /> 解析失败
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-amber-500/30 text-amber-200 text-xs">
                待解析
              </span>
            )}
          </div>

          {/* Status Selector */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${statusColors[resume.status] || 'bg-slate-700'}`}
            >
              {statusLabels[resume.status] || resume.status}
              <ChevronDown size={14} />
            </button>

            {showStatusMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-white/10 shadow-xl overflow-hidden z-10">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors ${
                      resume.status === option.value ? 'bg-white/10' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Phone size={16} className="text-indigo-400" />
            联系方式
          </h3>
          {resume.phone && (
            <a href={`tel:${resume.phone}`} className="flex items-center gap-3 text-slate-300">
              <Phone size={16} className="text-slate-500" />
              <span>{resume.phone}</span>
            </a>
          )}
          {resume.email && (
            <a href={`mailto:${resume.email}`} className="flex items-center gap-3 text-slate-300">
              <Mail size={16} className="text-slate-500" />
              <span className="break-all">{resume.email}</span>
            </a>
          )}
          {!resume.phone && !resume.email && (
            <p className="text-slate-500 text-sm">暂无联系方式</p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white/5 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Briefcase size={16} className="text-purple-400" />
            基本信息
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {resume.education && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">学历</p>
                <p className="text-sm text-white">{resume.education}</p>
              </div>
            )}
            {resume.years_experience > 0 && (
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">工作经验</p>
                <p className="text-sm text-white">{resume.years_experience}年</p>
              </div>
            )}
            {resume.expected_positions && resume.expected_positions.length > 0 && (
              <div className="col-span-2 bg-white/5 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">期望职位</p>
                <p className="text-sm text-white">{resume.expected_positions.join(', ')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">技能</h3>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {resume.summary && (
          <div className="bg-white/5 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              简介
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Work History */}
        {resume.work_history && resume.work_history.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-emerald-400" />
              工作经历
            </h3>
            <div className="space-y-3">
              {resume.work_history.map((work, i) => (
                <div key={i} className="border-l-2 border-indigo-500/30 pl-3">
                  <p className="text-sm text-white font-medium">{work.title}</p>
                  <p className="text-xs text-slate-400">{work.company}</p>
                  {work.duration && <p className="text-xs text-slate-500">{work.duration}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education History */}
        {resume.education_history && resume.education_history.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <GraduationCap size={16} className="text-amber-400" />
              教育经历
            </h3>
            <div className="space-y-3">
              {resume.education_history.map((edu, i) => (
                <div key={i} className="border-l-2 border-purple-500/30 pl-3">
                  <p className="text-sm text-white font-medium">{edu.school}</p>
                  <p className="text-xs text-slate-400">{edu.degree}</p>
                  {edu.year && <p className="text-xs text-slate-500">{edu.year}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {resume.tags && resume.tags.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Tag size={16} className="text-pink-400" />
              标签
            </h3>
            <div className="flex flex-wrap gap-2">
              {resume.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-white/10 text-slate-300 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white/5 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-cyan-400" />
            备注
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="添加备注..."
            rows={3}
            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none"
          />
          <button
            onClick={handleSaveNotes}
            className="mt-2 w-full py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium"
          >
            保存备注
          </button>
        </div>

        {/* File Info */}
        <div className="bg-white/5 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">文件信息</h3>
          <p className="text-xs text-slate-500 break-all">{resume.filename}</p>
          <p className="text-xs text-slate-600 mt-1">
            创建于 {resume.created_at?.slice(0, 16)}
          </p>
        </div>

        {/* Bottom Spacer */}
        <div className="h-8" />
      </div>
    </div>
  )
}
