import { useState } from 'react'
import { Plus, Pencil, Trash2, FileText, AlertTriangle, ExternalLink } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import { requisitosApi } from '../../api/requisitos'
import type { ControlRequisito } from '../../types'
import { useVehiculos } from '../../hooks/useVehiculos'
import { useTiposRequisito } from '../../hooks/useCatalogos'

const empty = {
  id_vehiculo: '', id_tipo_requisito: '', numero_requisito: '', empresa_expide: '',
  fecha_expedicion: '', fecha_vencimiento: '', observacion: '',
}

export default function AdminRequisitos() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['requisitos'], queryFn: () => requisitosApi.list() })
  const { data: vehiculos = [] } = useVehiculos()
  const { data: tipos = [] } = useTiposRequisito()

  const create = useMutation({
    mutationFn: (f: FormData) => requisitosApi.create(f),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['requisitos'] }); toast.success('Requisito registrado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error'),
  })
  const del_ = useMutation({
    mutationFn: requisitosApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['requisitos'] }); toast.success('Eliminado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error'),
  })

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [archivo, setArchivo] = useState<File | null>(null)

  function set(k: keyof typeof empty) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (archivo) fd.append('archivo', archivo)
    try {
      await create.mutateAsync(fd)
      setModal(false)
      setForm(empty)
      setArchivo(null)
    } catch { /* toast */ }
  }

  const hoy = new Date()
  const en30 = new Date(); en30.setDate(hoy.getDate() + 30)

  const vencidos = items.filter(r => r.estado_requisito === 'VENCIDO').length
  const proximos = items.filter(r => r.estado_requisito === 'VIGENTE' && new Date(r.fecha_vencimiento) <= en30).length

  const columns: Column<ControlRequisito>[] = [
    { key: 'tipo_requisito', header: 'Tipo', render: r => r.tipo_requisito?.descripcion ?? '' },
    { key: 'id_vehiculo', header: 'Vehículo', render: r => vehiculos.find(v => v.id === r.id_vehiculo)?.placa_vehiculo ?? `#${r.id_vehiculo}` },
    { key: 'numero_requisito', header: 'Número' },
    { key: 'empresa_expide', header: 'Entidad' },
    { key: 'fecha_vencimiento', header: 'Vencimiento', render: r => {
      const v = new Date(r.fecha_vencimiento)
      const vencido = v < hoy
      const proximo = !vencido && v <= en30
      return (
        <span className={vencido ? 'text-red-600 font-medium' : proximo ? 'text-amber-600 font-medium' : ''}>
          {v.toLocaleDateString('es-CO')}
          {(vencido || proximo) && <AlertTriangle size={12} className="inline ml-1" />}
        </span>
      )
    }},
    { key: 'estado_requisito', header: 'Estado', render: r => <StatusBadge value={r.estado_requisito} map={MAPS.ESTADO_REQUISITO} /> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Requisitos / Documentos</h1>
          <p className="text-sm text-slate-500">{items.length} documentos registrados</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Nuevo documento
        </button>
      </div>

      {vencidos > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-800">
          <AlertTriangle size={16} className="shrink-0" />
          <strong>{vencidos} documento(s) vencido(s)</strong> — los vehículos afectados no pueden salir.
        </div>
      )}
      {proximos > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0" />
          <strong>{proximos} documento(s)</strong> vencen en los próximos 30 días.
        </div>
      )}

      <DataTable columns={columns} data={items} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar placa, tipo, número..."
        searchFilter={(r, q) => [r.tipo_requisito?.descripcion ?? '', r.numero_requisito, r.empresa_expide].join(' ').toLowerCase().includes(q.toLowerCase())}
        actions={r => (
          <div className="flex items-center justify-end gap-1">
            <a href={requisitosApi.archivoUrl(r.id)} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Ver documento">
              <ExternalLink size={15} />
            </a>
            <button onClick={async () => { if (confirm('¿Eliminar este documento?')) await del_.mutateAsync(r.id) }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo Documento" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField as="select" label="Vehículo" required value={form.id_vehiculo} onChange={set('id_vehiculo')}>
              <option value="">Seleccionar...</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
            </FormField>
            <FormField as="select" label="Tipo de documento" required value={form.id_tipo_requisito} onChange={set('id_tipo_requisito')}>
              <option value="">Seleccionar...</option>
              {tipos.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
            </FormField>
            <FormField label="Número" required value={form.numero_requisito} onChange={set('numero_requisito')} />
            <FormField label="Entidad que expide" required value={form.empresa_expide} onChange={set('empresa_expide')} />
            <FormField label="Fecha expedición" type="date" required value={form.fecha_expedicion} onChange={set('fecha_expedicion')} />
            <FormField label="Fecha vencimiento" type="date" required value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')} />
          </div>
          <FormField label="Observación" value={form.observacion} onChange={set('observacion')} />
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Archivo PDF</label>
            <input type="file" accept="application/pdf" onChange={e => setArchivo(e.target.files?.[0] ?? null)}
              className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={create.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {create.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
