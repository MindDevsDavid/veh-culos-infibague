import { useState } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { useSalidas, useAutorizarSalida, useRechazarSalida } from '../../hooks/useSalidas'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import type { SalidaVehiculo } from '../../types'

export default function AutorizadorPendientes() {
  const { data: salidas = [], isLoading } = useSalidas({ estado: 'PENDIENTE' })
  const autorizar = useAutorizarSalida()
  const rechazar  = useRechazarSalida()

  const [detalle, setDetalle] = useState<SalidaVehiculo | null>(null)
  const [motivoModal, setMotivoModal] = useState<{ id: number } | null>(null)
  const [motivo, setMotivo] = useState('')

  async function handleRechazar() {
    if (!motivo.trim()) return
    await rechazar.mutateAsync({ id: motivoModal!.id, motivo })
    setMotivoModal(null)
    setMotivo('')
  }

  const columns: Column<SalidaVehiculo>[] = [
    { key: 'placa_vehiculo', header: 'Placa', render: s => <span className="font-mono font-medium">{s.placa_vehiculo}</span> },
    { key: 'conductor', header: 'Conductor', render: s => (s as any).conductor?.nombre_conductor ?? `#${s.id_conductor}` },
    { key: 'lugar_destino', header: 'Destino' },
    { key: 'motivo_salida', header: 'Motivo', render: s => <span className="text-slate-500 block">{s.motivo_salida}</span> },
    { key: 'fecha_salida', header: 'Fecha solicitada', render: s => s.fecha_salida ? new Date(s.fecha_salida).toLocaleDateString('es-CO') : '' },
    { key: 'estado', header: 'Estado', render: s => <StatusBadge value={s.estado} map={MAPS.ESTADO_SALIDA} /> },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Solicitudes Pendientes</h1>
        <p className="text-sm text-slate-500">{salidas.length} solicitudes por gestionar</p>
      </div>

      {salidas.length === 0 && !isLoading && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-8 text-center text-green-700 text-sm">
          Sin solicitudes pendientes. Todo está al día.
        </div>
      )}

      <DataTable columns={columns} data={salidas} keyField="id" loading={isLoading}
        actions={s => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setDetalle(s)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100" title="Ver detalle"><Eye size={15} /></button>
            <button onClick={() => autorizar.mutate(s.id)} disabled={autorizar.isPending} className="p-1.5 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-600" title="Autorizar"><CheckCircle size={15} /></button>
            <button onClick={() => { setMotivoModal({ id: s.id }); setMotivo('') }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600" title="Rechazar"><XCircle size={15} /></button>
          </div>
        )}
      />

      <Modal open={detalle !== null} onClose={() => setDetalle(null)} title="Detalle de Solicitud" size="lg">
        {detalle && (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div><span className="text-slate-500">Placa:</span> <span className="font-mono font-medium ml-1">{detalle.placa_vehiculo}</span></div>
              <div><span className="text-slate-500">Conductor:</span> <span className="ml-1">{(detalle as any).conductor?.nombre_conductor}</span></div>
              <div><span className="text-slate-500">Destino:</span> <span className="ml-1">{detalle.lugar_destino}</span></div>
              <div><span className="text-slate-500">Km salida:</span> <span className="ml-1">{detalle.kilometraje_salida?.toLocaleString()}</span></div>
              <div className="col-span-full"><span className="text-slate-500">Motivo:</span> <span className="ml-1">{detalle.motivo_salida}</span></div>
              {detalle.observaciones && <div className="col-span-full"><span className="text-slate-500">Observaciones:</span> <span className="ml-1">{detalle.observaciones}</span></div>}
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={() => { autorizar.mutate(detalle.id); setDetalle(null) }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                <CheckCircle size={15} /> Autorizar
              </button>
              <button onClick={() => { setDetalle(null); setMotivoModal({ id: detalle.id }); setMotivo('') }} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
                <XCircle size={15} /> Rechazar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={motivoModal !== null} onClose={() => setMotivoModal(null)} title="Motivo de Rechazo">
        <div className="space-y-4">
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Explique el motivo del rechazo..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          <div className="flex justify-end gap-3">
            <button onClick={() => setMotivoModal(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleRechazar} disabled={!motivo.trim() || rechazar.isPending} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60">Confirmar rechazo</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
