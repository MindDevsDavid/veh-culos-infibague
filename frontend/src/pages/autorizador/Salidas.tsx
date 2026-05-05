import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import { useSalidas } from '../../hooks/useSalidas'
import type { SalidaVehiculo } from '../../types'

export default function AutorizadorSalidas() {
  const { data: salidas = [], isLoading } = useSalidas()

  const columns: Column<SalidaVehiculo>[] = [
    { key: 'placa_vehiculo', header: 'Placa', render: s => <span className="font-mono font-medium">{s.placa_vehiculo}</span> },
    { key: 'conductor', header: 'Conductor', render: s => (s as any).conductor?.nombre_conductor ?? '' },
    { key: 'lugar_destino', header: 'Destino' },
    { key: 'fecha_salida', header: 'Fecha', render: s => s.fecha_salida ? new Date(s.fecha_salida).toLocaleDateString('es-CO') : '' },
    { key: 'hora_salida', header: 'Hora salida', render: s => s.hora_salida ? new Date(s.hora_salida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'hora_entrada', header: 'Hora entrada', render: s => s.hora_entrada ? new Date(s.hora_entrada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'estado', header: 'Estado', render: s => <StatusBadge value={s.estado} map={MAPS.ESTADO_SALIDA} /> },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Todas las Salidas</h1>
        <p className="text-sm text-slate-500">{salidas.length} registros</p>
      </div>
      <DataTable columns={columns} data={salidas} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar placa, conductor, destino..."
        searchFilter={(s, q) => [s.placa_vehiculo, (s as any).conductor?.nombre_conductor ?? '', s.lugar_destino].join(' ').toLowerCase().includes(q.toLowerCase())}
      />
    </div>
  )
}
