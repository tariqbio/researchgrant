import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { godAdminApi } from '../../api'

type Tab = 'overview' | 'pending_orgs' | 'create_staff' | 'manage_staff'

export default function GodAdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<any>(null)
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')

  // Create staff form
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'moderator' })
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState({ type: '', text: '' })

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, orgs, staffList] = await Promise.all([
        godAdminApi.stats(),
        godAdminApi.pendingOrgs(),
        godAdminApi.users({ role: 'moderator' }).then((r: any) => r.items || []),
      ])
      setStats(s)
      setPendingOrgs(orgs)
      setStaff(staffList)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // Auto-switch to pending orgs tab if there are orgs waiting
  useEffect(() => {
    if (!loading && pendingOrgs.length > 0) setTab('pending_orgs')
  }, [loading])

  const verifyOrg = async (id: string) => {
    await godAdminApi.verifyOrg(id)
    setPendingOrgs(p => p.filter(o => o.id !== id))
  }
  const rejectOrg = async (id: string) => {
    await godAdminApi.rejectOrg(id)
    setPendingOrgs(p => p.filter(o => o.id !== id))
  }
  const suspendStaff = async (id: string) => {
    await godAdminApi.suspend(id)
    setStaff(s => s.map(u => u.id === id ? { ...u, account_status: 'suspended' } : u))
  }
  const reactivateStaff = async (id: string) => {
    await godAdminApi.reactivate(id)
    setStaff(s => s.map(u => u.id === id ? { ...u, account_status: 'active' } : u))
  }
  const demoteStaff = async (id: string) => {
    await godAdminApi.setRole(id, 'researcher')
    setStaff(s => s.filter(u => u.id !== id))
  }

  const handleCreate = async () => {
    if (!form.full_name || !form.email || !form.password) {
      setCreateMsg({ type: 'err', text: 'All fields are required.' })
      return
    }
    setCreating(true)
    setCreateMsg({ type: '', text: '' })
    try {
      await godAdminApi.createStaff(form)
      setCreateMsg({ type: 'ok', text: `${form.role === 'god_admin' ? 'God Admin' : 'Moderator'} account created for ${form.full_name}.` })
      setForm({ full_name: '', email: '', password: '', role: 'moderator' })
      loadAll()
    } catch (e: any) {
      setCreateMsg({ type: 'err', text: e?.response?.data?.detail || 'Failed to create account.' })
    } finally {
      setCreating(false)
    }
  }

  const totalPending = pendingOrgs.length

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'pending_orgs', label: 'Pending Orgs', badge: pendingOrgs.length },
    { id: 'create_staff', label: 'Create Staff Account' },
    { id: 'manage_staff', label: 'Manage Staff' },
  ]

  if (loading) return (
    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Loading platform…</div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">God Admin</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Platform Control</h1>
        </div>
        {totalPending > 0 && (
          <span className="bg-red-100 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full">
            {totalPending} pending approval{totalPending > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div>
          {/* Stat cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {([
                ['Researchers', stats.users.total, '🔬', 'text-emerald-600'],
                ['Organizations', stats.orgs.total, '🏛️', 'text-blue-600'],
                ['Active Grants', stats.grants.published, '📋', 'text-indigo-600'],
                ['Applications', stats.applications.total, '📝', 'text-violet-600'],
                ['Pending Grants', stats.grants.pending_review, '⏳', 'text-amber-600'],
                ['Active Projects', stats.projects.active, '🚀', 'text-teal-600'],
                ['Awarded', stats.applications.awarded, '🏆', 'text-yellow-600'],
                ['Moderators', stats.staff.moderators, '👥', 'text-purple-600'],
              ] as [string, number, string, string][]).map(([label, value, icon, color]) => (
                <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className={`text-2xl font-bold ${color}`}>{value ?? 0}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ['/admin', 'Review Queue', '📋'],
              ['/admin/upload', 'Upload PDF', '📄'],
              ['/god-admin/users', 'All Users', '👥'],
              ['/admin/create', 'Add Grant', '➕'],
            ] as [string, string, string][]).map(([to, label, icon]) => (
              <Link
                key={to}
                to={to}
                className="bg-white border-2 border-gray-100 hover:border-purple-300 rounded-xl p-4 text-center transition-colors"
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm font-medium text-gray-700">{label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── PENDING ORGS ── */}
      {tab === 'pending_orgs' && (
        <div>
          {pendingOrgs.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gray-500 text-sm">No pending organization verifications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrgs.map(org => (
                <div key={org.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-base">{org.org_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{org.org_type} · {org.email}</p>
                      {org.org_website && (
                        <a href={org.org_website} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-0.5 block">
                          {org.org_website}
                        </a>
                      )}
                      {org.org_description && (
                        <p className="text-sm text-gray-600 mt-2 max-w-xl">{org.org_description}</p>
                      )}
                      {org.org_address && (
                        <p className="text-xs text-gray-400 mt-1">📍 {org.org_address}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => verifyOrg(org.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ✓ Verify
                      </button>
                      <button
                        onClick={() => rejectOrg(org.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE STAFF ACCOUNT ── */}
      {tab === 'create_staff' && (
        <div className="max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Create Staff Account</h2>
            <p className="text-xs text-gray-500 mb-5">
              Creates a moderator or god admin account directly. The person can log in immediately — no approval needed.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Dr. Ayesha Rahman"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="ayesha@example.org"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="moderator">Moderator — reviews grants, manages queue</option>
                  <option value="god_admin">God Admin — full platform control</option>
                </select>
              </div>

              {createMsg.text && (
                <p className={`text-xs font-medium ${createMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {createMsg.type === 'ok' ? '✓ ' : '✗ '}{createMsg.text}
                </p>
              )}

              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
              >
                {creating ? 'Creating…' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MANAGE STAFF ── */}
      {tab === 'manage_staff' && (
        <div>
          {staff.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500 text-sm">No moderators yet. Create one in the "Create Staff Account" tab.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staff.map(u => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.full_name}</p>
                        {u.institution && <p className="text-xs text-gray-400">{u.institution}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.role === 'god_admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role === 'god_admin' ? 'God Admin' : 'Moderator'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.account_status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {u.account_status !== 'suspended' ? (
                            <button
                              onClick={() => suspendStaff(u.id)}
                              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-lg transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => reactivateStaff(u.id)}
                              className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-2 py-1 rounded-lg transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Demote ${u.full_name} back to Researcher?`)) demoteStaff(u.id)
                            }}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-lg transition-colors"
                          >
                            → Researcher
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
