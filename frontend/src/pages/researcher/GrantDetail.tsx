import { useParams, Link } from 'react-router-dom'
import { useGrant, useToggleWatchlist } from '../../hooks/useGrants'
import { formatDeadline, formatFunding, deadlineDaysLeft, deadlineUrgency, urgencyClasses, slugToLabel } from '../../utils'

export default function GrantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: grant, isLoading } = useGrant(id!)
  const toggleWatchlist = useToggleWatchlist()

  if (isLoading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      {[120, 80, 200].map(h => (
        <div key={h} style={{ height: h }} className="bg-gray-50 rounded-xl animate-pulse" />
      ))}
    </div>
  )

  if (!grant) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center text-gray-400">Grant not found.</div>
  )

  const days = deadlineDaysLeft(grant.deadline)
  const urgency = deadlineUrgency(days)

  return (
    <div className="max-w-5xl mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
        <Link to="/grants" className="text-emerald-600 hover:text-emerald-700">Browse grants</Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{grant.title_en}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            {/* Agency */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700 flex-shrink-0">
                {grant.issuing_agency.split(' ').map(w => w[0]).join('').slice(0, 3)}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">{grant.issuing_agency}</p>
                {grant.agency_type && <p className="text-[11px] text-gray-400">{slugToLabel(grant.agency_type)}</p>}
              </div>
            </div>

            <h1 className="text-lg font-medium text-gray-900 leading-snug mb-1">{grant.title_en}</h1>
            {grant.title_bn && <p className="text-sm text-gray-500 mb-3">{grant.title_bn}</p>}

            {/* Meta chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {grant.deadline && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  📅 {formatDeadline(grant.deadline)}
                </span>
              )}
              {days !== null && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${urgencyClasses[urgency]}`}>
                  {days === 0 ? 'Closing today' : `${days} days left`}
                </span>
              )}
              {(grant.funding_min || grant.funding_max) && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                  {formatFunding(grant.funding_min, grant.funding_max, grant.currency)}
                </span>
              )}
              {grant.match_reasons && grant.match_reasons.length > 0 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  ✓ Matches your profile
                </span>
              )}
            </div>

            <hr className="border-gray-100 mb-4" />

            {/* Description */}
            {grant.description_en && (
              <>
                <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">About this grant</p>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{grant.description_en}</p>
              </>
            )}

            {/* Research areas */}
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">Research areas</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {grant.research_areas.map(area => (
                <span
                  key={area}
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    grant.match_reasons?.includes(area)
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  {grant.match_reasons?.includes(area) && '✓ '}{slugToLabel(area)}
                </span>
              ))}
            </div>

            {/* Eligibility */}
            <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-2">Eligibility</p>
            <div className="flex flex-wrap gap-1.5">
              {grant.eligibility_types.map(e => (
                <span key={e} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                  {slugToLabel(e)}
                </span>
              ))}
            </div>
          </div>

          {/* Source documents */}
          {grant.source_url && (
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-3">Source documents</p>
              <a
                href={grant.source_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                View original notice →
              </a>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <button
              onClick={() => toggleWatchlist.mutate(grant.id)}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                grant.is_watchlisted
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {grant.is_watchlisted ? '✓ Saved to watchlist' : '+ Save to watchlist'}
            </button>
            <a
              href={`/api/grants/${grant.id}/calendar.ics`}
              download
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📅 Add deadline to calendar
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Share grant
            </button>

            <hr className="border-gray-100" />

            {grant.deadline && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-400 mb-1">Deadline</p>
                <p className={`text-sm font-medium ${urgency === 'urgent' ? 'text-red-600' : urgency === 'soon' ? 'text-amber-600' : 'text-gray-900'}`}>
                  {formatDeadline(grant.deadline)}
                </p>
                {days !== null && (
                  <div className="mt-2">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${urgency === 'urgent' ? 'bg-red-500' : urgency === 'soon' ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, Math.max(5, 100 - days))}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{days} days remaining</p>
                  </div>
                )}
              </div>
            )}

            {(grant.funding_min || grant.funding_max) && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-400 mb-1">Funding range</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatFunding(grant.funding_min, grant.funding_max, grant.currency)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
