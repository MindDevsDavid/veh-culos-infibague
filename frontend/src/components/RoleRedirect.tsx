import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRedirect() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  switch (user.rol) {
    case 'ADMIN':       return <Navigate to="/admin/dashboard" replace />
    case 'CONDUCTOR':   return <Navigate to="/conductor/solicitudes" replace />
    case 'AUTORIZADOR': return <Navigate to="/autorizador/pendientes" replace />
    case 'VIGILANTE':   return <Navigate to="/vigilante/activos" replace />
    case 'CONSULTAS':   return <Navigate to="/consultas/activos" replace />
    case 'ALMACENISTA': return <Navigate to="/almacenista/tanqueos" replace />
    default:            return <Navigate to="/login" replace />
  }
}
