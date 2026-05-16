import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useAuth } from '../../hooks/useAuth'
import { useGrants, useWatchlist } from '../../hooks/useGrants'
import { apiClient } from '../../api/client'
import GrantCard from '../../components/grants/GrantCard'
import { deadlineDaysLeft } from '../../utils'

function greeting(name: string) {
  const h = new Date().getHours()
  const prefix = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${prefix}, ${name.split(' ')[0]}`
}

function StatCard({ value, label, to }: { value: string | number; label: string; to?: string }) {
  const inner = (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center hover:border-gray-200 transition-colors">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

export default function DashboardPage() {
  const { user } = useAuth()

  // research_areas expects string[] not a joined string
  const { data: matchedGrantsRes } = useGrants({
    areas: user?.research_interests ?? [],
    sort_by: 'deadline',
    page_size: 6,
  })
  // useGrants returns the raw AxiosResponse — unwrap .data
  const matchedGrants = (matchedGrantsRes as any)?.data

  const { data: watchlistRes } = useWatchlist()
  // useWatchlist returns raw AxiosResponse — unwrap .data
  const watchlist = (watchlistRes as any)?.data

  const { data: stats } = useQuery('platform-stats', async () => {
    const res = await apiClient.get('/grants/stats/summary')
    return res.data
  }, { staleTime: 60_000 })

  const noInterests = !user?.research_interests?.length

  const urgentCount = (watchlist?.items ?? []).filter((g: any) => {
    const d = deadlineDaysLeft(g.deadline ?? null)
    return d !== null && d >= 0 && d <= 7
  }).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {noInterests && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3
                        flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            <strong className="font-medium">Set your research interests</strong> — we'll email you
            the moment a matching grant is published.
          </p>
          <Link
            to="/profile"
            className="flex-shrink-0 text-sm bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600"
          >
            Set up now →
          </Link>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">
            {greeting(user?.full_name ?? 'Researcher')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {noInterests
              ? 'Add interests to see matched grants here'
              : matchedGrants?.total
              ? `${matchedGrants.total} grant${matchedGrants.total === 1 ? '' : 's'} match your interests`
              : "No matches yet — we'll alert you when they appear"}
          </p>
        </div>
        <Link
          to="/browse"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50"
        >
          Browse all →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard value={stats?.total_grants ?? '—'} label="Active grants" to="/browse" />
        <StatCard value={stats?.expiring_soon ?? '—'} label="Closing in 30 days" to="/browse" />
        <StatCard value={watchlist?.items?.length ?? '—'} label="Watchlisted" to="/watchlist" />
        <StatCard value={urgentCount || '—'} label="Urgent (≤7 days)" to="/watchlist" />
      </div>

      {!noInterests && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Matched to your interests</h2>
            <Link to="/browse" className="text-xs text-emerald-600 hover:text-emerald-700">Browse all →</Link>
          </div>
          {(matchedGrants?.items ?? []).length === 0 ? (
            <div className="bg-gray-50 rounded-xl py-10 text-center border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">No grants match your interests yet</p>
              <p className="text-xs text-gray-300 mt-1">We'll email you as soon as one appears</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(matchedGrants?.items ?? []).map((g: any) => (
                <GrantCard key={g.id} grant={g} showMatchBadge />
              ))}
            </div>
          )}
        </section>
      )}

      {(watchlist?.items?.length ?? 0) > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Your watchlist</h2>
            <Link to="/watchlist" className="text-xs text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(watchlist?.items ?? []).slice(0, 3).map((g: any) => (
              <GrantCard key={g.id} grant={g} />
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link to="/browse" className="bg-white border border-gray-100 rounded-xl p-4 hover:border-emerald-200 hover:bg-emerald-50 transition-colors group">
          <p className="text-xl mb-1">🔍</p>
          <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700">Browse grants</p>
          <p className="text-xs text-gray-400">Search by area, agency, deadline</p>
        </Link>
        <Link to="/profile" className="bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50 transition-colors group">
          <p className="text-xl mb-1">🎯</p>
          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">Alert settings</p>
          <p className="text-xs text-gray-400">Update your research interests</p>
        </Link>
        <Link to="/submit" className="bg-white border border-gray-100 rounded-xl p-4 hover:border-purple-200 hover:bg-purple-50 transition-colors group">
          <p className="text-xl mb-1">📤</p>
          <p className="text-sm font-medium text-gray-900 group-hover:text-purple-700">Submit a grant</p>
          <p className="text-xs text-gray-400">Found one we missed? Share it</p>
        </Link>
      </section>
    </div>
  )
}
