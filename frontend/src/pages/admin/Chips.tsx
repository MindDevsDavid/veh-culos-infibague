import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import api from '../../api/client'
import { useVehiculos } from '../../hooks/useVehiculos'

interface Chip {
  id: number
  numero_chip: string
  estado_chip: string
  estado: string
  id_vehiculo: number | null
  vehiculo?: { id: number; placa_vehiculo: string; linea: string } | null
}

const empty = { numero_chip: '', id_vehiculo: '', estado: 'VIGENTE' }

export default function AdminChips() {
  const qc = useQueryClient()
  const { data: chips = [], isLoading } = useQuery<Chip[]>({ queryKey: ['chips'], queryFn: () => api.get('/chips').then(r => r.data) })
  const { data: vehiculos = [] } = useVehiculos()

  const create = useMutation({ mutationFn: (d: unknown) => api.post('/chips', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['chips'] }); toast.success('Chip creado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const upd    = useMutation({ mutationFn: ({ id, data }: { id: number; data: unknown }) => api.put(`/chips/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['chips'] }); toast.success('Chip actualizado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const del_   = useMutation({ mutationFn: (id: number) => api.delete(`/chips/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['chips'] }); toast.success('Eliminado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Chip | null>(null)
  const [form, setForm] = useState(empty)

  function openCreate() { setForm(empty); setEditing(null); setModal('create') }
  function openEdit(c: Chip) {
    setEditing(c)
    setForm({ numero_chip: c.numero_chip, id_vehiculo: c.id_vehiculo ? String(c.id_vehiculo) : '', estado: c.estado ?? 'VIGENTE' })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { numero_chip: form.numero_chip, id_vehiculo: form.id_vehiculo ? Number(form.id_vehiculo) : null, estado: form.estado }
    try {
      if (modal === 'create') await create.mutateAsync(payload)
      else await upd.mutateAsync({ id: editing!.id, data: payload })
      setModal(null)
    } catch { /* toast */ }
  }

  const columns: Column<Chip>[] = [
    { key: 'numero_chip', header: 'Número chip', render: c => <span className="font-mono">{c.numero_chip}</span> },
    { key: 'vehiculo', header: 'Vehículo', render: c => c.vehiculo
      ? <span className="font-mono font-medium">{c.vehiculo.placa_vehiculo} <span className="font-normal text-slate-500">{c.vehiculo.linea}</span></span>
      : <span className="text-slate-400">—</span>
    },
    { key: 'estado_chip', header: 'Instalación', render: c => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.estado_chip === 'INSTALADO' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
        {c.estado_chip === 'INSTALADO' ? 'Instalado' : 'No instalado'}
      </span>
    )},
    { key: 'estado', header: 'Vigencia', render: c => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.estado === 'VIGENTE' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
        {c.estado === 'VIGENTE' ? 'Vigente' : 'Vencido'}
      </span>
    )},
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Chip Gasolina</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Nuevo chip
        </button>
      </div>

      <DataTable columns={columns} data={chips} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar número, placa..."
        searchFilter={(c, q) => [c.numero_chip, c.vehiculo?.placa_vehiculo ?? ''].join(' ').toLowerCase().includes(q.toLowerCase())}
        actions={c => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={15} /></button>
            <button onClick={async () => { if (confirm('¿Eliminar chip?')) await del_.mutateAsync(c.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Chip' : 'Editar Chip'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Número de chip" required value={form.numero_chip}
            onChange={e => setForm(f => ({ ...f, numero_chip: e.target.value }))} />
          <FormField as="select" label="Vehículo asignado" value={form.id_vehiculo}
            onChange={e => setForm(f => ({ ...f, id_vehiculo: e.target.value }))}>
            <option value="">Sin asignar (No instalado)</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
          </FormField>
          <FormField as="select" label="Vigencia" value={form.estado}
            onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
            <option value="VIGENTE">Vigente</option>
            <option value="VENCIDO">Vencido</option>
          </FormField>
          <p className="text-xs text-slate-500">
            Instalación se determina automáticamente: con vehículo = <strong>Instalado</strong>, sin vehículo = <strong>No instalado</strong>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={create.isPending || upd.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
