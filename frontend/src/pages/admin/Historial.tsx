import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter } from 'lucide-react'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { historialApi } from '../../api/historial'
import type { HistorialUso } from '../../api/historial'
import { useVehiculos } from '../../hooks/useVehiculos'

export default function AdminHistorial() {
  const { data: vehiculos = [] } = useVehiculos()
  const [vehiculoId, setVehiculoId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const params: Record<string, string> = {}
  if (vehiculoId) params.vehiculo_id = vehiculoId
  if (desde) params.desde = desde
  if (hasta) params.hasta = hasta

  const { data: historial = [], isLoading } = useQuery({
    queryKey: ['historial', params],
    queryFn: () => historialApi.list(params),
  })

  const totalKm = historial.reduce((s, h) => s + (h.cantidad_recorridos ?? 0), 0)

  const columns: Column<HistorialUso>[] = [
    { key: 'vehiculo', header: 'Vehículo', render: h => h.vehiculo?.placa_vehiculo ?? `#${h.id_vehiculo}` },
    { key: 'fecha', header: 'Fecha', render: h => new Date(h.fecha).toLocaleDateString('es-CO') },
    { key: 'salida', header: 'Conductor', render: h => h.salida?.conductor?.nombre_conductor ?? '' },
    { key: 'salida2', header: 'Destino', render: h => h.salida?.lugar_destino ?? '' },
    { key: 'kilometraje_inicial', header: 'Km inicial', render: h => h.kilometraje_inicial?.toLocaleString() },
    { key: 'kilometraje_final', header: 'Km final', render: h => h.kilometraje_final?.toLocaleString() },
    { key: 'cantidad_recorridos', header: 'Recorrido', render: h => <span className="font-medium">{h.cantidad_recorridos?.toLocaleString()} km</span> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Historial de Uso</h1>
          <p className="text-sm text-slate-500">{historial.length} registros · {totalKm.toLocaleString()} km totales</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-slate-400" />
          <select value={vehiculoId} onChange={e => setVehiculoId(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los vehículos</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo}</option>)}
          </select>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} placeholder="Desde" className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} placeholder="Hasta" className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <DataTable columns={columns} data={historial} keyField="id" loading={isLoading}
        emptyMessage="Sin registros para los filtros seleccionados"
      />
    </div>
  )
}
