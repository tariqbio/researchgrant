import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { formatDistanceToNow, parseISO } from 'date-fns'

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending_ocr: 'bg-gray-100 text-gray-600',
    ocr_running: 'bg-blue-50 text-blue-600',
    ai_running: 'bg-purple-50 text-purple-600',
    pending_review: 'bg-yellow-50 text-yellow-700',
    ocr_failed: 'bg-red-50 text-red-600',
    ai_failed: 'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = {
    pending_ocr: 'Queued',
    ocr_running: 'OCR running',
    ai_running: 'AI extracting',
    pending_review: 'Needs review',
    ocr_failed: 'OCR failed',
    ai_failed: 'AI failed',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function AdminDashboard() {
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

  const pendingCount = queue?.total ?? 0
  const failedJobs = (jobs || []).filter((j: any) => j.job_status.includes('failed')).length
  const pendingSubmissions = (submissions || []).length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of the ingestion pipeline and review queue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending Review" value={pendingCount} color="text-yellow-600" sub="grants awaiting approval" />
        <StatCard label="Community Submissions" value={pendingSubmissions} color="text-blue-600" sub="URLs submitted by researchers" />
        <StatCard label="Pipeline Failures" value={failedJobs} color={failedJobs > 0 ? "text-red-600" : "text-gray-400"} sub="in last 10 jobs" />
        <StatCard label="Quick Actions" value="↓" color="text-gray-400" sub="see below" />
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Link
          to="/admin/queue"
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 hover:shadow-sm transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-xl">📋</div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-yellow-700">Review Queue</p>
              <p className="text-xs text-gray-500">{pendingCount} grants pending</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/upload"
          className="bg-blue-50 border border-blue-200 rounded-xl p-5 hover:shadow-sm transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📤</div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-blue-700">Upload PDF</p>
              <p className="text-xs text-gray-500">Add a grant notice manually</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/submissions"
          className="bg-green-50 border border-green-200 rounded-xl p-5 hover:shadow-sm transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">🔗</div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-green-700">Submissions</p>
              <p className="text-xs text-gray-500">{pendingSubmissions} URLs pending</p>
            </div>
          </div>
        </Link>
        <Link
          to="/admin/create"
          className="bg-purple-50 border border-purple-200 rounded-xl p-5 hover:shadow-sm transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-xl">✏️</div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-purple-700">Add Grant</p>
              <p className="text-xs text-gray-500">Manual entry, no PDF</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent pipeline jobs */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Pipeline Jobs</h2>
            <Link to="/admin/upload" className="text-xs text-blue-600 hover:text-blue-800">Upload new →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!jobs || jobs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No jobs yet</p>
            ) : (
              jobs.map((job: any) => (
                <div key={job.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate font-mono">{job.id.slice(0, 8)}…</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(parseISO(job.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <StatusBadge status={job.job_status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grants needing review */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Needs Review</h2>
            <Link to="/admin/queue" className="text-xs text-blue-600 hover:text-blue-800">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!queue?.items || queue.items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Queue is empty ✓</p>
            ) : (
              queue.items.map((grant: any) => (
                <Link
                  key={grant.id}
                  to="/admin/queue"
                  className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 block"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">{grant.title_en}</p>
                    <p className="text-xs text-gray-500 truncate">{grant.issuing_agency}</p>
                  </div>
                  {grant.ai_confidence_score != null && (
                    <span className={`text-xs font-mono font-semibold flex-shrink-0 px-2 py-0.5 rounded-full ${
                      grant.ai_confidence_score >= 0.8
                        ? 'bg-green-50 text-green-700'
                        : grant.ai_confidence_score >= 0.5
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {Math.round(grant.ai_confidence_score * 100)}%
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
