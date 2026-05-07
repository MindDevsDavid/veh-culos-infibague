import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, X, Fuel } from 'lucide-react'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { historialApi } from '../../api/historial'
import type { HistorialUso } from '../../api/historial'
import { useVehiculos } from '../../hooks/useVehiculos'
import api from '../../api/client'

function Campo({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  )
}

function DetalleModal({ h, onClose }: { h: HistorialUso; onClose: () => void }) {
  const s = h.salida

  const { data: tanqueos = [] } = useQuery<any[]>({
    queryKey: ['tanqueos-salida', s?.id],
    queryFn: () => api.get('/tanqueos', { params: { salida_id: s!.id } }).then(r => r.data),
    enabled: !!s?.id,
  })
  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-CO') : null
  const fmtDT = (d?: string | null) => {
    if (!d) return null
    const dt = new Date(d)
    return `${dt.toLocaleDateString('es-CO')} ${dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
  }
  const fmtH = (t?: string | null) => {
    if (!t) return null
    const d = new Date(t)
    return isNaN(d.getTime()) ? String(t).slice(0, 5) : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Detalle del viaje</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Vehículo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Vehículo</p>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Placa" value={h.vehiculo?.placa_vehiculo} />
              <Campo label="Línea" value={h.vehiculo?.linea} />
              <Campo label="Marca" value={h.vehiculo?.marca?.descripcion} />
            </div>
          </div>

          {/* Kilometraje y fecha */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Kilometraje</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Campo label="Inicial" value={h.kilometraje_inicial?.toLocaleString() + ' km'} />
              <Campo label="Final" value={h.kilometraje_final?.toLocaleString() + ' km'} />
              <Campo label="Recorrido" value={h.cantidad_recorridos?.toLocaleString() + ' km'} />
              <Campo label="Fecha registro" value={fmtDT(h.fecha)} />
            </div>
          </div>

          {s?.lugar_destino && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Destino</p>
              <p className="text-sm font-medium text-slate-800">{s.lugar_destino}</p>
              {s.dependencia_uso?.descripcion && <p className="text-xs text-slate-500 mt-0.5">{s.dependencia_uso.descripcion}</p>}
            </div>
          )}

          {s && <>
            {/* Conductor */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Conductor</p>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Nombre" value={s.conductor?.nombre_conductor} />
                <Campo label="Cédula" value={s.conductor?.cedula_conductor} />
              </div>
            </div>

            {/* Viaje */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Viaje</p>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Destino" value={s.lugar_destino} />
                <Campo label="Dependencia" value={s.dependencia_uso?.descripcion} />
                <Campo label="Fecha salida" value={fmt(s.fecha_salida)} />
                <Campo label="Hora salida" value={fmtH(s.hora_salida)} />
                <Campo label="Fecha entrada" value={fmt(s.fecha_entrada)} />
                <Campo label="Hora entrada" value={fmtH(s.hora_entrada)} />
                <Campo label="Autorizado por" value={s.autorizador?.nombre} />
                <Campo label="Firma" value={s.firma} />
              </div>
              {s.motivo_salida && <div className="mt-3"><Campo label="Motivo" value={s.motivo_salida} /></div>}
              {s.observaciones && <div className="mt-2"><Campo label="Observaciones" value={s.observaciones} /></div>}
            </div>
          </>}

          {h.observaciones && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Observaciones postoperacional</p>
              <p className="text-sm text-slate-700">{h.observaciones}</p>
            </div>
          )}

          {tanqueos.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
                <Fuel size={12} /> Tanqueos ({tanqueos.length})
              </p>
              <div className="space-y-2">
                {tanqueos.map((t: any) => (
                  <div key={t.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Combustible</span>
                      <span className="text-slate-700">{t.tipo_combustible ?? '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Galones</span>
                      <span className="text-slate-700">{t.cantidad_galones} gal</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Estado</span>
                      <span className={`inline-flex w-fit text-xs font-semibold px-2 py-0.5 rounded-full ${t.estado === 'AUTORIZADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{t.estado}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Fecha</span>
                      <span className="text-slate-700">{new Date(t.fecha_tanqueo).toLocaleDateString('es-CO')}</span>
                    </div>
                    {t.autorizador?.nombre && (
                      <div className="flex flex-col gap-0.5 col-span-2">
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Autorizado por</span>
                        <span className="text-slate-700">{t.autorizador.nombre}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminHistorial() {
  const { data: vehiculos = [] } = useVehiculos()
  const [vehiculoId, setVehiculoId] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [selected, setSelected] = useState<HistorialUso | null>(null)

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
    { key: 'fecha', header: 'Fecha y hora', render: h => {
      const d = new Date(h.fecha)
      return <span>{d.toLocaleDateString('es-CO')} <span className="text-slate-400">{d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span></span>
    }},
    { key: 'conductor', header: 'Conductor', render: h => h.salida?.conductor?.nombre_conductor ?? '—' },
    { key: 'destino', header: 'Destino', render: h => h.salida?.lugar_destino ?? '—' },
    { key: 'kilometraje_inicial', header: 'Km inicial', render: h => h.kilometraje_inicial?.toLocaleString() },
    { key: 'kilometraje_final', header: 'Km final', render: h => h.kilometraje_final?.toLocaleString() },
    { key: 'cantidad_recorridos', header: 'Recorrido', render: h => <span className="font-medium">{h.cantidad_recorridos?.toLocaleString()} km</span> },
  ]

  return (
    <div className="space-y-5">
      {selected && <DetalleModal h={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
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
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <DataTable
        columns={columns} data={historial} keyField="id" loading={isLoading}
        emptyMessage="Sin registros para los filtros seleccionados"
        onRowClick={setSelected}
      />
    </div>
  )
}
