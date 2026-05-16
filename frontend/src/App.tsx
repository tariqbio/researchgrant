import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/Toast'
import Topbar from './components/layout/Topbar'
import { ReactNode } from 'react'

// Existing working pages
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

// New v2 pages
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

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_admin && user.role !== 'moderator' && user.role !== 'god_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function OrgRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'org') return <Navigate to="/dashboard" replace />
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
  const { user } = useAuth()
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-org" element={<RegisterOrg />} />
      <Route path="/grants/public" element={<Layout><BrowsePage /></Layout>} />
      <Route path="/grants/:id" element={<Layout><GrantDetailPage /></Layout>} />

      {/* Researcher */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/grants" element={<ProtectedRoute><Layout><BrowsePage /></Layout></ProtectedRoute>} />
      <Route path="/watchlist" element={<ProtectedRoute><Layout><WatchlistPage /></Layout></ProtectedRoute>} />
      <Route path="/submit-grant" element={<ProtectedRoute><Layout><SubmitGrantPage /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><Layout><MyApplications /></Layout></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><Layout><ProjectDetail /></Layout></ProtectedRoute>} />

      {/* Org */}
      <Route path="/org/dashboard" element={<OrgRoute><Layout><OrgDashboard /></Layout></OrgRoute>} />
      <Route path="/org/publish" element={<OrgRoute><Layout><PublishGrant /></Layout></OrgRoute>} />

      {/* Admin / Moderator */}
      <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
      <Route path="/admin/queue" element={<AdminRoute><Layout><ReviewQueuePage /></Layout></AdminRoute>} />
      <Route path="/admin/upload" element={<AdminRoute><Layout><UploadPdfPage /></Layout></AdminRoute>} />
      <Route path="/admin/submissions" element={<AdminRoute><Layout><AdminSubmissionsPage /></Layout></AdminRoute>} />
      <Route path="/admin/create" element={<AdminRoute><Layout><AdminCreateGrantPage /></Layout></AdminRoute>} />

      {/* God Admin */}
      <Route path="/god-admin" element={<AdminRoute><Layout><GodAdminDashboard /></Layout></AdminRoute>} />
      <Route path="/god-admin/users" element={<AdminRoute><Layout><UserManagement /></Layout></AdminRoute>} />

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
