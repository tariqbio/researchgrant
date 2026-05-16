import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usersApi } from '../api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      usersApi.me()
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token: string, userData: User) => {
    localStorage.setItem('access_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const refreshUser = async () => {
    const r = await usersApi.me()
    setUser(r.data)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
