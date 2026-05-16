import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';

type Mode = 'login' | 'register-researcher' | 'register-org' | 'setup';

export default function AuthPages() {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    authApi.setupStatus().then(r => {
      if (r.data.needs_setup) setMode('setup');
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await authApi.login(form.email, form.password);
      } else if (mode === 'setup') {
        res = await authApi.setup({ email: form.email, password: form.password, full_name: form.full_name });
      } else {
        const role = mode === 'register-org' ? 'org' : 'researcher';
        res = await authApi.register({ ...form, role });
      }
      login(res.data.access_token, res.data.user);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const inp = (label: string, key: string, type = 'text', required = false, placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <input
        type={type} placeholder={placeholder}
        value={form[key] || ''}
        onChange={e => set(key, e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">G</span>
        </div>
        <span className="font-bold text-gray-900 text-lg">GrantBD</span>
        <span className="text-gray-400 text-sm ml-1">— Bangladesh Research Grant Platform</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Mode = Login */}
          {mode === 'login' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm mb-6">Sign in to your GrantBD account</p>
              <div className="space-y-4">
                {inp('Email', 'email', 'email', true)}
                {inp('Password', 'password', 'password', true)}
              </div>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              <button onClick={handleSubmit} disabled={loading}
                className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-3">Don't have an account?</p>
                <div className="flex gap-3">
                  <button onClick={() => setMode('register-researcher')}
                    className="flex-1 border-2 border-green-600 text-green-700 font-medium py-2 rounded-lg text-sm hover:bg-green-50 transition">
                    I'm a Researcher
                  </button>
                  <button onClick={() => setMode('register-org')}
                    className="flex-1 border-2 border-blue-600 text-blue-700 font-medium py-2 rounded-lg text-sm hover:bg-blue-50 transition">
                    I'm a Funder / Org
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode = Register Researcher */}
          {mode === 'register-researcher' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <button onClick={() => setMode('login')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
                ← Back to login
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">Researcher / Student</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-gray-500 text-sm mb-6">Find grants, apply, and track your research funding</p>
              <div className="space-y-3">
                {inp('Full Name', 'full_name', 'text', true)}
                {inp('Email', 'email', 'email', true)}
                {inp('Password', 'password', 'password', true)}
                {inp('Institution / University', 'institution', 'text', false, 'e.g. Dhaka University')}
                {inp('Department', 'department', 'text', false, 'e.g. Department of CSE')}
                {inp('Designation', 'designation', 'text', false, 'e.g. Assistant Professor, PhD Student')}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Degree</label>
                  <select value={form.academic_degree || ''} onChange={e => set('academic_degree', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Select degree</option>
                    {['BSc', 'MSc', 'MPhil', 'PhD', 'Postdoc', 'Professor'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                {inp('ORCID ID', 'orcid_id', 'text', false, '0000-0000-0000-0000')}
                {inp('Phone', 'phone', 'tel', false, '+880...')}
              </div>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              <button onClick={handleSubmit} disabled={loading}
                className="w-full mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                {loading ? 'Creating account…' : 'Create Researcher Account'}
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">Your account is active immediately after registration.</p>
            </div>
          )}

          {/* Mode = Register Org */}
          {mode === 'register-org' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <button onClick={() => setMode('login')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1">
                ← Back to login
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">Funding Organization</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Register your organization</h2>
              <p className="text-gray-500 text-sm mb-6">Publish grant calls and review applications</p>
              <div className="space-y-3">
                {inp('Contact Person Full Name', 'full_name', 'text', true)}
                {inp('Work Email', 'email', 'email', true)}
                {inp('Password', 'password', 'password', true)}
                {inp('Organization Name', 'org_name', 'text', true, 'e.g. Bangladesh Agricultural Research Council')}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type <span className="text-red-500">*</span></label>
                  <select value={form.org_type || ''} onChange={e => set('org_type', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select type</option>
                    {[['government', 'Government Agency'], ['university', 'University / Academic'], ['ngo', 'NGO / Foundation'], ['private', 'Private Sector']].map(([v, l]) =>
                      <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                {inp('Organization Website', 'org_website', 'url', false, 'https://...')}
                {inp('Office Address', 'org_address', 'text', false)}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About the Organization</label>
                  <textarea rows={3} placeholder="Brief description of your organization and research focus areas..."
                    value={form.org_description || ''} onChange={e => set('org_description', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              <button onClick={handleSubmit} disabled={loading}
                className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                {loading ? 'Submitting…' : 'Submit for Verification'}
              </button>
              <p className="text-xs text-gray-400 mt-3 text-center">Organization accounts are reviewed and verified before activation. You'll be notified by email.</p>
            </div>
          )}

          {/* Mode = Setup (first-time) */}
          {mode === 'setup' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">First-Time Setup</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create God Admin Account</h2>
              <p className="text-gray-500 text-sm mb-6">No accounts exist yet. Create the platform administrator account.</p>
              <div className="space-y-3">
                {inp('Full Name', 'full_name', 'text', true)}
                {inp('Email', 'email', 'email', true)}
                {inp('Password', 'password', 'password', true)}
              </div>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              <button onClick={handleSubmit} disabled={loading}
                className="w-full mt-5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition">
                {loading ? 'Creating…' : 'Create Admin Account'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
