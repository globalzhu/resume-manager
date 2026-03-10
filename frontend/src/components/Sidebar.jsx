import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, FileText } from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resumes', icon: Users, label: 'Resumes' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-white/[0.06] bg-black/30 backdrop-blur-xl flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white">ResumeFlow</h1>
          <p className="text-[11px] text-zinc-500">管理系统</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/[0.08] text-white font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 m-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
        <p className="text-xs text-indigo-300 font-medium">AI Powered</p>
        <p className="text-[11px] text-zinc-500 mt-1">Claude API integration for smart resume parsing</p>
      </div>
    </aside>
  )
}
