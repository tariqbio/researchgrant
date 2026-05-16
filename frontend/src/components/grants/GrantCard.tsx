import { Link } from 'react-router-dom'
import { useToggleWatchlist } from '../../hooks/useGrants'
import { useToast } from '../ui/Toast'
import {
  formatDeadline, formatFunding, deadlineDaysLeft,
  deadlineUrgency, urgencyClasses, slugToLabel,
} from '../../utils'
import type { GrantExtended as Grant } from '../../types'

interface Props {
  grant: Grant
  showMatchBadge?: boolean
}

export default function GrantCard({ grant, showMatchBadge = false }: Props) {
  const toggleWatchlist = useToggleWatchlist()
  const { toast } = useToast()
  const days = deadlineDaysLeft(grant.deadline ?? null)
  const urgency = deadlineUrgency(days)
  const isExpired = days !== null && days < 0

  const handleWatchlist = () => {
    toggleWatchlist.mutate(grant.id, {
      onSuccess: () => toast(
        grant.is_watchlisted ? 'Removed from watchlist' : 'Saved to watchlist',
        grant.is_watchlisted ? 'info' : 'success'
      ),
    })
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    const url = `${window.location.origin}/grants/${grant.id}`
    const text = `${grant.title_en} — deadline ${grant.deadline ? formatDeadline(grant.deadline) : 'see link'}\n${url}`
    // WhatsApp share (most-used in Bangladesh)
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    await navigator.clipboard.writeText(`${window.location.origin}/grants/${grant.id}`)
    toast('Link copied!', 'success')
  }

  return (
    <div className={`bg-white border rounded-xl p-4 hover:border-gray-200 hover:shadow-sm
                     transition-all group relative ${isExpired ? 'opacity-60' : 'border-gray-100'}`}>

      {/* Expired ribbon */}
      {isExpired && (
        <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 text-[10px] font-semibold
                        px-2 py-0.5 rounded-bl-lg rounded-tr-xl tracking-wide">
          CLOSED
        </div>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <Link
          to={`/grants/${grant.id}`}
          className="text-[14px] font-medium text-gray-900 leading-snug
                     group-hover:text-emerald-700 transition-colors line-clamp-2 pr-1"
        >
          {grant.title_en}
        </Link>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* WhatsApp share */}
          <button
            onClick={handleShare}
            title="Share on WhatsApp"
            className="p-1 rounded text-gray-300 hover:text-green-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            title="Copy link"
            className="p-1 rounded text-gray-300 hover:text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>

          {/* Watchlist */}
          <button
            onClick={handleWatchlist}
            title={grant.is_watchlisted ? 'Remove from watchlist' : 'Save to watchlist'}
            className={`p-1 rounded transition-colors ${
              grant.is_watchlisted ? 'text-emerald-600' : 'text-gray-300 hover:text-gray-500'
            }`}
          >
            <svg className="w-4 h-4" fill={grant.is_watchlisted ? 'currentColor' : 'none'}
                 stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-2.5">{grant.issuing_agency}</p>

      {/* Pills row */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {days !== null && !isExpired && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${urgencyClasses[urgency]}`}>
            {days === 0 ? 'Closing today' : `${days}d left`}
          </span>
        )}
        {isExpired && grant.deadline && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
            Closed {formatDeadline(grant.deadline)}
          </span>
        )}
        {(grant.funding_min || grant.funding_max) && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {formatFunding(grant.funding_min ?? null, grant.funding_max ?? null, grant.currency)}
          </span>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {showMatchBadge && grant.match_reasons?.map(area => (
          <span key={area} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
            ✓ {slugToLabel(area)}
          </span>
        ))}
        {grant.research_areas
          .filter(a => !grant.match_reasons?.includes(a))
          .slice(0, 3)
          .map(area => (
            <span key={area} className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {slugToLabel(area)}
            </span>
          ))}
        {grant.eligibility_types.slice(0, 2).map(e => (
          <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {slugToLabel(e)}
          </span>
        ))}
      </div>
    </div>
  )
}
