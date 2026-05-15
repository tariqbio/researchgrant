import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function PasswordField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-10 outline-none focus:border-emerald-400 transition-colors"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute inset-y-0 right-0 px-3 text-gray-400 hover:text-gray-700"
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.58 10.58A2 2 0 0012 14a2 2 0 001.42-.58" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 4.24A10.3 10.3 0 0112 4c5 0 8.5 3.6 10 8a13.4 13.4 0 01-3.18 4.72" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.61 6.61A13.1 13.1 0 002 12c1.5 4.4 5 8 10 8 1.5 0 2.87-.32 4.08-.9" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}

function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="text-center mb-6">
      <Link to="/" className="text-xl font-medium text-gray-900 inline-block hover:text-gray-700">
        Grant<span className="text-emerald-600">BD</span>
      </Link>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      <Link to="/" className="inline-block text-xs text-emerald-600 hover:text-emerald-700 mt-3">
        Back to home
      </Link>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.is_admin ? '/admin' : '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthHeader subtitle="Sign in to your account" />
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 transition-colors"
                placeholder="you@university.edu.bd"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Password</label>
              <PasswordField value={password} onChange={setPassword} />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white text-sm py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 hover:text-emerald-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', full_name: '', institution: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await register(form)
      if (user.is_admin) {
        navigate('/admin')
        return
      }
      navigate('/profile')  // send to profile to set interests
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthHeader subtitle="Create your researcher account" />
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'full_name', label: 'Full name', type: 'text', placeholder: 'Dr. Ariful Rahman' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'you@university.edu.bd' },
              { key: 'institution', label: 'Institution', type: 'text', placeholder: 'Daffodil International University' },
              { key: 'password', label: 'Password', type: 'password', placeholder: '' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-xs text-gray-500 mb-1.5">{field.label}</label>
                {field.key === 'password' ? (
                  <PasswordField
                    value={form.password}
                    onChange={value => setForm(prev => ({ ...prev, password: value }))}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={set(field.key)}
                    placeholder={field.placeholder}
                    required={field.key !== 'institution'}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 transition-colors"
                  />
                )}
              </div>
            ))}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white text-sm py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
