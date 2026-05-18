import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { godAdminApi } from '../../api'
import { formatDistanceToNow, parseISO } from 'date-fns'

type Tab = 'overview' | 'pending_researchers' | 'review_queue'

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [pendingResearchers, setPendingResearchers] = useState<any[]>([])
  const [loadingResearchers, setLoadingResearchers] = useState(true)

  const { data: queue } = useQuery('admin-queue', async () => {
    const res = await apiClient.get('/grants/admin/queue?page_size=5')
    return res.data
  })

  const { data: jobs } = useQuery('admin-jobs', async () => {
    const res = await apiClient.get('/pipeline/jobs?limit=10')
    return res.data
  })

  const { data: submissions } = useQuery('admin-submissions', async () => {
    const res = await apiClient.get('/pipeline/submissions')
    return res.data
  })

  const loadResearchers = async () => {
    setLoadingResearchers(true)
    try {
      const r = await godAdminApi.users({ status: 'pending', role: 'researcher' }) as any
      setPendingResearchers(r.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingResearchers(false)
    }
  }

  useEffect(() => { loadResearchers() }, [])

  useEffect(() => {
    if (!loadingResearchers && pendingResearchers.length > 0) setTab('pending_researchers')
  }, [loadingResearchers])

  const approveResearcher = async (id: string) => {
    await godAdminApi.reactivate(id)
    setPendingResearchers(p => p.filter(r => r.id !== id))
  }

  const rejectResearcher = async (id: string) => {
    await godAdminApi.suspend(id)
    setPendingResearchers(p => p.filter(r => r.id !== id))
  }

  const pendingCount   = queue?.total ?? 0
  const pendingSubs    = (submissions || []).length

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',             label: 'Overview' },
    { id: 'pending_researchers',  label: 'Pending Researchers', badge: pendingResearchers.length },
    { id: 'review_queue',         label: 'Grant Review Queue',  badge: pendingCount || undefined },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Moderator</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Moderator Dashboard</h1>
        </div>
        {pendingResearchers.length > 0 && (
          <span className="bg-red-100 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-full">
            {pendingResearchers.length} researcher{pendingResearchers.length > 1 ? 's' : ''} waiting
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
                ? 'border-blue-600 text-blue-700'
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Pending Review"       value={pendingCount}               color="text-yellow-600" sub="grants awaiting approval" />
            <StatCard label="Pending Researchers"  value={pendingResearchers.length}  color={pendingResearchers.length > 0 ? 'text-red-500' : 'text-gray-400'} sub="accounts waiting" />
            <StatCard label="URL Submissions"      value={pendingSubs}                color="text-blue-600"   sub="submitted by researchers" />
            <StatCard label="Pipeline Jobs"        value={(jobs || []).length}        color="text-gray-600"   sub="recent ingestion jobs" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {([
              ['/admin/queue',       'Review Queue',    '📋', 'bg-yellow-50 border-yellow-200 hover:text-yellow-700', `${pendingCount} grants pending`],
              ['/admin/upload',      'Upload PDF',      '📤', 'bg-blue-50 border-blue-200 hover:text-blue-700',       'Add a grant notice'],
              ['/admin/submissions', 'URL Submissions', '🔗', 'bg-green-50 border-green-200 hover:text-green-700',    `${pendingSubs} URLs pending`],
              ['/admin/create',      'Add Grant',       '✏️', 'bg-purple-50 border-purple-200 hover:text-purple-700', 'Manual entry, no PDF'],
            ] as [string,string,string,string,string][]).map(([to, label, icon, cls, sub]) => (
              <Link key={to} to={to} className={`border rounded-xl p-5 hover:shadow-sm transition-shadow group ${cls}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-white bg-opacity-60">{icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Recent Pipeline Jobs</h2>
                <Link to="/admin/upload" className="text-xs text-blue-600 hover:text-blue-800">Upload new →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {!jobs || jobs.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No jobs yet</p>
                  : jobs.map((job: any) => (
                    <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-mono">{job.id.slice(0, 8)}…</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(parseISO(job.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {job.job_status}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Grants Needing Review</h2>
                <Link to="/admin/queue" className="text-xs text-blue-600 hover:text-blue-800">View all →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {!queue?.items || queue.items.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">Queue is empty ✓</p>
                  : queue.items.map((grant: any) => (
                    <Link key={grant.id} to="/admin/queue"
                      className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 block">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">{grant.title_en}</p>
                        <p className="text-xs text-gray-500 truncate">{grant.issuing_agency}</p>
                      </div>
                      {grant.ai_confidence_score != null && (
                        <span className={`text-xs font-mono font-semibold flex-shrink-0 px-2 py-0.5 rounded-full ${
                          grant.ai_confidence_score >= 0.8 ? 'bg-green-50 text-green-700'
                          : grant.ai_confidence_score >= 0.5 ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                        }`}>
                          {Math.round(grant.ai_confidence_score * 100)}%
                        </span>
                      )}
                    </Link>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PENDING RESEARCHERS ── */}
      {tab === 'pending_researchers' && (
        <div>
          {loadingResearchers ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : pendingResearchers.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-medium text-gray-700 mb-1">No pending accounts</p>
              <p className="text-gray-400 text-sm">
                When researchers, students, or volunteers sign up they'll appear here for your approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingResearchers.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-gray-900">{r.full_name}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                      {r.institution && (
                        <p className="text-xs text-gray-500">
                          🏛️ {r.institution}{r.department ? ` · ${r.department}` : ''}
                        </p>
                      )}
                      {r.designation    && <p className="text-xs text-gray-500">💼 {r.designation}</p>}
                      {r.academic_degree && <p className="text-xs text-gray-500">🎓 {r.academic_degree}</p>}
                      {r.orcid_id       && <p className="text-xs text-gray-400">ORCID: {r.orcid_id}</p>}
                      {r.publication_count > 0 && <p className="text-xs text-gray-400">📄 {r.publication_count} publications</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => approveResearcher(r.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => rejectResearcher(r.id)}
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

      {/* ── GRANT REVIEW QUEUE ── */}
      {tab === 'review_queue' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Grants Needing Review ({pendingCount})</h2>
            <Link to="/admin/queue"
              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              Open Full Queue →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!queue?.items || queue.items.length === 0
              ? <p className="text-sm text-gray-400 text-center py-12">Queue is empty ✓</p>
              : queue.items.map((grant: any) => (
                <Link key={grant.id} to="/admin/queue"
                  className="px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 block">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 font-medium">{grant.title_en}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{grant.issuing_agency}</p>
                  </div>
                  {grant.ai_confidence_score != null && (
                    <span className={`text-xs font-mono font-semibold flex-shrink-0 px-2 py-0.5 rounded-full ${
                      grant.ai_confidence_score >= 0.8 ? 'bg-green-50 text-green-700'
                      : grant.ai_confidence_score >= 0.5 ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                    }`}>
                      {Math.round(grant.ai_confidence_score * 100)}%
                    </span>
                  )}
                </Link>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
