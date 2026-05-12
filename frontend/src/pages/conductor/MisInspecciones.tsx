import { useQuery } from '@tanstack/react-query'
import { CheckSquare, AlertTriangle, CheckCircle, Wrench } from 'lucide-react'
import { inspeccionesApi } from '../../api/inspecciones'
import type { Inspeccion } from '../../types'

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
      ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {ok ? <CheckCircle size={11} /> : <AlertTriangle size={11} />} {label}
    </span>
  )
}

function Campo({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
      <span className="text-sm text-slate-700">{value ?? '—'}</span>
    </div>
  )
}

function InspeccionCard({ insp }: { insp: Inspeccion }) {
  const fecha = new Date(insp.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${
            insp.tipo_inspeccion === 'PREOPERACIONAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
          }`}>{insp.tipo_inspeccion}</span>
          <h3 className="text-lg font-bold text-slate-800">{insp.vehiculo?.placa_vehiculo ?? insp.placa_vehiculo}</h3>
          <p className="text-sm text-slate-500">{fecha}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge ok={!!insp.apto_operar} label={insp.apto_operar ? 'Apto para operar' : 'No apto'} />
          {insp.reporte_mantenimiento && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              <Wrench size={11} /> Mantenimiento reportado
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
        <Campo label="Kilometraje" value={insp.kilometraje?.toLocaleString() + ' km'} />
        <Campo label="Conductor" value={insp.conductor?.nombre_conductor} />
        <Campo label="Hora" value={insp.hora ? String(insp.hora).includes('T') ? String(insp.hora).slice(11, 16) : String(insp.hora).slice(0, 5) : undefined} />
        {insp.observaciones && <div className="col-span-2 sm:col-span-3"><Campo label="Observaciones" value={insp.observaciones} /></div>}
      </div>
    </div>
  )
}

export default function MisInspecciones() {
  const { data: inspecciones = [], isLoading } = useQuery({
    queryKey: ['inspecciones', 'mias'],
    queryFn: () => inspeccionesApi.list(),
  })

  const ultima = inspecciones[0] as Inspeccion | undefined

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare size={20} className="text-blue-600" /> Mis Inspecciones
        </h1>
        <p className="text-sm text-slate-500">{inspecciones.length} registros</p>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Cargando...</p>}

      {!isLoading && !ultima && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          No has realizado inspecciones aún.
        </div>
      )}

      {ultima && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Última inspección</p>
          <InspeccionCard insp={ultima} />
        </div>
      )}

      {inspecciones.length > 1 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Historial</p>
          {inspecciones.slice(1).map(i => <InspeccionCard key={i.id} insp={i} />)}
        </div>
      )}
    </div>
  )
}
