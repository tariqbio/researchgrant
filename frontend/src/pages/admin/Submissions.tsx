import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '../../api/client'
import { formatDistanceToNow, parseISO } from 'date-fns'

export default function AdminSubmissionsPage() {
  const queryClient = useQueryClient()

  const { data: submissions, isLoading } = useQuery('admin-submissions', async () => {
    const res = await apiClient.get('/pipeline/submissions')
    return res.data
  })

  const approveMutation = useMutation(
    (id: string) => apiClient.post(`/pipeline/submissions/${id}/approve`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-submissions')
        queryClient.invalidateQueries('admin-jobs')
      },
    }
  )

  const rejectMutation = useMutation(
    (id: string) => apiClient.post(`/pipeline/submissions/${id}/reject`),
    { onSuccess: () => queryClient.invalidateQueries('admin-submissions') }
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">
          Grant URLs submitted by researchers. Approve to queue through the AI pipeline.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !submissions || submissions.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-medium">No pending submissions</p>
          <p className="text-gray-400 text-sm mt-1">Researchers can submit grant URLs from the Browse page</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub: any) => (
            <div key={sub.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <a
                    href={sub.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 truncate block"
                  >
                    {sub.source_url}
                  </a>
                  {sub.notes && (
                    <p className="text-sm text-gray-600 mt-1">{sub.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted {formatDistanceToNow(parseISO(sub.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => rejectMutation.mutate(sub.id)}
                    disabled={rejectMutation.isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(sub.id)}
                    disabled={approveMutation.isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {approveMutation.isLoading ? '…' : 'Approve & Extract'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
