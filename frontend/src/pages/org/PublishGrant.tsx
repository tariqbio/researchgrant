import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { orgApi } from '../../api'
import { RESEARCH_AREAS, ELIGIBILITY_TYPES } from '../../types'

export default function PublishGrant() {
  const navigate = useNavigate()
  const [form, setForm] = useState<any>({ currency:'BDT', eligibility_types:[], research_areas:[], requires_proposal_pdf:true, requires_cv:true, requires_budget_breakdown:true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k:string,v:any) => setForm((f:any)=>({...f,[k]:v}))
  const toggle = (k:string,v:string) => set(k, form[k].includes(v)?form[k].filter((x:string)=>x!==v):[...form[k],v])

  const submit = async () => {
    if (!form.title_en||!form.deadline){setError('Title and deadline required');return}
    setLoading(true);setError('')
    try { await orgApi.publishGrant(form); navigate('/org/dashboard') }
    catch(e:any){setError(e.response?.data?.detail||'Failed')}
    finally{setLoading(false)}
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Publish Grant Call</h1>
      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4">
        {[['Grant Title (English)*','title_en'],['Grant Title (Bengali)','title_bn']].map(([l,k])=>(
          <div key={k}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
          <input value={form[k]||''} onChange={e=>set(k,e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/></div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Deadline *</label>
          <input type="date" value={form.deadline||''} onChange={e=>set('deadline',e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (BDT)</label>
          <input type="number" value={form.max_budget_requested||''} onChange={e=>set('max_budget_requested',e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea rows={4} value={form.description_en||''} onChange={e=>set('description_en',e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"/></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Research Areas</label>
        <div className="flex flex-wrap gap-2">{Object.entries(RESEARCH_AREAS).map(([k,l])=>(
          <button key={k} type="button" onClick={()=>toggle('research_areas',k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${form.research_areas.includes(k)?'bg-green-600 text-white border-green-600':'border-gray-300 text-gray-600 hover:border-green-400'}`}>{l}</button>
        ))}</div></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-2">Eligibility</label>
        <div className="flex flex-wrap gap-2">{Object.entries(ELIGIBILITY_TYPES).map(([k,l])=>(
          <button key={k} type="button" onClick={()=>toggle('eligibility_types',k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${form.eligibility_types.includes(k)?'bg-blue-600 text-white border-blue-600':'border-gray-300 text-gray-600 hover:border-blue-400'}`}>{l}</button>
        ))}</div></div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={submit} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
          {loading?'Publishing…':'Publish Grant Call'}
        </button>
      </div>
    </div>
  )
}
