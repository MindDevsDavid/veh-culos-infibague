import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthUser } from '../types'
import api, { setAccessToken } from '../api/client'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restaura la sesión al montar usando la cookie de refresh (HttpOnly).
  // Sin esto, un recargado de página (ej. móvil al volver de la cámara) borra
  // el token en memoria y tiraba al login. Ahora se recupera silenciosamente.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data } = await api.post('/auth/refresh')
        setAccessToken(data.accessToken)
        const me = await api.get('/auth/me')
        if (mounted) setUser({ id: me.data.sub, nombre: me.data.nombre, email: me.data.email, rol: me.data.rol })
      } catch {
        // no hay sesión válida — queda deslogueado
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    setAccessToken(data.accessToken)
    setUser(data.user)
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {})
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
