import { useQuery } from '@tanstack/react-query'
import { Truck, AlertTriangle, ArrowRightLeft } from 'lucide-react'
import api from '../../api/client'
import type { Vehiculo, SalidaVehiculo, ControlRequisito } from '../../types'

function KpiCard({ label, value, icon, colorClass }: { label: string; value: number | string; icon: React.ReactNode; colorClass: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { data: vehiculos = [] } = useQuery<Vehiculo[]>({ queryKey: ['vehiculos'], queryFn: () => api.get('/vehiculos').then(r => r.data) })
  const { data: salidas = [] } = useQuery<SalidaVehiculo[]>({ queryKey: ['salidas', { estado: 'EN_CURSO' }], queryFn: () => api.get('/salidas/en-curso').then(r => r.data) })
  const { data: requisitos = [] } = useQuery<ControlRequisito[]>({ queryKey: ['requisitos-vencidos'], queryFn: () => api.get('/requisitos').then(r => r.data) })

  const activos = vehiculos.filter(v => v.estado === 'ACTIVO').length
  const enMant  = vehiculos.filter(v => v.estado === 'EN_MANTENIMIENTO').length
  const vencidos = requisitos.filter(r => r.estado_requisito === 'VENCIDO').length

  const hoy = new Date()
  const en30 = new Date(); en30.setDate(hoy.getDate() + 30)
  const proximos = requisitos.filter(r => {
    if (r.estado_requisito !== 'VIGENTE') return false
    const vence = new Date(r.fecha_vencimiento)
    return vence <= en30 && vence >= hoy
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Resumen del sistema de control vehicular</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Vehículos activos"     value={activos}      icon={<Truck size={20} className="text-blue-600" />}       colorClass="bg-blue-50" />
        <KpiCard label="En mantenimiento"      value={enMant}       icon={<Truck size={20} className="text-amber-600" />}      colorClass="bg-amber-50" />
        <KpiCard label="Viajes en curso"       value={salidas.length} icon={<ArrowRightLeft size={20} className="text-green-600" />} colorClass="bg-green-50" />
        <KpiCard label="Requisitos vencidos"   value={vencidos}     icon={<AlertTriangle size={20} className="text-red-600" />} colorClass="bg-red-50" />
      </div>

      {proximos > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{proximos} requisito(s)</strong> vencen en los próximos 30 días.
            <a href="/admin/requisitos" className="underline ml-1">Ver requisitos</a>
          </p>
        </div>
      )}

      {vencidos > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-800">
            <strong>{vencidos} requisito(s)</strong> vencidos bloquean salidas.
            <a href="/admin/requisitos" className="underline ml-1">Ver requisitos</a>
          </p>
        </div>
      )}

      {salidas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-green-600" />
              Viajes en curso ({salidas.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {salidas.map(s => (
              <div key={s.id} className="px-5 py-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-800">{s.placa_vehiculo}</span>
                  <span className="text-slate-500 ml-2">→ {s.lugar_destino}</span>
                </div>
                <span className="text-slate-400">{s.conductor?.nombre_conductor ?? `Conductor #${s.id_conductor}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Truck size={16} className="text-slate-500" />
            Estado de la flota ({vehiculos.length} vehículos)
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {vehiculos.map(v => (
            <div key={v.id} className="px-5 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-mono font-medium text-slate-800">{v.placa_vehiculo}</span>
                <span className="text-slate-500 ml-2">{v.linea}</span>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                v.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' :
                v.estado === 'EN_MANTENIMIENTO' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {v.estado === 'ACTIVO' ? 'Activo' : v.estado === 'EN_MANTENIMIENTO' ? 'En Mantenimiento' : 'Fuera de Servicio'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
