import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import { useVehiculos } from '../../hooks/useVehiculos'
import type { Vehiculo } from '../../types'

export default function AutorizadorVehiculos() {
  const { data: vehiculos = [], isLoading } = useVehiculos()

  const columns: Column<Vehiculo>[] = [
    { key: 'placa_vehiculo', header: 'Placa', render: v => <span className="font-mono font-medium">{v.placa_vehiculo}</span> },
    { key: 'linea', header: 'Línea' },
    { key: 'marca', header: 'Marca', render: v => v.marca?.descripcion ?? '' },
    { key: 'anno', header: 'Año' },
    { key: 'tipo_combustible', header: 'Combustible' },
    { key: 'estado', header: 'Estado', render: v => <StatusBadge value={v.estado} map={MAPS.ESTADO_VEHICULO} /> },
    { key: 'dependencia', header: 'Dependencia', render: v => v.dependencia?.descripcion ?? '' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Flota de Vehículos</h1>
        <p className="text-sm text-slate-500">{vehiculos.length} vehículos registrados</p>
      </div>
      <DataTable columns={columns} data={vehiculos} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar placa, línea..."
        searchFilter={(v, q) => [v.placa_vehiculo, v.linea, v.marca?.descripcion ?? ''].join(' ').toLowerCase().includes(q.toLowerCase())}
      />
    </div>
  )
}
