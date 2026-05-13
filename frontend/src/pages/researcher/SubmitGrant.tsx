import { useState } from 'react'
import { useMutation } from 'react-query'
import { apiClient } from '../../api/client'

export default function SubmitGrantPage() {
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mutation = useMutation(
    () => apiClient.post('/pipeline/submit', { source_url: url, notes }),
    {
      onSuccess: () => {
        setSubmitted(true)
        setUrl('')
        setNotes('')
      },
    }
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Submit a Grant</h1>
        <p className="text-gray-500 text-sm mt-2">
          Found a grant that's not listed yet? Submit the URL and our team will verify and add it within 24 hours.
        </p>
      </div>

      {submitted ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <svg className="w-10 h-10 text-green-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-green-800">Submission received!</h3>
          <p className="text-green-600 text-sm mt-1">Our admin team will review and publish it shortly.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-4 text-sm text-green-700 underline"
          >
            Submit another
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Grant URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://ugc.gov.bd/grants/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Paste the direct link to the grant notice or announcement</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any extra context — deadline, agency name, research area..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                Something went wrong. Please try again.
              </p>
            )}

            <button
              onClick={() => mutation.mutate()}
              disabled={!url.trim() || mutation.isLoading}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {mutation.isLoading ? 'Submitting...' : 'Submit Grant →'}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What happens next?</h4>
            <div className="space-y-2">
              {[
                ['1', 'Our AI extracts structured data from the page'],
                ['2', 'Admin reviews and confirms accuracy'],
                ['3', 'Grant is published and researchers are notified'],
              ].map(([step, text]) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center">{step}</span>
                  <span className="text-sm text-gray-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
