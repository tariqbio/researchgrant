import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGrants, useWatchlist } from '../../hooks/useGrants'
import GrantCard from '../../components/grants/GrantCard'
import { formatDeadline, deadlineDaysLeft, deadlineUrgency } from '../../utils'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: matchedGrants } = useGrants({
    research_areas: user?.research_interests.join(','),
    sort_by: 'deadline',
    page_size: 3,
  })

  const { data: watchlist } = useWatchlist()

  const noInterests = !user?.research_interests?.length

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* Profile nudge */}
      {noInterests && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-blue-800">
            <strong className="font-medium">Complete your profile</strong> — add research interests to receive matched grant alerts by email.
          </p>
          <Link
            to="/profile"
            className="flex-shrink-0 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Set interests
          </Link>
        </div>
      )}

      {/* Welcome + stats row */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">
            Good morning, {user?.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {matchedGrants?.total
              ? `${matchedGrants.total} grants match your interests`
              : 'Browse all available grants below'}
          </p>
        </div>
        <Link
          to="/grants"
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Search grants →
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'New matches', value: matchedGrants?.total ?? '—', sub: 'Based on your interests' },
          { label: 'Watchlist', value: watchlist?.total ?? 0, sub: 'Saved grants' },
          { label: 'Grants live', value: '143', sub: 'Updated today' },
          { label: 'Expiring soon', value: '12', sub: 'Within 30 days', warn: true },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-xl font-medium ${stat.warn ? 'text-amber-600' : 'text-gray-900'}`}>{stat.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Matched grants */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Matched for you</h2>
            <Link to="/grants" className="text-xs text-emerald-600 hover:text-emerald-700">Browse all →</Link>
          </div>
          {matchedGrants?.items.length ? (
            matchedGrants.items.map(grant => (
              <GrantCard key={grant.id} grant={grant} showMatchBadge />
            ))
          ) : (
            <div className="bg-gray-50 rounded-xl px-4 py-8 text-center text-sm text-gray-400">
              {noInterests
                ? 'Set your research interests to see matched grants here.'
                : 'No matched grants found. Try broadening your interests.'}
            </div>
          )}
        </div>

        {/* Watchlist deadlines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-900">Watchlist deadlines</h2>
            <Link to="/watchlist" className="text-xs text-emerald-600 hover:text-emerald-700">View all →</Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            {watchlist?.items.length ? (
              watchlist.items.slice(0, 6).map(grant => {
                const days = deadlineDaysLeft(grant.deadline)
                const urgency = deadlineUrgency(days)
                const color = urgency === 'urgent' ? 'text-red-600' : urgency === 'soon' ? 'text-amber-600' : 'text-green-600'
                return (
                  <div key={grant.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{grant.title_en}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{grant.issuing_agency}</p>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${color}`}>
                      {days !== null ? `${days}d` : '—'}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No saved grants yet.{' '}
                <Link to="/grants" className="text-emerald-600">Browse →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
