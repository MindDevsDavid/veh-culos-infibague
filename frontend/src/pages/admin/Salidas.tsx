import { useState } from 'react'
import { Eye, Trash2, Filter } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { salidasApi } from '../../api/salidas'
import { useSalidas } from '../../hooks/useSalidas'
import type { SalidaVehiculo } from '../../types'

const ESTADOS = ['', 'PENDIENTE', 'AUTORIZADA', 'RECHAZADA', 'EN_CURSO', 'RETORNANDO', 'COMPLETADA', 'CANCELADA']

export default function AdminSalidas() {
  const [estadoFilter, setEstadoFilter] = useState('')
  const { data: salidas = [], isLoading } = useSalidas(estadoFilter ? { estado: estadoFilter } : undefined)
  const qc = useQueryClient()
  const del_ = useMutation({ mutationFn: salidasApi.remove, onSuccess: () => { qc.invalidateQueries({ queryKey: ['salidas'] }); toast.success('Eliminada') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [detalle, setDetalle] = useState<SalidaVehiculo | null>(null)

  const columns: Column<SalidaVehiculo>[] = [
    { key: 'placa_vehiculo', header: 'Placa', render: s => <span className="font-mono font-medium">{s.placa_vehiculo}</span> },
    { key: 'conductor', header: 'Conductor', render: s => (s as any).conductor?.nombre_conductor ?? `#${s.id_conductor}` },
    { key: 'lugar_destino', header: 'Destino' },
    { key: 'fecha_salida', header: 'Fecha', render: s => s.fecha_salida ? new Date(s.fecha_salida).toLocaleDateString('es-CO') : '' },
    { key: 'hora_salida', header: 'Hora salida', render: s => s.hora_salida ? new Date(s.hora_salida).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'hora_entrada', header: 'Hora entrada', render: s => s.hora_entrada ? new Date(s.hora_entrada).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'estado', header: 'Estado', render: s => <StatusBadge value={s.estado} map={MAPS.ESTADO_SALIDA} /> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Salidas de Vehículos</h1>
          <p className="text-sm text-slate-500">{salidas.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400" />
          <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={salidas} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar placa, conductor, destino..."
        searchFilter={(s, q) => [s.placa_vehiculo, (s as any).conductor?.nombre_conductor ?? '', s.lugar_destino].join(' ').toLowerCase().includes(q.toLowerCase())}
        actions={s => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setDetalle(s)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Eye size={15} /></button>
            <button onClick={async () => { if (confirm('¿Eliminar esta salida?')) await del_.mutateAsync(s.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={detalle !== null} onClose={() => setDetalle(null)} title="Detalle de Salida" size="lg">
        {detalle && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div><span className="text-slate-500">Placa:</span> <span className="font-mono font-medium ml-1">{detalle.placa_vehiculo}</span></div>
              <div><span className="text-slate-500">Estado:</span> <span className="ml-1"><StatusBadge value={detalle.estado} map={MAPS.ESTADO_SALIDA} /></span></div>
              <div><span className="text-slate-500">Conductor:</span> <span className="ml-1">{(detalle as any).conductor?.nombre_conductor ?? `#${detalle.id_conductor}`}</span></div>
              <div><span className="text-slate-500">Destino:</span> <span className="ml-1">{detalle.lugar_destino}</span></div>
              <div><span className="text-slate-500">Motivo:</span> <span className="ml-1">{detalle.motivo_salida}</span></div>
              <div><span className="text-slate-500">Km salida:</span> <span className="ml-1">{detalle.kilometraje_salida?.toLocaleString()}</span></div>
              <div><span className="text-slate-500">Hora salida:</span> <span className="ml-1">{detalle.hora_salida ? new Date(detalle.hora_salida).toLocaleString('es-CO') : '—'}</span></div>
              <div><span className="text-slate-500">Hora entrada:</span> <span className="ml-1">{detalle.hora_entrada ? new Date(detalle.hora_entrada).toLocaleString('es-CO') : '—'}</span></div>
              {detalle.motivo_rechazo && <div className="col-span-full"><span className="text-red-600">Motivo rechazo:</span> <span className="ml-1">{detalle.motivo_rechazo}</span></div>}
              {detalle.observaciones && <div className="col-span-full"><span className="text-slate-500">Observaciones:</span> <span className="ml-1">{detalle.observaciones}</span></div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
