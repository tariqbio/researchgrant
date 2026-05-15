import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

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
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-medium text-gray-900">Grant<span className="text-emerald-600">BD</span></h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>
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
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 transition-colors"
              />
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
        <div className="text-center mb-6">
          <h1 className="text-xl font-medium text-gray-900">Grant<span className="text-emerald-600">BD</span></h1>
          <p className="text-sm text-gray-400 mt-1">Create your researcher account</p>
        </div>
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
                <input
                  type={field.type}
                  value={(form as any)[field.key]}
                  onChange={set(field.key)}
                  placeholder={field.placeholder}
                  required={field.key !== 'institution'}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 transition-colors"
                />
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
