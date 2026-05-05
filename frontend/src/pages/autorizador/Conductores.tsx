import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { useConductores } from '../../hooks/useConductores'
import type { Conductor } from '../../types'

export default function AutorizadorConductores() {
  const { data: conductores = [], isLoading } = useConductores()
  const hoy = new Date()

  const columns: Column<Conductor>[] = [
    { key: 'nombre_conductor', header: 'Nombre' },
    { key: 'cedula_conductor', header: 'Cédula' },
    { key: 'categoria_licencia', header: 'Categoría' },
    { key: 'fecha_vence_licencia', header: 'Vence licencia', render: c => {
      const v = new Date(c.fecha_vence_licencia)
      return <span className={v < hoy ? 'text-red-600 font-medium' : ''}>{v.toLocaleDateString('es-CO')}</span>
    }},
    { key: 'autorizacion_th', header: 'TH', render: c => {
      const ok = c.autorizacion_th === 1 && (!c.fecha_vence_th || new Date(c.fecha_vence_th) >= hoy)
      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ok ? 'Vigente' : 'Vencida'}</span>
    }},
    { key: 'dependencia', header: 'Dependencia', render: c => c.dependencia?.descripcion ?? '' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Conductores</h1>
        <p className="text-sm text-slate-500">{conductores.length} conductores</p>
      </div>
      <DataTable columns={columns} data={conductores} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar nombre, cédula..."
        searchFilter={(c, q) => [c.nombre_conductor, c.cedula_conductor].join(' ').toLowerCase().includes(q.toLowerCase())}
      />
    </div>
  )
}
