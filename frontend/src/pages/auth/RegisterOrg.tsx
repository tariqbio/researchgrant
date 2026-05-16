import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApiV2 } from '../../api'
import { ELIGIBILITY_TYPES } from '../../types'

export default function RegisterOrg() {
  const navigate = useNavigate()
  const [form, setForm] = useState<any>({ org_type: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await authApiV2.registerV2({ ...form, role: 'org' })
      navigate('/login')
      alert('Registration submitted. You will be notified once verified.')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="text-xl font-medium text-gray-900 inline-block">Grant<span className="text-emerald-600">BD</span></Link>
          <p className="text-sm text-gray-400 mt-1">Register your funding organization</p>
          <Link to="/login" className="inline-block text-xs text-emerald-600 hover:text-emerald-700 mt-3">← Back to login</Link>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800">
          Organization accounts are reviewed before activation. Usually 1–2 business days.
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[{k:'full_name',l:'Contact Person Name',t:'text',p:'Dr. Tariqul Islam'},{k:'email',l:'Work Email',t:'email',p:'you@org.bd'},{k:'org_name',l:'Organization Name *',t:'text',p:'Bangladesh Agricultural Research Council'},{k:'org_website',l:'Website',t:'url',p:'https://...'}].map(({k,l,t,p})=>(
              <div key={k}><label className="block text-xs text-gray-500 mb-1.5">{l}</label>
              <input type={t} value={form[k]||''} onChange={set(k)} required={k!=='org_website'} placeholder={p}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 transition-colors"/></div>
            ))}
            <div><label className="block text-xs text-gray-500 mb-1.5">Organization Type *</label>
            <select value={form.org_type} onChange={set('org_type')} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400">
              <option value="">Select type</option>
              {[['government','Government Agency'],['university','University'],['ngo','NGO / Foundation'],['private','Private Sector']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select></div>
            <div><label className="block text-xs text-gray-500 mb-1.5">About your organization</label>
            <textarea rows={3} value={form.org_description||''} onChange={set('org_description')} placeholder="Brief description..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"/></div>
            <div><label className="block text-xs text-gray-500 mb-1.5">Password *</label>
            <input type="password" value={form.password||''} onChange={set('password')} required minLength={6}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"/></div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? 'Submitting…' : 'Submit for Verification'}
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-4">Already registered? <Link to="/login" className="text-emerald-600">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
