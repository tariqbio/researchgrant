import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Auth
import AuthPages from './pages/auth/AuthPages';

// Shared
import Topbar from './components/Topbar';
import HomePage from './pages/public/HomePage';
import Browse from './pages/researcher/Browse';
import GrantDetail from './pages/researcher/GrantDetail';
import Watchlist from './pages/researcher/Watchlist';
import Profile from './pages/researcher/Profile';
import SubmitGrant from './pages/researcher/SubmitGrant';

// Researcher
import ResearcherDashboard from './pages/researcher/ResearcherDashboard';
import MyApplications from './pages/researcher/MyApplications';
import ApplyToGrant from './pages/researcher/ApplyToGrant';
import ProjectDetail from './pages/researcher/projects/ProjectDetail';

// Org
import OrgDashboard from './pages/org/OrgDashboard';
import PublishGrant from './pages/org/PublishGrant';

// Moderator / Admin (reuse existing admin pages)
import Dashboard from './pages/admin/Dashboard';
import ReviewQueue from './pages/admin/ReviewQueue';
import Submissions from './pages/admin/Submissions';
import CreateGrant from './pages/admin/CreateGrant';

// God Admin
import GodAdminDashboard from './pages/god_admin/GodAdminDashboard';
import UserManagement from './pages/god_admin/UserManagement';

function RoleRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'god_admin' || user.is_admin) return <Navigate to="/god-admin/dashboard" replace />;
  if (user.role === 'moderator') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'org') return <Navigate to="/org/dashboard" replace />;
  return <Navigate to="/researcher/dashboard" replace />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'god_admin' && user.role !== 'moderator' && !user.is_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireGodAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'god_admin' && !user.is_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireOrg({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'org') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {user && <Topbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPages />} />
        <Route path="/grants/:id" element={<GrantDetail />} />
        <Route path="/browse" element={<Browse />} />

        {/* Role router — /dashboard sends to the right home */}
        <Route path="/dashboard" element={<RoleRouter />} />

        {/* ── Researcher ── */}
        <Route path="/researcher/dashboard" element={<RequireAuth><ResearcherDashboard /></RequireAuth>} />
        <Route path="/applications" element={<RequireAuth><MyApplications /></RequireAuth>} />
        <Route path="/grants/:grantId/apply" element={<RequireAuth><ApplyToGrant /></RequireAuth>} />
        <Route path="/projects" element={<RequireAuth><ResearcherDashboard /></RequireAuth>} />
        <Route path="/projects/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
        <Route path="/watchlist" element={<RequireAuth><Watchlist /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/submit" element={<RequireAuth><SubmitGrant /></RequireAuth>} />

        {/* ── Org ── */}
        <Route path="/org/dashboard" element={<RequireOrg><OrgDashboard /></RequireOrg>} />
        <Route path="/org/publish" element={<RequireOrg><PublishGrant /></RequireOrg>} />
        <Route path="/org/grants/:grantId/applications" element={<RequireOrg><MyApplications /></RequireOrg>} />

        {/* ── Moderator / Admin ── */}
        <Route path="/admin/dashboard" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/admin/queue" element={<RequireAdmin><ReviewQueue /></RequireAdmin>} />
        <Route path="/admin/submissions" element={<RequireAdmin><Submissions /></RequireAdmin>} />
        <Route path="/admin/upload" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/admin/create" element={<RequireAdmin><CreateGrant /></RequireAdmin>} />

        {/* ── God Admin ── */}
        <Route path="/god-admin/dashboard" element={<RequireGodAdmin><GodAdminDashboard /></RequireGodAdmin>} />
        <Route path="/god-admin/users" element={<RequireGodAdmin><UserManagement /></RequireGodAdmin>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
