import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = user
    ? [
        { to: '/dashboard',    label: 'Dashboard' },
        { to: '/grants',       label: 'Browse' },
        { to: '/watchlist',    label: 'Watchlist' },
        { to: '/profile',      label: 'Profile' },
        ...(user.is_admin ? [{ to: '/admin', label: 'Admin' }] : []),
      ]
    : [{ to: '/grants/public', label: 'Browse grants' }]

  // A link is active if current path starts with its `to`
  // Special case: /admin matches /admin, /admin/queue, /admin/upload etc.
  const isActive = (to: string) => {
    if (to === '/admin') return location.pathname.startsWith('/admin')
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  const handleLogout = () => { logout(); navigate('/'); setMobileOpen(false) }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-6">

        {/* Logo + desktop nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-[15px] font-medium text-gray-900 flex-shrink-0">
            Grant<span className="text-emerald-600">BD</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors ${
                  isActive(link.to)
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: auth + hamburger */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-500 hidden sm:block truncate max-w-[140px]">
                {user.full_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-800 hidden md:block"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm text-gray-500 hover:text-gray-800 hidden md:block">Sign in</Link>
              <Link to="/register" className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 hidden md:block">
                Sign up
              </Link>
            </>
          )}

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {mobileOpen
              ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(link.to)
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg"
              >
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login"    onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Sign in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-emerald-700 font-medium hover:bg-emerald-50 rounded-lg">Sign up free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
