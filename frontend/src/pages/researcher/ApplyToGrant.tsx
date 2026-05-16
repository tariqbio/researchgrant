import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { grantsApi, applicationsApi } from '../../api';
import { RESEARCH_AREAS } from '../../types';

type Step = 'basics' | 'team' | 'budget' | 'documents' | 'review';
const STEPS: Step[] = ['basics', 'team', 'budget', 'documents', 'review'];
const STEP_LABELS: Record<Step, string> = {
  basics: 'Basic Info',
  team: 'Team',
  budget: 'Budget',
  documents: 'Documents',
  review: 'Review & Submit',
};

export default function ApplyToGrant() {
  const { grantId } = useParams<{ grantId: string }>();
  const navigate = useNavigate();
  const [grant, setGrant] = useState<any>(null);
  const [step, setStep] = useState<Step>('basics');
  const [appId, setAppId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    research_areas: [],
    co_investigators: [],
    milestones: [],
    budget_breakdown: { personnel: 0, equipment: 0, travel: 0, consumables: 0, overhead: 0, publication: 0, other: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (grantId) grantsApi.get(grantId).then(r => setGrant(r.data)).catch(() => {});
  }, [grantId]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleArea = (slug: string) =>
    set('research_areas', form.research_areas.includes(slug)
      ? form.research_areas.filter((x: string) => x !== slug)
      : [...form.research_areas, slug]);

  const inp = (label: string, key: string, type = 'text', placeholder = '', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea rows={4} value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      ) : (
        <input type={type} value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      )}
    </div>
  );

  const saveAndNext = async (nextStep: Step) => {
    setError(''); setLoading(true);
    try {
      if (!appId) {
        if (!form.project_title || !form.abstract) {
          setError('Project title and abstract are required'); setLoading(false); return;
        }
        const r = await applicationsApi.create({ grant_id: grantId, ...form });
        setAppId(r.data.id);
      } else {
        await applicationsApi.update(appId, form);
      }
      setStep(nextStep);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error saving');
    } finally { setLoading(false); }
  };

  const submitApplication = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      await applicationsApi.update(appId, form);
      await applicationsApi.submit(appId);
      navigate('/applications');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Submission failed');
    } finally { setLoading(false); }
  };

  const totalBudget = Object.values(form.budget_breakdown || {}).reduce((s: any, v: any) => s + Number(v || 0), 0) as number;

  const addCoI = () => set('co_investigators', [...(form.co_investigators || []), { name: '', institution: '', designation: '', email: '' }]);
  const updateCoI = (i: number, k: string, v: string) => {
    const arr = [...(form.co_investigators || [])];
    arr[i] = { ...arr[i], [k]: v };
    set('co_investigators', arr);
  };
  const removeCoI = (i: number) => set('co_investigators', form.co_investigators.filter((_: any, idx: number) => idx !== i));

  const stepIdx = STEPS.indexOf(step);

  if (!grant) return <div className="p-8 text-gray-400 text-center">Loading grant…</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to={`/grants/${grantId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">← Back to grant</Link>

        {/* Grant Info Banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-green-600 font-medium mb-0.5">Applying to</p>
          <h2 className="font-semibold text-gray-900">{grant.title_en}</h2>
          <p className="text-xs text-gray-500 mt-1">{grant.issuing_agency} · Deadline: {grant.deadline || 'Not specified'}</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 h-2 rounded-full transition-all ${i <= stepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
              {i === STEPS.length - 1 && null}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-6 -mt-4">
          {STEPS.map(s => (
            <span key={s} className={step === s ? 'text-green-600 font-semibold' : ''}>{STEP_LABELS[s]}</span>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">{STEP_LABELS[step]}</h2>

          {/* STEP: BASICS */}
          {step === 'basics' && (
            <div className="space-y-4">
              {inp('Project Title', 'project_title', 'text', 'Enter a clear, descriptive title', true)}
              {inp('Abstract (max 300 words)', 'abstract', 'textarea', 'Summarize your research, objectives, and expected impact', true)}
              {inp('Objectives', 'objectives', 'textarea', 'List your specific research objectives')}
              {inp('Methodology', 'methodology', 'textarea', 'Describe your research methodology and approach')}
              {inp('Expected Outcomes', 'expected_outcomes', 'textarea', 'What will this research produce or achieve?')}
              <div className="grid grid-cols-2 gap-4">
                {inp('Project Start Date', 'project_start_date', 'date')}
                {inp('Project End Date', 'project_end_date', 'date')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Research Areas</label>
                <div className="flex flex-wrap gap-2">
                  {RESEARCH_AREAS.map(a => (
                    <button key={a.slug} type="button" onClick={() => toggleArea(a.slug)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${form.research_areas.includes(a.slug) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-600 hover:border-green-400'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP: TEAM */}
          {step === 'team' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Add co-investigators and team members who will contribute to this project.</p>
              {(form.co_investigators || []).map((coi: any, i: number) => (
                <div key={i} className="border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Co-Investigator #{i + 1}</span>
                    <button onClick={() => removeCoI(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[['Full Name', 'name'], ['Institution', 'institution'], ['Designation', 'designation'], ['Email', 'email']].map(([l, k]) => (
                      <div key={k}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                        <input type="text" value={coi[k] || ''} onChange={e => updateCoI(i, k, e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addCoI} className="w-full border-2 border-dashed border-gray-300 hover:border-green-400 text-gray-500 hover:text-green-600 py-3 rounded-xl text-sm transition">
                + Add Co-Investigator
              </button>
            </div>
          )}

          {/* STEP: BUDGET */}
          {step === 'budget' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {grant.max_budget_requested
                  ? `Maximum allowed: ৳${Number(grant.max_budget_requested).toLocaleString()}`
                  : 'Break down your budget by category.'}
              </p>
              <div className="space-y-3">
                {Object.entries(form.budget_breakdown || {}).map(([cat, val]) => (
                  <div key={cat} className="flex items-center gap-4">
                    <label className="w-36 text-sm text-gray-700 capitalize">{cat}</label>
                    <input type="number" min="0" value={(val as number) || 0}
                      onChange={e => set('budget_breakdown', { ...form.budget_breakdown, [cat]: Number(e.target.value) })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <span className="text-xs text-gray-400 w-10">BDT</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-xl p-4 mt-2">
                <span className="font-semibold text-gray-900">Total Requested</span>
                <span className="font-bold text-green-700 text-lg">৳{totalBudget.toLocaleString()}</span>
              </div>
              {grant.max_budget_requested && totalBudget > Number(grant.max_budget_requested) && (
                <p className="text-red-600 text-sm">⚠ Total exceeds the maximum allowed budget of ৳{Number(grant.max_budget_requested).toLocaleString()}</p>
              )}
            </div>
          )}

          {/* STEP: DOCUMENTS */}
          {step === 'documents' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">Upload required documents. You can also upload after saving a draft.</p>
              {grant.requires_proposal_pdf && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">Research Proposal (PDF) <span className="text-red-500">*</span></p>
                  <p className="text-xs text-gray-400 mb-3">Max 10MB · PDF only</p>
                  {appId ? (
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf" className="hidden" onChange={async e => {
                        if (e.target.files?.[0] && appId) {
                          await applicationsApi.uploadProposal(appId, e.target.files[0]);
                          setForm((f: any) => ({ ...f, _proposalUploaded: true }));
                        }
                      }} />
                      <span className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg inline-block cursor-pointer">
                        {form._proposalUploaded ? '✓ Uploaded' : 'Choose File'}
                      </span>
                    </label>
                  ) : <p className="text-xs text-amber-600">Save your application first to enable uploads</p>}
                </div>
              )}
              {grant.requires_cv && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <p className="text-sm font-medium text-gray-700 mb-1">Curriculum Vitae (PDF) <span className="text-red-500">*</span></p>
                  <p className="text-xs text-gray-400 mb-3">Max 5MB · PDF only</p>
                  {appId ? (
                    <label className="cursor-pointer">
                      <input type="file" accept=".pdf" className="hidden" onChange={async e => {
                        if (e.target.files?.[0] && appId) {
                          await applicationsApi.uploadCV(appId, e.target.files[0]);
                          setForm((f: any) => ({ ...f, _cvUploaded: true }));
                        }
                      }} />
                      <span className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg inline-block cursor-pointer">
                        {form._cvUploaded ? '✓ Uploaded' : 'Choose File'}
                      </span>
                    </label>
                  ) : <p className="text-xs text-amber-600">Save your application first to enable uploads</p>}
                </div>
              )}
              {grant.application_instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Instructions from Funder</p>
                  <p className="text-sm text-gray-700">{grant.application_instructions}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP: REVIEW */}
          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Project Title</span><span className="font-medium text-right max-w-xs">{form.project_title}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Research Areas</span><span className="font-medium">{form.research_areas.join(', ') || 'None'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Team Size</span><span className="font-medium">{1 + (form.co_investigators?.length || 0)} people</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Budget</span><span className="font-bold text-green-700">৳{totalBudget.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Timeline</span><span className="font-medium">{form.project_start_date || '—'} → {form.project_end_date || '—'}</span></div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                <strong>Before submitting:</strong> Make sure all documents are uploaded and information is accurate. You cannot edit after submission.
              </div>
            </div>
          )}

          {/* Navigation */}
          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => step !== 'basics' && setStep(STEPS[stepIdx - 1])}
              disabled={step === 'basics'}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30">
              ← Previous
            </button>
            {step !== 'review' ? (
              <button onClick={() => saveAndNext(STEPS[stepIdx + 1])} disabled={loading}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
                {loading ? 'Saving…' : 'Save & Continue →'}
              </button>
            ) : (
              <button onClick={submitApplication} disabled={loading}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition">
                {loading ? 'Submitting…' : '🚀 Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
