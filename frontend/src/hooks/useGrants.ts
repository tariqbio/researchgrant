import { useQuery, useMutation, useQueryClient } from 'react-query'
import { grantsApi, pipelineApi } from '../api'

export interface GrantSearchParams {
  q?: string
  areas?: string[]
  sort_by?: string
  page?: number
  page_size?: number
}

export function useGrants(params: GrantSearchParams) {
  return useQuery(
    ['grants', params],
    () => grantsApi.list(params),
    { keepPreviousData: true, staleTime: 60_000 }
  )
}

export function useGrant(id: string) {
  return useQuery(
    ['grant', id],
    () => grantsApi.get(id).then(r => r.data),
    { enabled: !!id }
  )
}

export function useWatchlist(page = 1) {
  return useQuery(['watchlist', page], () => grantsApi.watchlist())
}

export function useToggleWatchlist() {
  const qc = useQueryClient()
  return useMutation(
    (grantId: string) => grantsApi.toggleWatchlist(grantId),
    {
      onSuccess: (_, grantId) => {
        qc.invalidateQueries(['grant', grantId])
        qc.invalidateQueries('watchlist')
      },
    }
  )
}

export function useReviewQueue(page = 1) {
  return useQuery(
    ['reviewQueue', page],
    () => grantsApi.adminQueue({ page }).then(r => r.data),
    { refetchInterval: 30_000 }
  )
}

export function useApproveGrant() {
  const qc = useQueryClient()
  return useMutation(
    ({ id, edits, note }: { id: string; edits?: Record<string, unknown>; note?: string }) =>
      grantsApi.adminAction(id, 'approve', edits as any, note),
    { onSuccess: () => qc.invalidateQueries('reviewQueue') }
  )
}

export function useRejectGrant() {
  const qc = useQueryClient()
  return useMutation(
    ({ id, note }: { id: string; note?: string }) =>
      grantsApi.adminAction(id, 'reject', undefined, note),
    { onSuccess: () => qc.invalidateQueries('reviewQueue') }
  )
}

export function useUploadPdf() {
  const qc = useQueryClient()
  return useMutation(
    ({ file, sourceId }: { file: File; sourceId?: string }) => {
      const fd = new FormData()
      fd.append('file', file)
      if (sourceId) fd.append('source_id', sourceId)
      return pipelineApi.upload(fd).then(r => r.data)
    },
    { onSuccess: () => qc.invalidateQueries('reviewQueue') }
  )
}

export function useSources() {
  // Sources are fetched via the pipeline API — return empty array if not available
  return useQuery('sources', () => Promise.resolve([] as any[]), { staleTime: 300_000 })
}
