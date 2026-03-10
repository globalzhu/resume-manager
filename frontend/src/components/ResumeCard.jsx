import { useNavigate } from 'react-router-dom'
import { User, MapPin, Briefcase, Clock, Sparkles } from 'lucide-react'

const statusColors = {
  pending: 'badge-pending',
  reviewed: 'badge-reviewed',
  interview: 'badge-interview',
  hired: 'badge-hired',
  rejected: 'badge-rejected',
}

const statusLabels = {
  pending: '待处理',
  reviewed: '已查看',
  interview: '面试中',
  hired: '已录用',
  rejected: '已拒绝',
}

export default function ResumeCard({ resume, selected, onSelect }) {
  const navigate = useNavigate()

  return (
    <div
      className={`glass p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
        selected ? 'ring-2 ring-indigo-500/50' : ''
      }`}
      onClick={() => navigate(`/resumes/${resume.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => { e.stopPropagation(); onSelect(resume.id) }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded accent-indigo-500 shrink-0"
          />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
            <User size={18} className="text-indigo-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {resume.name || '未解析'}
            </h3>
            <p className="text-xs text-zinc-500 truncate">{resume.current_title || resume.filename}</p>
          </div>
        </div>
        <span className={`badge ${statusColors[resume.status] || 'badge-pending'} shrink-0`}>
          {statusLabels[resume.status] || resume.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
        {resume.city && (
          <span className="flex items-center gap-1"><MapPin size={12} /> {resume.city}</span>
        )}
        {resume.years_experience > 0 && (
          <span className="flex items-center gap-1"><Clock size={12} /> {resume.years_experience}年经验</span>
        )}
        {resume.salary_range && (
          <span className="flex items-center gap-1"><Briefcase size={12} /> {resume.salary_range}</span>
        )}
        {resume.parse_status === 'parsed' && (
          <span className="flex items-center gap-1 text-emerald-400"><Sparkles size={12} /> AI解析</span>
        )}
      </div>

      {resume.tags?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {resume.tags.slice(0, 4).map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[11px] rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {tag}
            </span>
          ))}
          {resume.tags.length > 4 && (
            <span className="text-[11px] text-zinc-600">+{resume.tags.length - 4}</span>
          )}
        </div>
      )}

      {resume.skills?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {resume.skills.slice(0, 5).map(skill => (
            <span key={skill} className="px-1.5 py-0.5 text-[10px] rounded bg-white/[0.04] text-zinc-500">
              {skill}
            </span>
          ))}
          {resume.skills.length > 5 && (
            <span className="text-[10px] text-zinc-600">+{resume.skills.length - 5}</span>
          )}
        </div>
      )}
    </div>
  )
}
