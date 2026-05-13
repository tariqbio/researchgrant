import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { apiClient } from '../../api/client'
import GrantCard from '../../components/grants/GrantCard'

const RESEARCH_AREAS = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'biotechnology', label: 'Biotechnology' },
  { value: 'ict', label: 'ICT / Software' },
  { value: 'ai_ml', label: 'AI & Machine Learning' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'climate_environment', label: 'Climate & Environment' },
  { value: 'public_health', label: 'Public Health' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'education', label: 'Education' },
  { value: 'social_sciences', label: 'Social Sciences' },
  { value: 'economics', label: 'Economics' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'physics', label: 'Physics' },
]

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    searchParams.get('areas') ? searchParams.get('areas')!.split(',') : []
  )
  const [deadlineFilter, setDeadlineFilter] = useState(searchParams.get('deadline') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'deadline')
  const [page, setPage] = useState(1)

  // Sync filters into URL
  useEffect(() => {
    const params: Record<string, string> = {}
    if (query) params.q = query
    if (selectedAreas.length) params.areas = selectedAreas.join(',')
    if (deadlineFilter) params.deadline = deadlineFilter
    if (sortBy !== 'deadline') params.sort = sortBy
    setSearchParams(params, { replace: true })
    setPage(1)
  }, [query, selectedAreas, deadlineFilter, sortBy])

  const { data, isLoading } = useQuery(
    ['grants', query, selectedAreas, deadlineFilter, sortBy, page],
    async () => {
      const params = new URLSearchParams()
      if (query) params.set('query', query)
      if (selectedAreas.length) params.set('research_areas', selectedAreas.join(','))
      if (deadlineFilter) params.set('deadline_within_days', deadlineFilter)
      params.set('sort_by', sortBy)
      params.set('page', String(page))
      params.set('page_size', '15')
      const res = await apiClient.get(`/grants/public?${params}`)
      return res.data
    },
    { keepPreviousData: true }
  )

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const totalPages = data ? Math.ceil(data.total / 15) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Grants</h1>
        <p className="text-gray-500 text-sm mt-1">
          {data ? `${data.total} grants found` : 'Loading...'}
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Filters</h3>

            {/* Deadline filter */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Deadline</label>
              <select
                value={deadlineFilter}
                onChange={e => setDeadlineFilter(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any time</option>
                <option value="7">Within 7 days</option>
                <option value="30">Within 30 days</option>
                <option value="90">Within 90 days</option>
              </select>
            </div>

            {/* Research areas */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Research Area</label>
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {RESEARCH_AREAS.map(area => (
                  <label key={area.value} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedAreas.includes(area.value)}
                      onChange={() => toggleArea(area.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {(selectedAreas.length > 0 || deadlineFilter || query) && (
              <button
                onClick={() => { setSelectedAreas([]); setDeadlineFilter(''); setQuery('') }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search + sort bar */}
          <div className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search grants by keyword, agency..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="deadline">Deadline (soonest)</option>
              <option value="newest">Newest first</option>
              <option value="funding_max">Highest funding</option>
            </select>
          </div>

          {/* Selected area chips */}
          {selectedAreas.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedAreas.map(area => (
                <span
                  key={area}
                  onClick={() => toggleArea(area)}
                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer hover:bg-blue-100"
                >
                  {RESEARCH_AREAS.find(r => r.value === area)?.label || area}
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              ))}
            </div>
          )}

          {/* Grant cards */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-36 animate-pulse" />
              ))}
            </div>
          ) : data?.items?.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium text-gray-500">No grants found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.items?.map((grant: any) => (
                <GrantCard key={grant.id} grant={grant} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
