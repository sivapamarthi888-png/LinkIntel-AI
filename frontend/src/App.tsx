import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import JobAnalyzer from './pages/JobAnalyzer'
import SkillMatch from './pages/SkillMatch'
import Verification from './pages/Verification'
import CareerRoadmap from './pages/CareerRoadmap'
import Applications from './pages/Applications'
import Settings from './pages/Settings'
import { EmptyState } from './components'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist. Use the navigation menu to get back on track."
      action={
        <Link to="/dashboard" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          Go to dashboard
        </Link>
      }
    />
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/job-analyzer" element={<JobAnalyzer />} />
        <Route path="/skill-match" element={<SkillMatch />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/career-roadmap" element={<CareerRoadmap />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
