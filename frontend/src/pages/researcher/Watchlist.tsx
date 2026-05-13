import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Link } from 'react-router-dom'
import { apiClient } from '../../api/client'
import { formatDistanceToNow, parseISO, isPast, differenceInDays } from 'date-fns'

function DeadlineBadge({ deadline }: { deadline: string | null }) {
  if (!deadline) return <span className="text-xs text-gray-400">No deadline</span>
  const d = parseISO(deadline)
  const past = isPast(d)
  const days = differenceInDays(d, new Date())
  if (past) return <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Expired</span>
  if (days <= 7) return <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">⏰ {days}d left</span>
  return <span className="text-xs text-gray-500">{formatDistanceToNow(d, { addSuffix: true })}</span>
}

export default function WatchlistPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery('watchlist', async () => {
    const res = await apiClient.get('/grants/me/watchlist?page_size=50')
    return res.data
  })

  const removeMutation = useMutation(
    (grantId: string) => apiClient.post(`/grants/${grantId}/watchlist`),
    { onSuccess: () => queryClient.invalidateQueries('watchlist') }
  )

  const grants = data?.items || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
          <p className="text-gray-500 text-sm mt-1">
            {grants.length} saved {grants.length === 1 ? 'grant' : 'grants'}
          </p>
        </div>
        <Link
          to="/grants"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Browse more grants →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : grants.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-gray-500 font-medium">Your watchlist is empty</p>
          <p className="text-gray-400 text-sm mt-1">Save grants you're interested in to track them here</p>
          <Link
            to="/grants"
            className="inline-block mt-4 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse grants
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {grants.map((grant: any) => (
            <div
              key={grant.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {grant.issuing_agency}
                  </span>
                  <DeadlineBadge deadline={grant.deadline} />
                </div>
                <Link
                  to={`/grants/${grant.id}`}
                  className="font-semibold text-gray-900 hover:text-blue-700 text-sm leading-snug block"
                >
                  {grant.title_en}
                </Link>
                {grant.description_en && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{grant.description_en}</p>
                )}
                {grant.funding_max && (
                  <p className="text-xs font-medium text-green-700 mt-1.5">
                    Up to BDT {Number(grant.funding_max).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeMutation.mutate(grant.id)}
                title="Remove from watchlist"
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
