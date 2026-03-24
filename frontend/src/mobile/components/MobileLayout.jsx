import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Users, Settings, Menu, X } from 'lucide-react'

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/resumes', icon: Users, label: '简历' },
]

export default function MobileLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard'
    if (location.pathname === '/resumes') return '简历列表'
    if (location.pathname.startsWith('/resumes/')) return '简历详情'
    return 'Resume Manager'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold text-white">{getPageTitle()}</h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg bg-white/5 text-white"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute right-0 top-14 w-48 bg-slate-800 border-l border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-white/10 safe-area-pb">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-6 py-2 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
