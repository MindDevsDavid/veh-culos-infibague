import { useState } from 'react'
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { mantenimientoApi } from '../../api/mantenimiento'
import type { Mantenimiento } from '../../api/mantenimiento'
import { useVehiculos } from '../../hooks/useVehiculos'

const empty = {
  id_vehiculo: '', tipo_mantenimiento: 'PREVENTIVO', descripcion: '', fecha_ingreso: '',
  kilometraje_ingreso: '', proveedor_taller: '', observacion_ingreso: '',
  fecha_salida: '', kilometraje_salida: '', observacion_salida: '',
  fecha_factura: '', numero_factura: '', valor_factura: '',
}
type FormState = typeof empty

export default function AdminMantenimiento() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery({ queryKey: ['mantenimiento'], queryFn: () => mantenimientoApi.list() })
  const { data: vehiculos = [] } = useVehiculos()

  const create = useMutation({ mutationFn: mantenimientoApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ['mantenimiento'] }); qc.invalidateQueries({ queryKey: ['vehiculos'] }); toast.success('Mantenimiento registrado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const upd    = useMutation({ mutationFn: ({ id, data }: { id: number; data: unknown }) => mantenimientoApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['mantenimiento'] }); qc.invalidateQueries({ queryKey: ['vehiculos'] }); toast.success('Mantenimiento actualizado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const del_   = useMutation({ mutationFn: mantenimientoApi.remove, onSuccess: () => { qc.invalidateQueries({ queryKey: ['mantenimiento'] }); toast.success('Eliminado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Mantenimiento | null>(null)
  const [form, setForm] = useState<FormState>(empty)

  function openCreate() { setForm(empty); setEditing(null); setModal('create') }
  function openEdit(m: Mantenimiento) {
    setEditing(m)
    setForm({
      id_vehiculo: String(m.id_vehiculo), tipo_mantenimiento: m.tipo_mantenimiento,
      descripcion: m.descripcion, fecha_ingreso: m.fecha_ingreso?.slice(0,10) ?? '',
      kilometraje_ingreso: String(m.kilometraje_ingreso ?? ''), proveedor_taller: m.proveedor_taller ?? '',
      observacion_ingreso: m.observacion_ingreso ?? '',
      fecha_salida: m.fecha_salida?.slice(0,10) ?? '', kilometraje_salida: String(m.kilometraje_salida ?? ''),
      observacion_salida: m.observacion_salida ?? '', fecha_factura: m.fecha_factura?.slice(0,10) ?? '',
      numero_factura: m.numero_factura ?? '', valor_factura: String(m.valor_factura ?? ''),
    })
    setModal('edit')
  }

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      id_vehiculo: Number(form.id_vehiculo),
      kilometraje_ingreso: form.kilometraje_ingreso ? Number(form.kilometraje_ingreso) : undefined,
      kilometraje_salida: form.kilometraje_salida ? Number(form.kilometraje_salida) : undefined,
      valor_factura: form.valor_factura ? Number(form.valor_factura) : undefined,
    }
    try {
      if (modal === 'create') await create.mutateAsync(payload)
      else await upd.mutateAsync({ id: editing!.id, data: payload })
      setModal(null)
    } catch { /* toast */ }
  }

  const columns: Column<Mantenimiento>[] = [
    { key: 'vehiculo', header: 'Vehículo', render: m => m.vehiculo?.placa_vehiculo ?? `#${m.id_vehiculo}` },
    { key: 'tipo_mantenimiento', header: 'Tipo', render: m => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.tipo_mantenimiento === 'PREVENTIVO' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
        {m.tipo_mantenimiento}
      </span>
    )},
    { key: 'descripcion', header: 'Descripción' },
    { key: 'fecha_ingreso', header: 'Ingreso', render: m => m.fecha_ingreso ? new Date(m.fecha_ingreso).toLocaleDateString('es-CO') : '' },
    { key: 'proveedor_taller', header: 'Taller', render: m => m.proveedor_taller ?? '' },
    { key: 'fecha_salida', header: 'Salida', render: m => m.fecha_salida ? (
      <span className="flex items-center gap-1 text-green-600"><CheckCircle size={13} />{new Date(m.fecha_salida).toLocaleDateString('es-CO')}</span>
    ) : <span className="text-amber-600 text-xs">En taller</span> },
  ]

  const isPending = create.isPending || upd.isPending

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mantenimiento</h1>
          <p className="text-sm text-slate-500">{items.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Nuevo mantenimiento
        </button>
      </div>

      <DataTable columns={columns} data={items} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar vehículo, taller..."
        searchFilter={(m, q) => [m.vehiculo?.placa_vehiculo ?? '', m.proveedor_taller ?? '', m.descripcion].join(' ').toLowerCase().includes(q.toLowerCase())}
        actions={m => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={15} /></button>
            <button onClick={async () => { if (confirm('¿Eliminar este registro?')) await del_.mutateAsync(m.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Mantenimiento' : 'Editar Mantenimiento'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField as="select" label="Vehículo" required value={form.id_vehiculo} onChange={set('id_vehiculo')}>
              <option value="">Seleccionar...</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
            </FormField>
            <FormField as="select" label="Tipo" value={form.tipo_mantenimiento} onChange={set('tipo_mantenimiento')}>
              <option value="PREVENTIVO">Preventivo</option>
              <option value="CORRECTIVO">Correctivo</option>
            </FormField>
          </div>
          <FormField label="Descripción" required value={form.descripcion} onChange={set('descripcion')} />
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha ingreso" type="date" required value={form.fecha_ingreso} onChange={set('fecha_ingreso')} />
            <FormField label="Km ingreso" type="number" value={form.kilometraje_ingreso} onChange={set('kilometraje_ingreso')} />
            <FormField label="Taller / Proveedor" value={form.proveedor_taller} onChange={set('proveedor_taller')} />
            <FormField label="Observación ingreso" value={form.observacion_ingreso} onChange={set('observacion_ingreso')} />
          </div>
          <hr className="border-slate-100" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Salida del taller (completar al terminar)</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Fecha salida" type="date" value={form.fecha_salida} onChange={set('fecha_salida')} />
            <FormField label="Km salida" type="number" value={form.kilometraje_salida} onChange={set('kilometraje_salida')} />
            <FormField label="Observación salida" value={form.observacion_salida} onChange={set('observacion_salida')} />
            <FormField label="No. factura" value={form.numero_factura} onChange={set('numero_factura')} />
            <FormField label="Fecha factura" type="date" value={form.fecha_factura} onChange={set('fecha_factura')} />
            <FormField label="Valor factura ($)" type="number" value={form.valor_factura} onChange={set('valor_factura')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
