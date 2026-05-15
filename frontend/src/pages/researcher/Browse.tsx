import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { apiClient } from '../../api/client'
import GrantCard from '../../components/grants/GrantCard'

const RESEARCH_AREAS = [
  { value: 'agriculture',           label: 'Agriculture' },
  { value: 'ai_ml',                 label: 'AI & Machine Learning' },
  { value: 'biotechnology',         label: 'Biotechnology' },
  { value: 'chemistry',             label: 'Chemistry' },
  { value: 'climate_environment',   label: 'Climate & Environment' },
  { value: 'data_science',          label: 'Data Science' },
  { value: 'economics',             label: 'Economics' },
  { value: 'education',             label: 'Education' },
  { value: 'engineering',           label: 'Engineering' },
  { value: 'ict',                   label: 'ICT / Software' },
  { value: 'life_sciences',         label: 'Life Sciences' },
  { value: 'mathematics',           label: 'Mathematics' },
  { value: 'medicine',              label: 'Medicine' },
  { value: 'physics',               label: 'Physics' },
  { value: 'public_health',         label: 'Public Health' },
  { value: 'renewable_energy',      label: 'Renewable Energy' },
  { value: 'social_sciences',       label: 'Social Sciences' },
  { value: 'water_resources',       label: 'Water Resources' },
]

function FilterPanel({
  selectedAreas, deadlineFilter, onToggleArea, onDeadlineChange, onClear, hasFilters,
}: {
  selectedAreas: string[]; deadlineFilter: string
  onToggleArea: (a: string) => void; onDeadlineChange: (v: string) => void
  onClear: () => void; hasFilters: boolean
}) {
  return (
    <>
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Deadline
        </label>
        <select
          value={deadlineFilter}
          onChange={e => onDeadlineChange(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
        >
          <option value="">Any time</option>
          <option value="7">Within 7 days</option>
          <option value="30">Within 30 days</option>
          <option value="90">Within 90 days</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Research Area
        </label>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {RESEARCH_AREAS.map(area => (
            <label key={area.value} className="flex items-center gap-2 cursor-pointer group py-0.5">
              <input
                type="checkbox"
                checked={selectedAreas.includes(area.value)}
                onChange={() => onToggleArea(area.value)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                {area.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="text-xs text-red-500 hover:text-red-700 font-medium"
        >
          Clear all filters
        </button>
      )}
    </>
  )
}

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery]               = useState(searchParams.get('q') || '')
  const [selectedAreas, setSelectedAreas] = useState<string[]>(
    searchParams.get('areas') ? searchParams.get('areas')!.split(',') : []
  )
  const [deadlineFilter, setDeadlineFilter] = useState(searchParams.get('deadline') || '')
  const [sortBy, setSortBy]   = useState(searchParams.get('sort') || 'deadline')
  const [page, setPage]       = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const params: Record<string, string> = {}
    if (query)              params.q        = query
    if (selectedAreas.length) params.areas  = selectedAreas.join(',')
    if (deadlineFilter)     params.deadline = deadlineFilter
    if (sortBy !== 'deadline') params.sort  = sortBy
    setSearchParams(params, { replace: true })
    setPage(1)
  }, [query, selectedAreas, deadlineFilter, sortBy])

  const { data, isLoading, isPreviousData } = useQuery(
    ['grants', query, selectedAreas, deadlineFilter, sortBy, page],
    async () => {
      const p = new URLSearchParams()
      if (query)             p.set('query', query)
      if (selectedAreas.length) p.set('research_areas', selectedAreas.join(','))
      if (deadlineFilter)    p.set('deadline_within_days', deadlineFilter)
      p.set('sort_by', sortBy); p.set('page', String(page)); p.set('page_size', '15')
      const res = await apiClient.get(`/grants/public?${p}`)
      return res.data
    },
    { keepPreviousData: true }
  )

  const toggleArea = (area: string) =>
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )

  const clearAll = () => { setSelectedAreas([]); setDeadlineFilter(''); setQuery('') }
  const hasFilters = selectedAreas.length > 0 || !!deadlineFilter || !!query
  const totalPages = data ? Math.ceil(data.total / 15) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Browse Grants</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {data ? `${data.total} grants` : 'Loading…'}
          </p>
        </div>
        {/* Mobile filter button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden flex items-center gap-1.5 text-sm border border-gray-200
                     rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 4h18M6 8h12M10 12h4"/>
          </svg>
          Filters
          {hasFilters && (
            <span className="bg-emerald-600 text-white text-[10px] rounded-full w-4 h-4
                             flex items-center justify-center font-bold">
              {selectedAreas.length + (deadlineFilter ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <FilterPanel
              selectedAreas={selectedAreas} deadlineFilter={deadlineFilter}
              onToggleArea={toggleArea} onDeadlineChange={setDeadlineFilter}
              onClear={clearAll} hasFilters={hasFilters}
            />
            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-5 w-full bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold"
            >
              Show results
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-4 sticky top-16">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Filters</h3>
            <FilterPanel
              selectedAreas={selectedAreas} deadlineFilter={deadlineFilter}
              onToggleArea={toggleArea} onDeadlineChange={setDeadlineFilter}
              onClear={clearAll} hasFilters={hasFilters}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Search + sort */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Keyword, agency, বাংলায় খুঁজুন..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                dir="auto"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white
                         focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="deadline">Deadline ↑</option>
              <option value="newest">Newest first</option>
              <option value="funding_max">Highest funding</option>
            </select>
          </div>

          {/* Active filter chips */}
          {selectedAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedAreas.map(area => (
                <button
                  key={area}
                  onClick={() => toggleArea(area)}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700
                             text-xs font-medium px-2.5 py-1 rounded-full hover:bg-emerald-100"
                >
                  {RESEARCH_AREAS.find(r => r.value === area)?.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              ))}
              <button onClick={clearAll} className="text-xs text-gray-400 hover:text-red-500 px-1">
                Clear all
              </button>
            </div>
          )}

          {/* Results */}
          <div className={`space-y-3 transition-opacity ${isPreviousData ? 'opacity-50' : ''}`}>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 h-32 animate-pulse" />
              ))
            ) : data?.items?.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="font-medium text-gray-500">No grants found</p>
                <p className="text-sm mt-1">Try clearing some filters</p>
                {hasFilters && (
                  <button onClick={clearAll} className="mt-3 text-sm text-emerald-600 hover:text-emerald-700">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              data?.items?.map((grant: any) => (
                <GrantCard key={grant.id} grant={grant} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200
                           disabled:opacity-40 hover:bg-gray-50"
              >← Prev</button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200
                           disabled:opacity-40 hover:bg-gray-50"
              >Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
