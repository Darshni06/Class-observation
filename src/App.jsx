import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { PageSpinner } from './components/UI'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import NewObservationPage from './pages/admin/NewObservationPage'
import AllObservationsPage from './pages/admin/AllObservationsPage'
import GenerateReportPage from './pages/admin/GenerateReportPage'
import ExportPage from './pages/admin/ExportPage'
import TeachersPage from './pages/admin/TeachersPage'
import ClassesPage from './pages/admin/ClassesPage'
import TeacherObservationsAnalysisPage from './pages/admin/TeacherObservationsAnalysisPage'

import MyFeedbackPage from './pages/teacher/MyFeedbackPage'
import MyProgressPage from './pages/teacher/MyProgressPage'
import MyReportsPage from './pages/teacher/MyReportsPage'
import TeacherNewObservationPage from './pages/teacher/TeacherNewObservationPage'
import TeacherAllObservationsPage from './pages/teacher/TeacherAllObservationsPage'
import TeacherGenerateReportPage from './pages/teacher/TeacherGenerateReportPage'
import TeacherExportPage from './pages/teacher/TeacherExportPage'

function ProtectedSection({ role }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <div style={{ height: '100vh' }}><PageSpinner label="Loading your portal…" /></div>
  if (!user || !profile) return <Navigate to="/login" replace />
  if (profile.role !== role) return <Navigate to={profile.role === 'admin' ? '/admin' : '/teacher'} replace />

  return <Layout role={role} />
}

function RootRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ height: '100vh' }}><PageSpinner label="Loading…" /></div>
  if (!user || !profile) return <Navigate to="/login" replace />
  return <Navigate to={profile.role === 'admin' ? '/admin' : '/teacher'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route path="/admin" element={<ProtectedSection role="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="new" element={<NewObservationPage />} />
        <Route path="observations" element={<AllObservationsPage />} />
        <Route path="observations/:id/edit" element={<NewObservationPage />} />
        <Route path="reports" element={<GenerateReportPage />} />
        <Route path="export" element={<ExportPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="teacher-observations" element={<TeacherObservationsAnalysisPage />} />
      </Route>

      <Route path="/teacher" element={<ProtectedSection role="teacher" />}>
        <Route index element={<MyFeedbackPage />} />
        <Route path="progress" element={<MyProgressPage />} />
        <Route path="reports" element={<MyReportsPage />} />
        <Route path="new" element={<TeacherNewObservationPage />} />
        <Route path="observations" element={<TeacherAllObservationsPage />} />
        <Route path="observations/:id/edit" element={<TeacherNewObservationPage />} />
        <Route path="generate-report" element={<TeacherGenerateReportPage />} />
        <Route path="export" element={<TeacherExportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
