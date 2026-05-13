import { useState } from 'react'
import { useReviewQueue, useApproveGrant, useRejectGrant } from '../../hooks/useGrants'
import { formatDeadline, formatFunding, slugToLabel } from '../../utils'
import type { Grant } from '../../types'

function ConfidencePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-400">—</span>
  const color = score >= 0.85 ? 'bg-green-100 text-green-800' : score >= 0.5 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{score.toFixed(2)}</span>
}

function ReviewCard({ grant, onDone }: { grant: Grant; onDone: () => void }) {
  const approve = useApproveGrant()
  const reject = useRejectGrant()
  const [note, setNote] = useState('')
  const extracted = grant.ai_extracted_fields as Record<string, number> | null

  const fieldConf = (field: string) => extracted?.[`${field}_conf`] ?? null

  const handleApprove = async () => {
    await approve.mutateAsync({ id: grant.id, note })
    onDone()
  }

  const handleReject = async () => {
    await reject.mutateAsync({ id: grant.id, note })
    onDone()
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{grant.issuing_agency}</span>
          <ConfidencePill score={grant.ai_confidence_score} />
        </div>
        <span className="text-xs text-gray-400">{grant.created_at ? new Date(grant.created_at).toLocaleDateString() : ''}</span>
      </div>

      {/* Split: extracted fields */}
      <div className="p-4 space-y-3">
        {/* Title EN */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wide text-gray-400">Title (English)</span>
            <ConfidencePill score={fieldConf('title_en')} />
          </div>
          <p className="text-sm font-medium text-gray-900">{grant.title_en}</p>
        </div>

        {/* Title BN */}
        {grant.title_bn && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-400">Title (Bengali)</span>
            </div>
            <p className="text-sm text-gray-700">{grant.title_bn}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-400">Deadline</span>
              <ConfidencePill score={fieldConf('deadline')} />
            </div>
            <p className="text-sm text-gray-900">{grant.deadline ? formatDeadline(grant.deadline) : <span className="text-red-500">Not found</span>}</p>
          </div>
          {/* Funding */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wide text-gray-400">Funding</span>
              <ConfidencePill score={fieldConf('funding_min')} />
            </div>
            <p className="text-sm text-gray-900">{formatFunding(grant.funding_min, grant.funding_max, grant.currency)}</p>
          </div>
        </div>

        {/* Research areas */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wide text-gray-400">Research areas</span>
            <ConfidencePill score={fieldConf('research_areas')} />
          </div>
          <div className="flex flex-wrap gap-1">
            {grant.research_areas.map(a => (
              <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{slugToLabel(a)}</span>
            ))}
            {!grant.research_areas.length && <span className="text-xs text-red-500">No areas extracted</span>}
          </div>
        </div>

        {/* Eligibility */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wide text-gray-400">Eligibility</span>
            <ConfidencePill score={fieldConf('eligibility_types')} />
          </div>
          <div className="flex flex-wrap gap-1">
            {grant.eligibility_types.map(e => (
              <span key={e} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{slugToLabel(e)}</span>
            ))}
          </div>
        </div>

        {/* Admin note */}
        <div>
          <label className="text-[11px] uppercase tracking-wide text-gray-400 block mb-1">Admin note (optional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Note for future reference..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleReject}
            disabled={reject.isLoading}
            className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reject
          </button>
          <div className="flex gap-2">
            <a href={grant.source_url || '#'} target="_blank" rel="noreferrer"
              className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              View source
            </a>
            <button
              onClick={handleApprove}
              disabled={approve.isLoading}
              className="text-sm bg-emerald-600 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {approve.isLoading ? 'Publishing...' : '✓ Approve & publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReviewQueuePage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, refetch } = useReviewQueue(page)

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Review queue</h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.total ?? 0} grants pending review</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && !data?.items.length && (
        <div className="py-16 text-center text-sm text-gray-400 bg-gray-50 rounded-xl">
          Queue is empty — all caught up! 🎉
        </div>
      )}

      <div className="space-y-4">
        {data?.items.map(grant => (
          <ReviewCard key={grant.id} grant={grant} onDone={() => refetch()} />
        ))}
      </div>
    </div>
  )
}
