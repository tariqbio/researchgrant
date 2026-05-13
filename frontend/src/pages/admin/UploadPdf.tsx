import { useState, useRef, DragEvent } from 'react'
import { useUploadPdf, useSources } from '../../hooks/useGrants'
import { apiClient } from '../../api/client'
import type { IngestionJob } from '../../types'

const STATUS_LABELS: Record<string, { label: string; color: string; done: boolean }> = {
  pending_ocr:    { label: 'Queued for OCR',      color: 'text-gray-400',   done: false },
  ocr_running:    { label: 'Running OCR...',       color: 'text-blue-600',   done: false },
  ocr_failed:     { label: 'OCR failed',           color: 'text-red-600',    done: true  },
  ai_running:     { label: 'AI extracting...',     color: 'text-purple-600', done: false },
  ai_failed:      { label: 'AI extraction failed', color: 'text-red-600',    done: true  },
  pending_review: { label: 'Ready for review ✓',  color: 'text-emerald-600',done: true  },
  approved:       { label: 'Published ✓',          color: 'text-emerald-600',done: true  },
  rejected:       { label: 'Rejected',             color: 'text-red-500',    done: true  },
}

function JobStatusRow({ job }: { job: IngestionJob }) {
  const status = STATUS_LABELS[job.job_status] ?? { label: job.job_status, color: 'text-gray-500', done: false }
  const filename = job.raw_file_path?.split('/').pop() ?? 'Uploaded file'

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-900 truncate">{filename}</p>
          <p className="text-xs text-gray-400">
            {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {job.ocr_confidence != null && ` · OCR: ${(job.ocr_confidence * 100).toFixed(0)}%`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!status.done && (
          <svg className="w-3 h-3 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
        {job.failure_reason && (
          <span className="text-xs text-red-400 max-w-xs truncate" title={job.failure_reason}>
            {job.failure_reason}
          </span>
        )}
      </div>
    </div>
  )
}

export default function UploadPdfPage() {
  const { data: sources } = useSources()
  const upload = useUploadPdf()

  const [dragging, setDragging] = useState(false)
  const [sourceId, setSourceId] = useState<string>('')
  const [jobs, setJobs] = useState<IngestionJob[]>([])
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Poll job status every 3s for any non-terminal jobs
  const hasRunning = jobs.some(j => !STATUS_LABELS[j.job_status]?.done)
  if (hasRunning) {
    setTimeout(async () => {
      const updated = await Promise.all(
        jobs.map(j =>
          STATUS_LABELS[j.job_status]?.done
            ? Promise.resolve(j)
            : apiClient.get<IngestionJob>(`/pipeline/jobs/${j.id}`).then(r => r.data).catch(() => j)
        )
      )
      setJobs(updated)
    }, 3000)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError('')

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError(`"${file.name}" is not a PDF. Only PDF files are accepted.`)
        continue
      }
      try {
        const job = await upload.mutateAsync({ file, sourceId: sourceId || undefined })
        setJobs(prev => [job, ...prev])
      } catch (err: any) {
        setError(err.response?.data?.detail ?? 'Upload failed.')
      }
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Upload PDF</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Upload a grant notice PDF. OCR and AI extraction run automatically.
          </p>
        </div>
      </div>

      {/* Source selector */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-4">
        <label className="block text-xs text-gray-400 mb-1.5">Source agency (optional)</label>
        <select
          value={sourceId}
          onChange={e => setSourceId(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-emerald-400"
        >
          <option value="">— Select source —</option>
          {sources?.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
        </svg>
        <p className="text-sm text-gray-500 mb-1">
          {dragging ? 'Drop PDFs here' : 'Drag and drop PDF files here'}
        </p>
        <p className="text-xs text-gray-400">or click to browse · max 20MB per file</p>
        {upload.isLoading && (
          <p className="text-xs text-blue-500 mt-3 animate-pulse">Uploading...</p>
        )}
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Pipeline steps explanation */}
      <div className="mt-4 bg-gray-50 rounded-xl p-4">
        <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium mb-3">What happens after upload</p>
        <div className="flex items-start gap-0">
          {[
            { step: '1', label: 'OCR', desc: 'Google Vision extracts Bengali + English text' },
            { step: '2', label: 'AI extract', desc: 'Claude reads text → structured fields + confidence' },
            { step: '3', label: 'Review', desc: 'Grant appears in your review queue' },
            { step: '4', label: 'Publish', desc: 'Approve → alerts sent to matched researchers' },
          ].map((s, i) => (
            <div key={s.step} className="flex-1 flex items-start gap-1">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-medium flex items-center justify-center flex-shrink-0">{s.step}</div>
                {i < 3 && <div className="w-px flex-1 bg-gray-200 mt-1 h-4" />}
              </div>
              <div className="ml-1.5 pb-4">
                <p className="text-xs font-medium text-gray-700">{s.label}</p>
                <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job status list */}
      {jobs.length > 0 && (
        <div className="mt-5 bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-2">
            This session — {jobs.length} upload{jobs.length > 1 ? 's' : ''}
          </p>
          {jobs.map(job => <JobStatusRow key={job.id} job={job} />)}
        </div>
      )}
    </div>
  )
}
