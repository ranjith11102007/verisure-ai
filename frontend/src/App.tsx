import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/ApplicationDetail'
import DocumentIntelligence from './pages/DocumentIntelligence'
import DocumentAuth from './pages/DocumentAuth'
import Upload from './pages/Upload'
import Compliance from './pages/Compliance'
import Rules from './pages/Rules'
import EvidenceRequests from './pages/EvidenceRequests'
import Audit from './pages/Audit'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import NotFound from './pages/NotFound'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="upload" element={<Upload />} />
          <Route path="document-intelligence" element={<DocumentIntelligence />} />
          <Route path="document-auth" element={<DocumentAuth />} />
          <Route path="compliance" element={<Compliance />} />
          <Route path="rules" element={<Rules />} />
          <Route path="evidence" element={<EvidenceRequests />} />
          <Route path="audit" element={<Audit />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
