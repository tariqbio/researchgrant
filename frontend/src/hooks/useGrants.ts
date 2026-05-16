import { useQuery, useMutation, useQueryClient } from 'react-query'
import { grantApi, pipelineApi } from '../api'
import type { GrantSearchParams } from '../types'

export function useGrants(params: GrantSearchParams) {
  return useQuery(
    ['grants', params],
    () => grantApi.list(params),
    { keepPreviousData: true, staleTime: 60_000 }
  )
}

export function useGrant(id: string) {
  return useQuery(
    ['grant', id],
    () => grantApi.get(id),
    { enabled: !!id }
  )
}

export function useWatchlist(page = 1) {
  return useQuery(['watchlist', page], () => grantApi.myWatchlist(page))
}

export function useToggleWatchlist() {
  const qc = useQueryClient()
  return useMutation(
    (grantId: string) => grantApi.toggleWatchlist(grantId),
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
    () => grantApi.reviewQueue(page),
    { refetchInterval: 30_000 }  // poll every 30s
  )
}

export function useApproveGrant() {
  const qc = useQueryClient()
  return useMutation(
    ({ id, edits, note }: { id: string; edits?: Record<string, unknown>; note?: string }) =>
      grantApi.approve(id, edits as any, note),
    { onSuccess: () => qc.invalidateQueries('reviewQueue') }
  )
}

export function useRejectGrant() {
  const qc = useQueryClient()
  return useMutation(
    ({ id, note }: { id: string; note?: string }) => grantApi.reject(id, note),
    { onSuccess: () => qc.invalidateQueries('reviewQueue') }
  )
}

export function useUploadPdf() {
  const qc = useQueryClient()
  return useMutation(
    ({ file, sourceId }: { file: File; sourceId?: string }) =>
      pipelineApi.uploadPdf(file, sourceId),
    { onSuccess: () => qc.invalidateQueries('reviewQueue') }
  )
}

export function useSources() {
  return useQuery('sources', pipelineApi.sources, { staleTime: 300_000 })
}
