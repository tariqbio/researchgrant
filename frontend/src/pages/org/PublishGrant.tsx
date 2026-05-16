import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orgApi } from '../../api';
import { RESEARCH_AREAS } from '../../types';

export default function PublishGrant() {
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({ currency: 'BDT', eligibility_types: [], research_areas: [], requires_proposal_pdf: true, requires_cv: true, requires_budget_breakdown: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleArr = (k: string, v: string) => set(k, form[k].includes(v) ? form[k].filter((x:string) => x !== v) : [...form[k], v]);

  const submit = async () => {
    if (!form.title_en || !form.deadline) { setError('Title and deadline are required'); return; }
    setLoading(true); setError('');
    try {
      await orgApi.publishGrant(form);
      navigate('/org/dashboard');
    } catch(e: any) { setError(e.response?.data?.detail || 'Failed to publish'); }
    finally { setLoading(false); }
  };

  const inp = (label: string, key: string, type='text', placeholder='') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={form[key]||''} onChange={e=>set(key,e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
    </div>
  );

  const ELIGIBILITY = ['faculty','phd_student','masters_student','undergraduate_student','postdoc','scientist','researcher','ngo_worker','private_sector'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => navigate('/org/dashboard')} className="text-sm text-gray-500 hover:text-gray-700 mb-3 block">← Back to dashboard</button>
          <h1 className="text-2xl font-bold text-gray-900">Publish Grant Call</h1>
          <p className="text-gray-500 text-sm">Your grant will go live immediately after submission.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">
          {inp('Grant Title (English) *', 'title_en', 'text', 'e.g. BARC Agricultural Research Grant 2026')}
          {inp('Grant Title (Bengali)', 'title_bn', 'text', 'বাংলায় শিরোনাম')}
          <div className="grid grid-cols-2 gap-4">
            {inp('Application Deadline *', 'deadline', 'date')}
            {inp('Max Budget per Application (BDT)', 'max_budget_requested', 'number', '0')}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {inp('Min Funding (BDT)', 'funding_min', 'number')}
            {inp('Max Funding (BDT)', 'funding_max', 'number')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (English)</label>
            <textarea rows={4} value={form.description_en||''} onChange={e=>set('description_en',e.target.value)} placeholder="Describe the grant, objectives, and scope..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Application Instructions</label>
            <textarea rows={3} value={form.application_instructions||''} onChange={e=>set('application_instructions',e.target.value)} placeholder="Special requirements, formatting instructions..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility</label>
            <div className="flex flex-wrap gap-2">
              {ELIGIBILITY.map(e => (
                <button key={e} onClick={() => toggleArr('eligibility_types', e)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${form.eligibility_types.includes(e) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:border-blue-400'}`}>
                  {e.replace(/_/g,' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Research Areas</label>
            <div className="flex flex-wrap gap-2">
              {RESEARCH_AREAS.map(a => (
                <button key={a.slug} onClick={() => toggleArr('research_areas', a.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${form.research_areas.includes(a.slug) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Required Documents from Applicants</label>
            <div className="space-y-2">
              {[['requires_proposal_pdf','Research Proposal (PDF)'],['requires_cv','Curriculum Vitae (PDF)'],['requires_budget_breakdown','Detailed Budget Breakdown']].map(([k,l])=>(
                <label key={k} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form[k]} onChange={e=>set(k,e.target.checked)} className="rounded"/>
                  <span className="text-sm text-gray-700">{l}</span>
                </label>
              ))}
            </div>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
            {loading ? 'Publishing…' : 'Publish Grant Call'}
          </button>
        </div>
      </div>
    </div>
  );
}
