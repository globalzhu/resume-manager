import { useEffect, useState } from 'react'

export default function StatsCard({ icon: Icon, label, value, color = 'indigo', delay = 0 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (typeof value !== 'number') { setDisplay(value); return }
    const duration = 800
    const start = Date.now()
    const startDelay = delay
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - start - startDelay
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplay(Math.round(eased * value))
        if (progress >= 1) clearInterval(interval)
      }, 16)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timer)
  }, [value, delay])

  const gradients = {
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    amber: 'from-amber-500 to-amber-600',
  }

  const glows = {
    indigo: 'shadow-indigo-500/20',
    purple: 'shadow-purple-500/20',
    blue: 'shadow-blue-500/20',
    green: 'shadow-emerald-500/20',
    amber: 'shadow-amber-500/20',
  }

  return (
    <div className="glass p-5 flex items-center gap-4 group transition-all duration-300 hover:scale-[1.02]">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[color]} flex items-center justify-center shadow-lg ${glows[color]} group-hover:scale-110 transition-transform`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 animate-count">{display}</p>
      </div>
    </div>
  )
}
