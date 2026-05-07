import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSalidas } from '../../hooks/useSalidas'
import api from '../../api/client'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import type { SalidaVehiculo } from '../../types'

export default function ConductorSolicitudes() {
  const { data: salidas = [], isLoading } = useSalidas()
  const { data: preop } = useQuery<any | null>({
    queryKey: ['inspecciones', 'preop-pendiente'],
    queryFn: () => api.get('/inspecciones/preop-pendiente').then(r => r.data),
  })

  const columns: Column<SalidaVehiculo>[] = [
    { key: 'placa_vehiculo', header: 'Placa', render: s => <span className="font-mono font-medium">{s.placa_vehiculo}</span> },
    { key: 'lugar_destino', header: 'Destino' },
    { key: 'motivo_salida', header: 'Motivo', render: s => <span className="truncate block max-w-[180px]">{s.motivo_salida}</span> },
    { key: 'fecha_salida', header: 'Fecha', render: s => s.fecha_salida ? new Date(s.fecha_salida).toLocaleDateString('es-CO') : '' },
    { key: 'estado', header: 'Estado', render: s => <StatusBadge value={s.estado} map={MAPS.ESTADO_SALIDA} /> },
    { key: 'motivo_rechazo', header: 'Motivo rechazo', render: s => s.motivo_rechazo ? <span className="text-red-600 text-xs">{s.motivo_rechazo}</span> : '' },
  ]

  const pendientesInsp = salidas.filter(s => s.estado === 'RETORNANDO')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mis Solicitudes</h1>
          <p className="text-sm text-slate-500">{salidas.length} solicitudes</p>
        </div>
        <Link
          to={preop ? `/conductor/solicitar?inspeccion=${preop.id}` : '/conductor/inspeccion/nueva'}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> {preop ? 'Continuar solicitud' : 'Nueva solicitud'}
        </Link>
      </div>

      {preop && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold text-blue-800">Inspección preoperacional lista</span>
            <span className="text-blue-600 ml-2">— ID {preop.id} · {preop.vehiculo?.placa_vehiculo ?? preop.placa_vehiculo} · {preop.kilometraje} km</span>
          </div>
          <Link to={`/conductor/solicitar?inspeccion=${preop.id}`} className="text-sm font-medium text-blue-700 underline hover:text-blue-800 ml-4 shrink-0">
            Solicitar viaje →
          </Link>
        </div>
      )}

      {pendientesInsp.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-700">Vehículos que regresaron — llena la inspección postoperacional:</p>
          {pendientesInsp.map(s => (
            <div key={s.id} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-mono font-medium">{s.placa_vehiculo}</span>
                <span className="text-slate-500 ml-2">→ {s.lugar_destino}</span>
              </div>
              <Link to={`/conductor/inspeccion/${s.id}/post`} className="text-sm font-medium text-amber-700 underline hover:text-amber-800">
                Llenar inspección post
              </Link>
            </div>
          ))}
        </div>
      )}

      <DataTable columns={columns} data={salidas} keyField="id" loading={isLoading} />
    </div>
  )
}
