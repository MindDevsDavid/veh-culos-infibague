import { AlertTriangle } from 'lucide-react'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { useConductores } from '../../hooks/useConductores'
import type { Conductor } from '../../types'

export default function AutorizadorConductores() {
  const { data: conductores = [], isLoading } = useConductores()
  const hoy = new Date()
  const en30dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
  const vencidasLicencia = conductores.filter(c => c.fecha_vence_licencia && new Date(c.fecha_vence_licencia) < hoy)
  const proximasLicencia = conductores.filter(c => {
    if (!c.fecha_vence_licencia) return false
    const v = new Date(c.fecha_vence_licencia)
    return v >= hoy && v <= en30dias
  })

  const columns: Column<Conductor>[] = [
    { key: 'nombre_conductor', header: 'Nombre' },
    { key: 'cedula_conductor', header: 'Cédula' },
    { key: 'categoria_licencia', header: 'Categoría' },
    { key: 'fecha_vence_licencia', header: 'Vence licencia', render: c => {
      const v = new Date(c.fecha_vence_licencia)
      return <span className={v < hoy ? 'text-red-600 font-medium' : ''}>{v.toLocaleDateString('es-CO')}</span>
    }},
    { key: 'autorizacion_th', header: 'TH', render: c => {
      const tieneNum = !!c.autorizacion_th
      const vigente = tieneNum && (!c.fecha_vence_th || new Date(c.fecha_vence_th) >= hoy)
      return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vigente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tieneNum ? c.autorizacion_th : 'Sin auth'}</span>
    }},
    { key: 'dependencia', header: 'Dependencia', render: c => c.dependencia?.descripcion ?? '' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Conductores</h1>
        <p className="text-sm text-slate-500">{conductores.length} conductores</p>
      </div>

      {vencidasLicencia.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Licencias vencidas:</span>{' '}
            {vencidasLicencia.map((c, i) => (
              <span key={c.id}>
                {c.nombre_conductor} <span className="text-red-600">({new Date(c.fecha_vence_licencia).toLocaleDateString('es-CO')})</span>
                {i < vencidasLicencia.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {proximasLicencia.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Licencias próximas a vencer (≤30 días):</span>{' '}
            {proximasLicencia.map((c, i) => (
              <span key={c.id}>
                {c.nombre_conductor} <span className="text-amber-600">({new Date(c.fecha_vence_licencia).toLocaleDateString('es-CO')})</span>
                {i < proximasLicencia.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <DataTable columns={columns} data={conductores} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar nombre, cédula..."
        searchFilter={(c, q) => [c.nombre_conductor, c.cedula_conductor].join(' ').toLowerCase().includes(q.toLowerCase())}
      />
    </div>
  )
}
