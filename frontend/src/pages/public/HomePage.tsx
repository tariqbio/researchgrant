import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { grantsApi as grantApi } from '../../api'
import { useQuery } from 'react-query'
import { formatDeadline, deadlineDaysLeft, deadlineUrgency, urgencyClasses, formatFunding } from '../../utils'
import { apiClient } from '../../api/client'
import Topbar from '../../components/layout/Topbar'

const FEATURED_AGENCIES = [
  { abbr: 'UGC',   name: 'University Grants Commission' },
  { abbr: 'BARC',  name: 'Bangladesh Agricultural Research Council' },
  { abbr: 'BCSIR', name: 'Council of Scientific & Industrial Research' },
  { abbr: 'MoST',  name: 'Ministry of Science & Technology' },
  { abbr: 'BRRI',  name: 'Bangladesh Rice Research Institute' },
  { abbr: 'BIAM',  name: 'Bangladesh Institute of Admin & Management' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'We collect', body: 'Our team monitors 20+ government websites, newspapers, and gazette notifications. Scanned PDFs are extracted with OCR and AI.', color: 'bg-purple-50 text-purple-700' },
  { step: '02', title: 'You search', body: 'Filter by research area, eligibility, deadline, and funding. Every grant links back to the original source document.', color: 'bg-blue-50 text-blue-700' },
  { step: '03', title: 'We alert you', body: 'Set your research interests once. Get an email the moment a matching grant is published — before the deadline slips past.', color: 'bg-emerald-50 text-emerald-700' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const { data: latestGrants } = useQuery(
    'homepage-grants',
    () => grantApi.listPublic({ sort_by: 'deadline', page_size: 6 }),
    { staleTime: 300_000 }
  )

  // Live stats from the API — no more hardcoded numbers
  const { data: stats } = useQuery(
    'platform-stats',
    async () => {
      const res = await apiClient.get('/grants/stats/summary')
      return res.data
    },
    { staleTime: 60_000 }
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/grants/public?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Topbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100 px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {stats ? `${stats.total_grants} grants live` : 'Loading…'} · Updated daily
          </div>

          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight leading-tight mb-4">
            Bangladesh research grants,<br />
            <span className="text-emerald-600">all in one place</span>
          </h1>

          <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-lg mx-auto">
            Government grant notices are scattered across dozens of websites and buried in scanned PDFs.
            GrantBD finds them, extracts them, and alerts you when one matches your research.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto mb-4">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-transparent transition-all">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Biotechnology, UGC, কৃষি গবেষণা..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-sm outline-none placeholder-gray-400"
                dir="auto"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <button type="submit" className="bg-emerald-600 text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-emerald-700 transition-colors flex-shrink-0">
              Search
            </button>
          </form>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-medium">Sign up for alerts →</Link>
            <span>·</span>
            <Link to="/grants/public" className="hover:text-gray-600">Browse all grants</Link>
          </div>
        </div>
      </section>

      {/* Live stats strip */}
      <section className="border-b border-gray-100 px-4 py-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-0 divide-x divide-gray-100 text-center">
          {[
            { value: stats?.total_grants  ?? '—', label: 'Active grants' },
            { value: '20+',                        label: 'Agencies monitored' },
            { value: stats?.total_users   ?? '—', label: 'Researchers registered' },
          ].map(stat => (
            <div key={stat.label} className="px-6">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest grants */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Latest grants</h2>
          <Link to="/grants/public" className="text-sm text-emerald-600 hover:text-emerald-700">Browse all →</Link>
        </div>
        {(latestGrants?.data?.items ?? []).length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl text-gray-400">
            <p className="font-medium">No grants published yet</p>
            <p className="text-sm mt-1">Check back soon — we're adding grants daily.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(latestGrants?.data?.items ?? []).map((grant: any) => {
              const days = deadlineDaysLeft(grant.deadline)
              const urgency = deadlineUrgency(days)
              const isExpired = days !== null && days < 0
              return (
                <Link
                  key={grant.id}
                  to={`/grants/${grant.id}`}
                  className={`bg-white border rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all group block ${isExpired ? 'opacity-50' : 'border-gray-100'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {grant.title_en}
                    </p>
                    {days !== null && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        isExpired ? 'bg-gray-100 text-gray-400' : urgencyClasses[urgency]
                      }`}>
                        {isExpired ? 'Expired' : days === 0 ? 'Today' : `${days}d`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{grant.issuing_agency}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatFunding(grant.funding_min, grant.funding_max, grant.currency)}
                    </span>
                    {grant.deadline && (
                      <span className="text-xs text-gray-400">Due {formatDeadline(grant.deadline)}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100 px-4 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">How GrantBD works</h2>
          <p className="text-sm text-gray-400 text-center mb-10">
            Built for Bangladeshi researchers who are tired of missing deadlines they never knew existed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map(item => (
              <div key={item.step} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-3 ${item.color}`}>
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agencies */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <h2 className="text-sm font-medium text-gray-400 text-center uppercase tracking-wide mb-8">
          Agencies we track
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURED_AGENCIES.map(agency => (
            <div key={agency.abbr} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {agency.abbr}
              </div>
              <p className="text-xs text-gray-600 leading-snug">{agency.name}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">+ 14 more agencies, newspapers, and gazette sources</p>
      </section>

      {/* CTA */}
      <section className="bg-emerald-600 px-4 py-14 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">
            Never miss a grant deadline again
          </h2>
          <p className="text-emerald-100 text-sm mb-7 leading-relaxed">
            Set your research interests once. We watch 20+ sources every day and
            email you the moment a matching grant is published.
          </p>
          <Link to="/register" className="inline-block bg-white text-emerald-700 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors">
            Create free account →
          </Link>
          <p className="text-emerald-200 text-xs mt-4">Free · No spam · Unsubscribe any time</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-medium text-gray-900">
            Grant<span className="text-emerald-600">BD</span>
          </span>
          <div className="flex items-center gap-5 text-xs text-gray-400 flex-wrap justify-center">
            <Link to="/grants/public"  className="hover:text-gray-600">Browse grants</Link>
            <Link to="/register"       className="hover:text-gray-600">Sign up</Link>
            <Link to="/submit-grant"   className="hover:text-gray-600">Submit a grant</Link>
            {/* ↑ was /pipeline/submit — fixed */}
            <span>© 2026 GrantBD</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
