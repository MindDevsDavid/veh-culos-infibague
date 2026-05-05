import { useSalidasEnCurso } from '../../hooks/useSalidas'
import StatusBadge, { MAPS } from '../../components/StatusBadge'

export default function ConsultasActivos() {
  const { data: salidas = [], isLoading } = useSalidasEnCurso()

  if (isLoading) return <div className="text-slate-400 p-8 text-center">Cargando...</div>

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Viajes en Curso</h1>
        <p className="text-sm text-slate-500">{salidas.length} vehículo(s) actualmente fuera</p>
      </div>

      {salidas.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-10 text-center text-slate-400 text-sm">
          No hay vehículos en viaje actualmente.
        </div>
      )}

      <div className="grid gap-3">
        {salidas.map(s => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-slate-800">{s.placa_vehiculo}</span>
                  <StatusBadge value={s.estado} map={MAPS.ESTADO_SALIDA} />
                </div>
                <p className="text-sm text-slate-600 mt-1">{(s as any).conductor?.nombre_conductor}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium text-slate-700">→ {s.lugar_destino}</p>
                <p className="text-slate-400 mt-0.5">Salió: {s.hora_salida ? new Date(s.hora_salida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 border-t border-slate-50 pt-3">{s.motivo_salida}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
