import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Rol } from '../types'

interface Props {
  children: JSX.Element
  roles?: Rol[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />

  return children
}
