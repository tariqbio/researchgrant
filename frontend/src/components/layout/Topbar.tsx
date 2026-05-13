import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const navLinks = user
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/grants', label: 'Browse grants' },
        { to: '/watchlist', label: 'Watchlist' },
        { to: '/profile', label: 'Profile' },
        ...(user.is_admin ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : [{ to: '/grants/public', label: 'Browse grants' }]

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-[15px] font-medium text-gray-900">
            Grant<span className="text-emerald-600">BD</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  location.pathname.startsWith(link.to)
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-500 hidden sm:block">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-800">Sign in</Link>
              <Link
                to="/register"
                className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
