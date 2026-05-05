import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRedirect from './components/RoleRedirect'
import Layout from './components/Layout'
import Login from './pages/Login'

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboard  from './pages/admin/Dashboard'
import AdminVehiculos  from './pages/admin/Vehiculos'
import AdminConductores from './pages/admin/Conductores'
import AdminMantenimiento from './pages/admin/Mantenimiento'
import AdminRequisitos from './pages/admin/Requisitos'
import AdminChips      from './pages/admin/Chips'
import AdminComponentes from './pages/admin/Componentes'
import AdminTanqueos   from './pages/admin/Tanqueos'
import AdminSalidas    from './pages/admin/Salidas'
import AdminHistorial  from './pages/admin/Historial'
import AdminUsuarios   from './pages/admin/Usuarios'

// ── Conductor pages ───────────────────────────────────────────────────────────
import ConductorSolicitudes from './pages/conductor/Solicitudes'
import ConductorSolicitar   from './pages/conductor/Solicitar'
import InspeccionPre        from './pages/conductor/InspeccionPre'
import InspeccionPost       from './pages/conductor/InspeccionPost'

// ── Autorizador pages ─────────────────────────────────────────────────────────
import AutorizadorPendientes  from './pages/autorizador/Pendientes'
import AutorizadorSalidas     from './pages/autorizador/Salidas'
import AutorizadorVehiculos   from './pages/autorizador/Vehiculos'
import AutorizadorConductores from './pages/autorizador/Conductores'
import AutorizadorHistorial   from './pages/autorizador/Historial'

// ── Vigilante pages ───────────────────────────────────────────────────────────
import VigilanteActivos  from './pages/vigilante/Activos'
import CheckSalida       from './pages/vigilante/CheckSalida'
import CheckEntrada      from './pages/vigilante/CheckEntrada'

// ── Consultas pages ───────────────────────────────────────────────────────────
import ConsultasActivos  from './pages/consultas/Activos'
import ConsultasHistorial from './pages/consultas/Historial'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function LayoutRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  return (
    <ProtectedRoute roles={roles as any}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard"     element={<LayoutRoute roles={['ADMIN']}><AdminDashboard /></LayoutRoute>} />
            <Route path="/admin/vehiculos"     element={<LayoutRoute roles={['ADMIN']}><AdminVehiculos /></LayoutRoute>} />
            <Route path="/admin/conductores"   element={<LayoutRoute roles={['ADMIN']}><AdminConductores /></LayoutRoute>} />
            <Route path="/admin/mantenimiento" element={<LayoutRoute roles={['ADMIN']}><AdminMantenimiento /></LayoutRoute>} />
            <Route path="/admin/requisitos"    element={<LayoutRoute roles={['ADMIN']}><AdminRequisitos /></LayoutRoute>} />
            <Route path="/admin/chips"         element={<LayoutRoute roles={['ADMIN']}><AdminChips /></LayoutRoute>} />
            <Route path="/admin/componentes"   element={<LayoutRoute roles={['ADMIN']}><AdminComponentes /></LayoutRoute>} />
            <Route path="/admin/tanqueos"      element={<LayoutRoute roles={['ADMIN']}><AdminTanqueos /></LayoutRoute>} />
            <Route path="/admin/salidas"       element={<LayoutRoute roles={['ADMIN']}><AdminSalidas /></LayoutRoute>} />
            <Route path="/admin/historial"     element={<LayoutRoute roles={['ADMIN']}><AdminHistorial /></LayoutRoute>} />
            <Route path="/admin/usuarios"      element={<LayoutRoute roles={['ADMIN']}><AdminUsuarios /></LayoutRoute>} />

            {/* Conductor */}
            <Route path="/conductor/solicitudes"         element={<LayoutRoute roles={['ADMIN','CONDUCTOR']}><ConductorSolicitudes /></LayoutRoute>} />
            <Route path="/conductor/solicitar"           element={<LayoutRoute roles={['ADMIN','CONDUCTOR']}><ConductorSolicitar /></LayoutRoute>} />
            <Route path="/conductor/inspeccion/:id/pre"  element={<LayoutRoute roles={['ADMIN','CONDUCTOR']}><InspeccionPre /></LayoutRoute>} />
            <Route path="/conductor/inspeccion/:id/post" element={<LayoutRoute roles={['ADMIN','CONDUCTOR']}><InspeccionPost /></LayoutRoute>} />

            {/* Autorizador */}
            <Route path="/autorizador/pendientes"  element={<LayoutRoute roles={['ADMIN','AUTORIZADOR']}><AutorizadorPendientes /></LayoutRoute>} />
            <Route path="/autorizador/salidas"     element={<LayoutRoute roles={['ADMIN','AUTORIZADOR']}><AutorizadorSalidas /></LayoutRoute>} />
            <Route path="/autorizador/vehiculos"   element={<LayoutRoute roles={['ADMIN','AUTORIZADOR']}><AutorizadorVehiculos /></LayoutRoute>} />
            <Route path="/autorizador/conductores" element={<LayoutRoute roles={['ADMIN','AUTORIZADOR']}><AutorizadorConductores /></LayoutRoute>} />
            <Route path="/autorizador/historial"   element={<LayoutRoute roles={['ADMIN','AUTORIZADOR']}><AutorizadorHistorial /></LayoutRoute>} />

            {/* Vigilante */}
            <Route path="/vigilante/activos"           element={<LayoutRoute roles={['ADMIN','VIGILANTE']}><VigilanteActivos /></LayoutRoute>} />
            <Route path="/vigilante/check/:id/salida"  element={<LayoutRoute roles={['ADMIN','VIGILANTE']}><CheckSalida /></LayoutRoute>} />
            <Route path="/vigilante/check/:id/entrada" element={<LayoutRoute roles={['ADMIN','VIGILANTE']}><CheckEntrada /></LayoutRoute>} />

            {/* Consultas */}
            <Route path="/consultas/activos"   element={<LayoutRoute roles={['ADMIN','CONSULTAS']}><ConsultasActivos /></LayoutRoute>} />
            <Route path="/consultas/historial" element={<LayoutRoute roles={['ADMIN','CONSULTAS']}><ConsultasHistorial /></LayoutRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
