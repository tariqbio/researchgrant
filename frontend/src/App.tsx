import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'
import Topbar from './components/layout/Topbar'
import { ReactNode } from 'react'

import HomePage from './pages/public/HomePage'
import { LoginPage, RegisterPage } from './pages/auth/AuthPages'
import DashboardPage from './pages/researcher/Dashboard'
import BrowsePage from './pages/researcher/Browse'
import WatchlistPage from './pages/researcher/Watchlist'
import SubmitGrantPage from './pages/researcher/SubmitGrant'
import GrantDetailPage from './pages/researcher/GrantDetail'
import ProfilePage from './pages/researcher/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import ReviewQueuePage from './pages/admin/ReviewQueue'
import UploadPdfPage from './pages/admin/UploadPdf'
import AdminSubmissionsPage from './pages/admin/Submissions'
import AdminCreateGrantPage from './pages/admin/CreateGrant'
import MyApplications from './pages/researcher/MyApplications'
import ProjectDetail from './pages/researcher/projects/ProjectDetail'
import OrgDashboard from './pages/org/OrgDashboard'
import PublishGrant from './pages/org/PublishGrant'
import GodAdminDashboard from './pages/god_admin/GodAdminDashboard'
import UserManagement from './pages/god_admin/UserManagement'
import RegisterOrg from './pages/auth/RegisterOrg'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } }
})

function LoadingScreen() {
  return <div className="h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function DashboardRouter() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'god_admin') return <Navigate to="/god-admin" replace />
  if (user.role === 'moderator' || user.is_admin) return <Navigate to="/admin" replace />
  if (user.role === 'org') return <Navigate to="/org/dashboard" replace />
  return <Navigate to="/dashboard/researcher" replace />
}

function ResearcherRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role && user.role !== 'researcher') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin && user.role !== 'moderator' && user.role !== 'god_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function OrgRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'org') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GodAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'god_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <main>{children}</main>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-org" element={<RegisterOrg />} />
      <Route path="/grants/public" element={<Layout><BrowsePage /></Layout>} />
      <Route path="/grants/:id" element={<Layout><GrantDetailPage /></Layout>} />

      <Route path="/dashboard" element={<DashboardRouter />} />
      <Route path="/dashboard/researcher" element={<ResearcherRoute><Layout><DashboardPage /></Layout></ResearcherRoute>} />
      <Route path="/grants" element={<ResearcherRoute><Layout><BrowsePage /></Layout></ResearcherRoute>} />
      <Route path="/watchlist" element={<ResearcherRoute><Layout><WatchlistPage /></Layout></ResearcherRoute>} />
      <Route path="/submit-grant" element={<ResearcherRoute><Layout><SubmitGrantPage /></Layout></ResearcherRoute>} />
      <Route path="/applications" element={<ResearcherRoute><Layout><MyApplications /></Layout></ResearcherRoute>} />
      <Route path="/projects/:id" element={<ResearcherRoute><Layout><ProjectDetail /></Layout></ResearcherRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

      <Route path="/org/dashboard" element={<OrgRoute><Layout><OrgDashboard /></Layout></OrgRoute>} />
      <Route path="/org/publish" element={<OrgRoute><Layout><PublishGrant /></Layout></OrgRoute>} />

      <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
      <Route path="/admin/queue" element={<AdminRoute><Layout><ReviewQueuePage /></Layout></AdminRoute>} />
      <Route path="/admin/upload" element={<AdminRoute><Layout><UploadPdfPage /></Layout></AdminRoute>} />
      <Route path="/admin/submissions" element={<AdminRoute><Layout><AdminSubmissionsPage /></Layout></AdminRoute>} />
      <Route path="/admin/create" element={<AdminRoute><Layout><AdminCreateGrantPage /></Layout></AdminRoute>} />

      <Route path="/god-admin" element={<GodAdminRoute><Layout><GodAdminDashboard /></Layout></GodAdminRoute>} />
      <Route path="/god-admin/users" element={<GodAdminRoute><Layout><UserManagement /></Layout></GodAdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}
