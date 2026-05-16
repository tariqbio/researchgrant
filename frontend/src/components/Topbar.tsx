import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (path: string) => pathname.startsWith(path);

  const navLink = (to: string, label: string) => (
    <Link key={to} to={to} onClick={() => setMobileOpen(false)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        isActive(to) ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}>
      {label}
    </Link>
  );

  // Nav links per role
  const getNavLinks = () => {
    if (!user) return [navLink('/browse', 'Browse Grants')];
    if (user.role === 'god_admin' || user.is_admin) return [
      navLink('/god-admin/dashboard', 'Platform'),
      navLink('/god-admin/users', 'Users'),
      navLink('/admin/queue', 'Review Queue'),
      navLink('/admin/create', 'Add Grant'),
      navLink('/browse', 'Browse'),
    ];
    if (user.role === 'moderator') return [
      navLink('/admin/dashboard', 'Dashboard'),
      navLink('/admin/queue', 'Review Queue'),
      navLink('/admin/submissions', 'Submissions'),
      navLink('/admin/create', 'Add Grant'),
      navLink('/browse', 'Browse'),
    ];
    if (user.role === 'org') return [
      navLink('/org/dashboard', 'Dashboard'),
      navLink('/org/publish', 'Publish Grant'),
      navLink('/browse', 'Browse All'),
    ];
    // researcher
    return [
      navLink('/researcher/dashboard', 'Dashboard'),
      navLink('/browse', 'Browse Grants'),
      navLink('/applications', 'My Applications'),
      navLink('/watchlist', 'Watchlist'),
    ];
  };

  const roleBadge = () => {
    if (!user) return null;
    const map: any = {
      god_admin: 'bg-amber-100 text-amber-700',
      moderator: 'bg-purple-100 text-purple-700',
      org: 'bg-blue-100 text-blue-700',
      researcher: 'bg-green-100 text-green-700',
    };
    const labels: any = { god_admin: 'God Admin', moderator: 'Moderator', org: user.org_name || 'Org', researcher: 'Researcher' };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[user.role] || 'bg-gray-100 text-gray-600'}`}>
        {labels[user.role] || user.role}
      </span>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="font-bold text-gray-900">GrantBD</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {getNavLinks()}
          </div>

          {/* Right: user info + logout */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {roleBadge()}
                <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                  {user.full_name.split(' ')[0]}
                </Link>
                <button onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-red-50">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition">
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            <div className="space-y-1">
              <span className="block w-5 h-0.5 bg-gray-600" />
              <span className="block w-5 h-0.5 bg-gray-600" />
              <span className="block w-5 h-0.5 bg-gray-600" />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100 flex flex-col gap-1">
            {getNavLinks()}
            {user ? (
              <>
                <div className="my-1 border-t border-gray-100" />
                <div className="px-3 py-1 flex items-center gap-2">
                  {roleBadge()}
                  <span className="text-sm text-gray-700">{user.full_name}</span>
                </div>
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Profile</Link>
                <button onClick={handleLogout}
                  className="text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">Sign out</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg font-medium mt-1">Sign in</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
