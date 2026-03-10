import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Resumes from './pages/Resumes'
import ResumeDetail from './pages/ResumeDetail'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-mesh">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resumes" element={<Resumes />} />
          <Route path="/resumes/:id" element={<ResumeDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
