import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Resumes from './pages/Resumes'
import ResumeDetail from './pages/ResumeDetail'
import Positions from './pages/Positions'
import PositionDetail from './pages/PositionDetail'
import ProfileForm from './pages/ProfileForm'
import MobileDashboard from './mobile/pages/MobileDashboard'
import MobileResumes from './mobile/pages/MobileResumes'
import MobileResumeDetail from './mobile/pages/MobileResumeDetail'
import MobilePositions from './mobile/pages/MobilePositions'
import MobilePositionDetail from './mobile/pages/MobilePositionDetail'
import MobileProfileForm from './mobile/pages/MobileProfileForm'
import MobileLayout from './mobile/components/MobileLayout'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /iphone|ipad|ipod|android|webos|blackberry|windows phone/.test(userAgent)
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

function DesktopApp() {
  return (
    <div className="flex h-screen overflow-hidden bg-mesh">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/resumes" element={<Resumes />} />
          <Route path="/resumes/:id" element={<ResumeDetail />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/positions/:id" element={<PositionDetail />} />
          <Route path="/profiles/:id/edit" element={<ProfileForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function MobileApp() {
  return (
    <MobileLayout>
      <Routes>
        <Route path="/" element={<MobileDashboard />} />
        <Route path="/resumes" element={<MobileResumes />} />
        <Route path="/resumes/:id" element={<MobileResumeDetail />} />
        <Route path="/positions" element={<MobilePositions />} />
        <Route path="/positions/:id" element={<MobilePositionDetail />} />
        <Route path="/profiles/:id/edit" element={<MobileProfileForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MobileLayout>
  )
}

export default function App() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileApp /> : <DesktopApp />
}
