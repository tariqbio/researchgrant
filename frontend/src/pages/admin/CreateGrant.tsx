import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../../api/client'

const RESEARCH_AREAS = [
  'agriculture','ai_ml','architecture','biotechnology','chemistry',
  'chemical_engineering','civil_engineering','climate_environment',
  'crop_science','data_science','economics','education',
  'electrical_engineering','engineering','fisheries','food_technology',
  'humanities','ict','law','life_sciences','mathematics','mechanical_engineering',
  'medicine','pharmacy','physics','public_health','renewable_energy',
  'social_sciences','software_engineering','soil_science','urban_planning',
  'veterinary','water_resources',
]

const ELIGIBILITY = [
  { value: 'faculty', label: 'Faculty / Lecturer' },
  { value: 'phd_student', label: 'PhD Student' },
  { value: 'postdoc', label: 'Postdoc' },
  { value: 'scientist', label: 'Scientist / Researcher' },
  { value: 'masters_student', label: "Master's Student" },
  { value: 'institution', label: 'Institution / University' },
  { value: 'ngo', label: 'NGO / Organization' },
  { value: 'all', label: 'All eligible' },
]

const AGENCY_TYPES = [
  { value: 'government', label: 'Government' },
  { value: 'university', label: 'University' },
  { value: 'ngo', label: 'NGO / International' },
  { value: 'private', label: 'Private / Industry' },
]

function slugToLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default function AdminCreateGrantPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    title_en: '',
    title_bn: '',
    issuing_agency: '',
    agency_type: 'government',
    deadline: '',
    funding_min: '',
    funding_max: '',
    description_en: '',
    description_bn: '',
    source_url: '',
    research_areas: [] as string[],
    eligibility_types: [] as string[],
  })

  const [error, setError] = useState('')

  const mutation = useMutation(
    async () => {
      const payload = {
        ...form,
        funding_min: form.funding_min ? Number(form.funding_min) : null,
        funding_max: form.funding_max ? Number(form.funding_max) : null,
        deadline: form.deadline || null,
        title_bn: form.title_bn || null,
        description_bn: form.description_bn || null,
        source_url: form.source_url || null,
      }
      const res = await apiClient.post('/grants/admin/create', payload)
      return res.data
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('admin-queue')
        navigate(`/grants/${data.id}`)
      },
      onError: (err: any) => {
        setError(err.response?.data?.detail || 'Something went wrong')
      },
    }
  )

  const set = (field: string, value: any) =>
    setForm(f => ({ ...f, [field]: value }))

  const toggleArr = (field: 'research_areas' | 'eligibility_types', val: string) =>
    set(field, form[field].includes(val)
      ? form[field].filter((v: string) => v !== val)
      : [...form[field], val])

  const valid = form.title_en.trim() && form.issuing_agency.trim()

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Add Grant Manually</h1>
        <p className="text-gray-500 text-sm mt-1">
          For text-based notices that don't need PDF extraction. Published immediately.
        </p>
      </div>

      <div className="space-y-6">

        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Grant Information</h2>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title (English) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title_en}
                onChange={e => set('title_en', e.target.value)}
                placeholder="e.g. UGC Research Grant 2026–27"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title (Bengali) <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                value={form.title_bn}
                onChange={e => set('title_bn', e.target.value)}
                placeholder="বাংলায় শিরোনাম"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                dir="auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Issuing Agency <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.issuing_agency}
                  onChange={e => set('issuing_agency', e.target.value)}
                  placeholder="e.g. University Grants Commission"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Type</label>
                <select
                  value={form.agency_type}
                  onChange={e => set('agency_type', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {AGENCY_TYPES.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => set('deadline', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Funding (BDT)</label>
                <input
                  type="number"
                  value={form.funding_min}
                  onChange={e => set('funding_min', e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Funding (BDT)</label>
                <input
                  type="number"
                  value={form.funding_max}
                  onChange={e => set('funding_max', e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Source URL <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={form.source_url}
                onChange={e => set('source_url', e.target.value)}
                placeholder="https://ugc.gov.bd/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Description</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">English</label>
              <textarea
                value={form.description_en}
                onChange={e => set('description_en', e.target.value)}
                rows={5}
                placeholder="Grant objectives, scope, application instructions..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bengali <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.description_bn}
                onChange={e => set('description_bn', e.target.value)}
                rows={4}
                placeholder="বাংলায় বিবরণ..."
                dir="auto"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Research areas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Research Areas</h2>
          <p className="text-xs text-gray-400 mb-4">
            These drive the alert matching engine — select all that apply.
          </p>
          <div className="flex flex-wrap gap-2">
            {RESEARCH_AREAS.map(area => (
              <button
                key={area}
                onClick={() => toggleArr('research_areas', area)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.research_areas.includes(area)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                }`}
              >
                {slugToLabel(area)}
              </button>
            ))}
          </div>
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Eligibility</h2>
          <div className="grid grid-cols-2 gap-2">
            {ELIGIBILITY.map(e => (
              <label key={e.value} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.eligibility_types.includes(e.value)}
                  onChange={() => toggleArr('eligibility_types', e.value)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{e.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pb-8">
          <button
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!valid || mutation.isLoading}
            className="px-5 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isLoading ? 'Publishing…' : 'Publish Grant →'}
          </button>
        </div>
      </div>
    </div>
  )
}
