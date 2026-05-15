import { useState, useEffect, useCallback } from 'react'
import { useReviewQueue, useApproveGrant, useRejectGrant } from '../../hooks/useGrants'
import { useToast } from '../../components/ui/Toast'
import { formatDeadline, formatFunding, slugToLabel } from '../../utils'
import type { Grant } from '../../types'

function ConfidencePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-400">—</span>
  const color = score >= 0.85
    ? 'bg-green-100 text-green-800'
    : score >= 0.5
    ? 'bg-amber-100 text-amber-800'
    : 'bg-red-100 text-red-800'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {Math.round(score * 100)}%
    </span>
  )
}

function Field({ label, value, conf, warn }: {
  label: string; value: React.ReactNode; conf?: number | null; warn?: boolean
}) {
  return (
    <div className={`rounded-lg p-3 ${warn ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{label}</span>
        {conf != null && <ConfidencePill score={conf} />}
      </div>
      <div className="text-sm text-gray-900">{value || <span className="text-red-400 italic">Not extracted</span>}</div>
    </div>
  )
}

function ReviewCard({ grant, index, total, onDone }: {
  grant: Grant; index: number; total: number; onDone: () => void
}) {
  const approve = useApproveGrant()
  const reject  = useRejectGrant()
  const { toast } = useToast()
  const [note, setNote] = useState('')
  const extracted = grant.ai_extracted_fields as Record<string, number> | null
  const fc = (f: string) => extracted?.[`${f}_conf`] ?? null

  const handleApprove = useCallback(async () => {
    await approve.mutateAsync({ id: grant.id, note })
    toast('Grant approved and published ✓', 'success')
    onDone()
  }, [grant.id, note])

  const handleReject = useCallback(async () => {
    await reject.mutateAsync({ id: grant.id, note })
    toast('Grant rejected', 'info')
    onDone()
  }, [grant.id, note])

  // Keyboard shortcuts: A = approve, R = reject (only when not typing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'a' || e.key === 'A') handleApprove()
      if (e.key === 'r' || e.key === 'R') handleReject()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleApprove, handleReject])

  const lowConf = (grant.ai_confidence_score ?? 1) < 0.5

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{index + 1} / {total}</span>
          <span className="text-sm font-semibold text-gray-900">{grant.issuing_agency || 'Unknown agency'}</span>
          <ConfidencePill score={grant.ai_confidence_score} />
          {lowConf && (
            <span className="text-[11px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
              ⚠ Low confidence — review carefully
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {grant.created_at ? new Date(grant.created_at).toLocaleDateString('en-GB') : ''}
        </span>
      </div>

      <div className="p-5 space-y-4">

        {/* Fields grid */}
        <div className="grid grid-cols-1 gap-3">
          <Field label="Title (English)" value={grant.title_en} conf={fc('title_en')}
                 warn={(fc('title_en') ?? 1) < 0.5} />
          {grant.title_bn && (
            <Field label="Title (Bengali)" value={
              <span dir="auto" className="font-bangla">{grant.title_bn}</span>
            } />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline" conf={fc('deadline')} warn={!grant.deadline}
                 value={grant.deadline
                   ? <span className="font-medium">{formatDeadline(grant.deadline)}</span>
                   : null
                 } />
          <Field label="Funding" conf={fc('funding_max')}
                 value={formatFunding(grant.funding_min, grant.funding_max, grant.currency)} />
        </div>

        {grant.description_en && (
          <Field label="Description (extracted)" conf={fc('description_en')}
                 value={<p className="line-clamp-4 leading-relaxed">{grant.description_en}</p>} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Research areas" conf={fc('research_areas')} warn={(fc('research_areas') ?? 1) < 0.5}
                 value={
                   grant.research_areas?.length
                     ? <div className="flex flex-wrap gap-1 mt-1">
                         {grant.research_areas.map(a => (
                           <span key={a} className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                             {slugToLabel(a)}
                           </span>
                         ))}
                       </div>
                     : null
                 }
               />
          <Field label="Eligibility" conf={fc('eligibility_types')}
                 value={
                   grant.eligibility_types?.length
                     ? <div className="flex flex-wrap gap-1 mt-1">
                         {grant.eligibility_types.map(e => (
                           <span key={e} className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                             {slugToLabel(e)}
                           </span>
                         ))}
                       </div>
                     : null
                 }
               />
        </div>

        {grant.source_url && (
          <div className="text-xs">
            <span className="text-gray-400 mr-2">Source:</span>
            <a href={grant.source_url} target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:underline break-all">
              {grant.source_url}
            </a>
          </div>
        )}

        {/* Note */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Optional note (e.g. 'deadline unclear — set manually')"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-gray-400">
            Keyboard: <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">A</kbd> approve
            &nbsp;·&nbsp;
            <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">R</kbd> reject
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={reject.isLoading}
              className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl
                         hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={approve.isLoading}
              className="px-5 py-2 text-sm bg-emerald-600 text-white font-semibold rounded-xl
                         hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {approve.isLoading ? 'Publishing…' : 'Approve & Publish →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReviewQueuePage() {
  const { data, isLoading, refetch } = useReviewQueue()
  const [currentIndex, setCurrentIndex] = useState(0)
  const grants = data?.items ?? []
  const total = grants.length

  // J/K navigation between cards
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'j' || e.key === 'ArrowDown') setCurrentIndex(i => Math.min(i + 1, total - 1))
      if (e.key === 'k' || e.key === 'ArrowUp')   setCurrentIndex(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [total])

  const handleDone = () => {
    refetch()
    setCurrentIndex(i => Math.max(0, i - 1))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isLoading ? 'Loading…' : `${total} grant${total !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>
        {total > 1 && (
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              title="Previous (K)"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
              disabled={currentIndex === total - 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              title="Next (J)"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-2xl h-96 animate-pulse" />
      ) : total === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-3xl mb-3">✓</p>
          <p className="text-gray-500 font-medium">Queue is empty</p>
          <p className="text-gray-400 text-sm mt-1">All grants have been reviewed</p>
        </div>
      ) : (
        <>
          {/* Mini navigation strip */}
          {total > 1 && (
            <div className="flex gap-1 mb-4 flex-wrap">
              {grants.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-6 h-1.5 rounded-full transition-colors ${
                    i === currentIndex ? 'bg-emerald-500' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
          <ReviewCard
            key={grants[currentIndex]?.id}
            grant={grants[currentIndex]}
            index={currentIndex}
            total={total}
            onDone={handleDone}
          />
        </>
      )}
    </div>
  )
}
