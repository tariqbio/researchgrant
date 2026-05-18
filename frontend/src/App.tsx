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

// v2 pages
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

// ── Helpers ──────────────────────────────────────────────────────

function Spinner() {
  return <div className="h-screen flex items-center justify-center text-gray-400 text-sm">Loading…</div>
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <main>{children}</main>
    </div>
  )
}

// ── Route guards ─────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function ResearcherRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'researcher') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function OrgRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'org') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function ModeratorRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'moderator' && user.role !== 'god_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GodAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'god_admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

// ── Smart /dashboard router ──────────────────────────────────────
// Single entry point after login. Reads the user's role and
// redirects them to their role-specific home page.

function DashboardRouter() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />

  // Accounts still waiting for approval
  if (user.account_status === 'pending') return <Navigate to="/pending" replace />

  switch (user.role) {
    case 'god_admin':  return <Navigate to="/god-admin" replace />
    case 'moderator':  return <Navigate to="/admin" replace />
    case 'org':        return <Navigate to="/org/dashboard" replace />
    case 'researcher':
    default:           return <Navigate to="/researcher/home" replace />
  }
}

// ── Pending approval page ────────────────────────────────────────

function PendingPage() {
  const { logout } = useAuth()
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 text-center px-4">
      <div className="text-4xl">⏳</div>
      <h1 className="text-xl font-semibold text-gray-900">Account pending approval</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        Your account has been submitted and is waiting for admin review.
        You'll receive an email once it's approved — usually within 24 hours.
      </p>
      <button
        onClick={logout}
        className="text-sm text-gray-400 hover:text-gray-600 underline mt-2"
      >
        Sign out
      </button>
    </div>
  )
}

// ── All routes ───────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register-org" element={<RegisterOrg />} />
      <Route path="/grants/public" element={<Layout><BrowsePage /></Layout>} />
      <Route path="/grants/:id" element={<Layout><GrantDetailPage /></Layout>} />
      <Route path="/pending" element={<PendingPage />} />

      {/* ── Smart role router (single /dashboard entry point) ── */}
      <Route path="/dashboard" element={<DashboardRouter />} />

      {/* ── Researcher ── */}
      <Route path="/researcher/home"  element={<ResearcherRoute><Layout><DashboardPage /></Layout></ResearcherRoute>} />
      <Route path="/grants"           element={<ResearcherRoute><Layout><BrowsePage /></Layout></ResearcherRoute>} />
      <Route path="/watchlist"        element={<ResearcherRoute><Layout><WatchlistPage /></Layout></ResearcherRoute>} />
      <Route path="/submit-grant"     element={<ResearcherRoute><Layout><SubmitGrantPage /></Layout></ResearcherRoute>} />
      <Route path="/applications"     element={<ResearcherRoute><Layout><MyApplications /></Layout></ResearcherRoute>} />
      <Route path="/projects/:id"     element={<ResearcherRoute><Layout><ProjectDetail /></Layout></ResearcherRoute>} />
      <Route path="/profile"          element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

      {/* ── Organization ── */}
      <Route path="/org/dashboard" element={<OrgRoute><Layout><OrgDashboard /></Layout></OrgRoute>} />
      <Route path="/org/publish"   element={<OrgRoute><Layout><PublishGrant /></Layout></OrgRoute>} />

      {/* ── Moderator ── */}
      <Route path="/admin"             element={<ModeratorRoute><Layout><AdminDashboard /></Layout></ModeratorRoute>} />
      <Route path="/admin/queue"       element={<ModeratorRoute><Layout><ReviewQueuePage /></Layout></ModeratorRoute>} />
      <Route path="/admin/upload"      element={<ModeratorRoute><Layout><UploadPdfPage /></Layout></ModeratorRoute>} />
      <Route path="/admin/submissions" element={<ModeratorRoute><Layout><AdminSubmissionsPage /></Layout></ModeratorRoute>} />
      <Route path="/admin/create"      element={<ModeratorRoute><Layout><AdminCreateGrantPage /></Layout></ModeratorRoute>} />

      {/* ── God Admin ── */}
      <Route path="/god-admin"       element={<GodAdminRoute><Layout><GodAdminDashboard /></Layout></GodAdminRoute>} />
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
