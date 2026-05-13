import { Link } from 'react-router-dom'
import { useToggleWatchlist } from '../../hooks/useGrants'
import { formatDeadline, formatFunding, deadlineDaysLeft, deadlineUrgency, urgencyClasses, slugToLabel } from '../../utils'
import type { Grant } from '../../types'

interface Props {
  grant: Grant
  showMatchBadge?: boolean
}

export default function GrantCard({ grant, showMatchBadge = false }: Props) {
  const toggleWatchlist = useToggleWatchlist()
  const days = deadlineDaysLeft(grant.deadline)
  const urgency = deadlineUrgency(days)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors group">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <Link
          to={`/grants/${grant.id}`}
          className="text-[14px] font-medium text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2"
        >
          {grant.title_en}
        </Link>
        <button
          onClick={() => toggleWatchlist.mutate(grant.id)}
          className={`flex-shrink-0 p-1 rounded transition-colors ${
            grant.is_watchlisted
              ? 'text-emerald-600'
              : 'text-gray-300 hover:text-gray-500'
          }`}
          title={grant.is_watchlisted ? 'Remove from watchlist' : 'Save to watchlist'}
        >
          <svg className="w-4 h-4" fill={grant.is_watchlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-2.5">{grant.issuing_agency}</p>

      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {/* Deadline pill */}
        {days !== null && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${urgencyClasses[urgency]}`}>
            {days === 0 ? 'Closing today' : `${days}d left`}
          </span>
        )}
        {/* Funding */}
        {(grant.funding_min || grant.funding_max) && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {formatFunding(grant.funding_min, grant.funding_max, grant.currency)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {/* Matched interests */}
        {showMatchBadge && grant.match_reasons?.map(area => (
          <span key={area} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
            ✓ {slugToLabel(area)}
          </span>
        ))}
        {/* Other research areas */}
        {grant.research_areas
          .filter(a => !grant.match_reasons?.includes(a))
          .slice(0, 3)
          .map(area => (
            <span key={area} className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {slugToLabel(area)}
            </span>
          ))
        }
        {/* Eligibility */}
        {grant.eligibility_types.slice(0, 2).map(e => (
          <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {slugToLabel(e)}
          </span>
        ))}
      </div>
    </div>
  )
}
