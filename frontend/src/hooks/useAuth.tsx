import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, userApi } from '../api'
import type { UserV2 } from '../types'

interface AuthContextType {
  user: UserV2 | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserV2>
  register: (data: { email: string; password: string; full_name: string; institution?: string }) => Promise<UserV2>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserV2 | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      userApi.me()
        .then(u => setUser(u as UserV2))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('access_token', data.access_token)
    setUser(data.user as UserV2)
    return data.user as UserV2
  }

  const register = async (payload: { email: string; password: string; full_name: string; institution?: string }) => {
    const data = await authApi.register(payload)
    localStorage.setItem('access_token', data.access_token)
    setUser(data.user as UserV2)
    return data.user as UserV2
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const refreshUser = async () => {
    const updated = await userApi.me()
    setUser(updated as UserV2)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
