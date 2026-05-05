import { Link } from 'react-router-dom'
import { ArrowRight, LogIn } from 'lucide-react'
import { useSalidas } from '../../hooks/useSalidas'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import type { SalidaVehiculo } from '../../types'

export default function VigilanteActivos() {
  const { data: salidas = [], isLoading } = useSalidas()

  if (isLoading) return <div className="text-slate-400 p-8 text-center">Cargando...</div>

  const pendienteSalida = salidas.filter(s => ['AUTORIZADA', 'INSPECCIONADA'].includes(s.estado))
  const enCurso = salidas.filter(s => s.estado === 'EN_CURSO')
  const retornando = salidas.filter(s => s.estado === 'RETORNANDO')

  function Card({ s, accion }: { s: SalidaVehiculo; accion: 'salida' | 'entrada' }) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-slate-800">{s.placa_vehiculo}</span>
            <StatusBadge value={s.estado} map={MAPS.ESTADO_SALIDA} />
          </div>
          <p className="text-sm text-slate-600 mt-0.5">{(s as any).conductor?.nombre_conductor ?? `Conductor #${s.id_conductor}`}</p>
          <p className="text-xs text-slate-400 mt-0.5">→ {s.lugar_destino}</p>
        </div>
        <Link
          to={`/vigilante/check/${s.id}/${accion}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0"
        >
          {accion === 'salida' ? <ArrowRight size={15} /> : <LogIn size={15} />}
          Check {accion}
        </Link>
      </div>
    )
  }

  function Section({ title, items, accion }: { title: string; items: SalidaVehiculo[]; accion: 'salida' | 'entrada' }) {
    if (items.length === 0) return null
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">{title} ({items.length})</h2>
        {items.map(s => <Card key={s.id} s={s} accion={accion} />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Control de Portería</h1>
        <p className="text-sm text-slate-500">Vehículos que requieren acción</p>
      </div>

      {salidas.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-10 text-center text-slate-400 text-sm">
          Sin vehículos activos en este momento.
        </div>
      )}

      <Section title="Listos para salir (check salida)" items={pendienteSalida} accion="salida" />
      <Section title="En curso" items={enCurso} accion="entrada" />
      <Section title="Retornando (check entrada)" items={retornando} accion="entrada" />
    </div>
  )
}
