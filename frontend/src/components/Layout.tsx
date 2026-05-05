import { useState, ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Truck, Users, Wrench, FileText, Cpu, Package,
  Fuel, ArrowRightLeft, History, UserCog, ClipboardList, CheckSquare,
  LogOut, Menu, X, ChevronRight,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const NAV: Record<string, NavItem[]> = {
  ADMIN: [
    { to: '/admin/dashboard',    label: 'Dashboard',      icon: <LayoutDashboard size={18} /> },
    { to: '/admin/vehiculos',    label: 'Vehículos',      icon: <Truck size={18} /> },
    { to: '/admin/conductores',  label: 'Conductores',    icon: <Users size={18} /> },
    { to: '/admin/mantenimiento',label: 'Mantenimiento',  icon: <Wrench size={18} /> },
    { to: '/admin/requisitos',   label: 'Requisitos',     icon: <FileText size={18} /> },
    { to: '/admin/chips',        label: 'Chips GPS',      icon: <Cpu size={18} /> },
    { to: '/admin/componentes',  label: 'Componentes',    icon: <Package size={18} /> },
    { to: '/admin/tanqueos',     label: 'Tanqueos',       icon: <Fuel size={18} /> },
    { to: '/admin/salidas',      label: 'Salidas',        icon: <ArrowRightLeft size={18} /> },
    { to: '/admin/historial',    label: 'Historial',      icon: <History size={18} /> },
    { to: '/admin/usuarios',     label: 'Usuarios',       icon: <UserCog size={18} /> },
  ],
  CONDUCTOR: [
    { to: '/conductor/solicitudes', label: 'Mis Solicitudes', icon: <ClipboardList size={18} /> },
    { to: '/conductor/solicitar',   label: 'Solicitar Viaje', icon: <ArrowRightLeft size={18} /> },
  ],
  AUTORIZADOR: [
    { to: '/autorizador/pendientes',  label: 'Pendientes',   icon: <ClipboardList size={18} /> },
    { to: '/autorizador/salidas',     label: 'Salidas',      icon: <ArrowRightLeft size={18} /> },
    { to: '/autorizador/vehiculos',   label: 'Vehículos',    icon: <Truck size={18} /> },
    { to: '/autorizador/conductores', label: 'Conductores',  icon: <Users size={18} /> },
    { to: '/autorizador/historial',   label: 'Historial',    icon: <History size={18} /> },
  ],
  VIGILANTE: [
    { to: '/vigilante/activos', label: 'Vehículos Activos', icon: <CheckSquare size={18} /> },
  ],
  CONSULTAS: [
    { to: '/consultas/activos',   label: 'Viajes en Curso', icon: <ArrowRightLeft size={18} /> },
    { to: '/consultas/historial', label: 'Historial',       icon: <History size={18} /> },
  ],
}

const ROL_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  CONDUCTOR: 'Conductor',
  AUTORIZADOR: 'Autorizador',
  VIGILANTE: 'Vigilante',
  CONSULTAS: 'Consultas',
}

const ROL_COLOR: Record<string, string> = {
  ADMIN: 'bg-violet-100 text-violet-700',
  CONDUCTOR: 'bg-blue-100 text-blue-700',
  AUTORIZADOR: 'bg-amber-100 text-amber-700',
  VIGILANTE: 'bg-green-100 text-green-700',
  CONSULTAS: 'bg-slate-100 text-slate-600',
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)

  const items = NAV[user?.rol ?? ''] ?? []

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ${open ? 'w-56' : 'w-14'}`}>
        {/* Brand */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-slate-100 min-h-[60px]">
          <Truck className="text-blue-600 shrink-0" size={22} />
          {open && <span className="font-bold text-slate-800 text-sm leading-tight">Control<br/>Vehículos</span>}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
              title={!open ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {open && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {open && user && (
          <div className="border-t border-slate-100 px-3 py-3">
            <p className="text-xs font-medium text-slate-800 truncate">{user.nombre}</p>
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${ROL_COLOR[user.rol]}`}>
              {ROL_LABEL[user.rol]}
            </span>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => setOpen(v => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <ChevronRight size={14} className="text-slate-400" />
                <span>{user.nombre}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors"
            >
              <LogOut size={15} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
