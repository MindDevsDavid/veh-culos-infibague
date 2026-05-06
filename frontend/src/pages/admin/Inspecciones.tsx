import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckSquare, Filter, X, CheckCircle, AlertTriangle, Wrench } from 'lucide-react'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import { inspeccionesApi } from '../../api/inspecciones'
import type { Inspeccion } from '../../types'
import { useVehiculos } from '../../hooks/useVehiculos'

function Campo({ label, value }: { label: string; value?: string | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  )
}

function Bool({ label, value }: { label: string; value: any }) {
  const ok = value === true || value === 1 || value === '1'
  return (
    <div className="flex items-center gap-1.5">
      {ok
        ? <CheckCircle size={13} className="text-green-500 shrink-0" />
        : <AlertTriangle size={13} className="text-red-400 shrink-0" />}
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{title}</p>
      {children}
    </div>
  )
}

function DetalleModal({ i, onClose }: { i: Inspeccion; onClose: () => void }) {
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('es-CO') : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              i.tipo_inspeccion === 'PREOPERACIONAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>{i.tipo_inspeccion}</span>
            <h2 className="text-base font-bold text-slate-800">
              {i.vehiculo?.placa_vehiculo ?? i.placa_vehiculo} — {fmt(i.fecha)}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Resumen */}
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              i.apto_operar ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {i.apto_operar ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
              {i.apto_operar ? 'Apto para operar' : 'No apto para operar'}
            </span>
            {i.reporte_mantenimiento && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                <Wrench size={11} /> Mantenimiento reportado
              </span>
            )}
          </div>

          {/* General */}
          <Section title="General">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Campo label="Vehículo" value={i.vehiculo?.placa_vehiculo ?? i.placa_vehiculo} />
              <Campo label="Conductor" value={i.conductor?.nombre_conductor} />
              <Campo label="Kilometraje" value={i.kilometraje?.toLocaleString() + ' km'} />
              <Campo label="Fecha" value={fmt(i.fecha)} />
              <Campo label="Hora" value={i.hora ? (() => { const d = new Date(i.hora!); return isNaN(d.getTime()) ? String(i.hora).slice(0, 5) : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) })() : null} />
            </div>
          </Section>

          {/* Motor y fluidos */}
          <Section title="Motor y fluidos">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Campo label="Estado motor" value={(i as any).estado_motor} />
              <Campo label="Nivel refrigerante" value={(i as any).nivel_refrigerante} />
              <Campo label="Nivel batería" value={(i as any).nivel_bateria} />
              <Campo label="Nivel aceite" value={(i as any).nivel_aceite} />
            </div>
          </Section>

          {/* Llantas y suspensión */}
          <Section title="Llantas y suspensión">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Campo label="Llantas delanteras" value={(i as any).estado_llantas_delanteras} />
              <Campo label="Llantas traseras" value={(i as any).estado_llantas_traseras} />
              <Campo label="Presión llantas" value={(i as any).presion_llantas} />
              <Campo label="Estado eje" value={(i as any).estado_eje} />
              <Campo label="Suspensión" value={(i as any).suspension} />
            </div>
          </Section>

          {/* Luces y controles */}
          <Section title="Luces y controles">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Bool label="Luces delanteras" value={(i as any).luces_delanteras} />
              <Bool label="Luces traseras" value={(i as any).luces_traseras} />
              <Bool label="Direccionales" value={(i as any).direccionales} />
              <Bool label="Luces freno" value={(i as any).luces_freno} />
              <Bool label="Luces reversa" value={(i as any).luces_reversa} />
              <Bool label="Bocina" value={(i as any).bocina} />
              <Bool label="Tablero" value={(i as any).tablero} />
              <Bool label="Cinturones" value={(i as any).cinturones} />
              <Campo label="Frenos" value={(i as any).frenos} />
            </div>
          </Section>

          {/* Equipamiento */}
          <Section title="Equipamiento y carrocería">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Campo label="Extintor" value={(i as any).extintor} />
              <Campo label="Botiquín" value={(i as any).botiquin} />
              <Campo label="Kit carretera" value={(i as any).kit_carretera} />
              <Campo label="Limpieza" value={(i as any).limpieza} />
              <Campo label="Carrocería" value={(i as any).carroceria} />
              <Campo label="Vidrios" value={(i as any).vidrios} />
              <Campo label="Espejos" value={(i as any).espejos} />
            </div>
          </Section>

          {(i as any).observaciones && (
            <Section title="Observaciones">
              <p className="text-sm text-slate-700">{(i as any).observaciones}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminInspecciones() {
  const { data: vehiculos = [] } = useVehiculos()
  const [vehiculoId, setVehiculoId] = useState('')
  const [tipo, setTipo] = useState('')
  const [selected, setSelected] = useState<Inspeccion | null>(null)

  const params: Record<string, string> = {}
  if (vehiculoId) params.vehiculo_id = vehiculoId
  if (tipo) params.tipo = tipo

  const { data: inspecciones = [], isLoading } = useQuery({
    queryKey: ['inspecciones', params],
    queryFn: () => inspeccionesApi.list(params),
  })

  const columns: Column<Inspeccion>[] = [
    { key: 'fecha', header: 'Fecha y hora', render: i => {
      const fmtH = (t: any) => { const d = new Date(t); return isNaN(d.getTime()) ? String(t).slice(0, 5) : d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }
      return <span>{new Date(i.fecha).toLocaleDateString('es-CO')}{i.hora && <span className="text-slate-400 ml-1">{fmtH(i.hora)}</span>}</span>
    }},
    { key: 'vehiculo', header: 'Vehículo', render: i => i.vehiculo?.placa_vehiculo ?? i.placa_vehiculo },
    { key: 'conductor', header: 'Conductor', render: i => i.conductor?.nombre_conductor ?? `#${i.id_conductor}` },
    { key: 'tipo_inspeccion', header: 'Tipo', render: i => (
      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
        i.tipo_inspeccion === 'PREOPERACIONAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
      }`}>{i.tipo_inspeccion}</span>
    )},
    { key: 'kilometraje', header: 'Km', render: i => i.kilometraje?.toLocaleString() },
    { key: 'apto_operar', header: 'Apto', render: i => (
      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
        i.apto_operar ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>{i.apto_operar ? 'Sí' : 'No'}</span>
    )},
    { key: 'reporte_mantenimiento', header: 'Mant.', render: i => i.reporte_mantenimiento
      ? <span className="text-xs font-semibold text-amber-600">Reportado</span>
      : <span className="text-xs text-slate-400">—</span>
    },
  ]

  return (
    <div className="space-y-5">
      {selected && <DetalleModal i={selected} onClose={() => setSelected(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CheckSquare size={20} className="text-blue-600" /> Inspecciones
          </h1>
          <p className="text-sm text-slate-500">{inspecciones.length} registros</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-slate-400" />
          <select value={vehiculoId} onChange={e => setVehiculoId(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los vehículos</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo}</option>)}
          </select>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Todos los tipos</option>
            <option value="PREOPERACIONAL">Preoperacional</option>
            <option value="POSTOPERACIONAL">Postoperacional</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={inspecciones} keyField="id" loading={isLoading}
        emptyMessage="Sin inspecciones para los filtros seleccionados"
        onRowClick={setSelected} />
    </div>
  )
}
