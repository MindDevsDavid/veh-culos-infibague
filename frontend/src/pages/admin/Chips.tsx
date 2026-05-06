import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import api from '../../api/client'

interface Chip { id: number; numero_chip: string; estado_chip: string; estado: string }

const empty = { numero_chip: '', estado_chip: 'ACTIVO', estado: 'DISPONIBLE' }

export default function AdminChips() {
  const qc = useQueryClient()
  const { data: chips = [], isLoading } = useQuery<Chip[]>({ queryKey: ['chips'], queryFn: () => api.get('/chips').then(r => r.data) })
  const create = useMutation({ mutationFn: (d: unknown) => api.post('/chips', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['chips'] }); toast.success('Chip creado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const upd    = useMutation({ mutationFn: ({ id, data }: { id: number; data: unknown }) => api.put(`/chips/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['chips'] }); toast.success('Chip actualizado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const del_   = useMutation({ mutationFn: (id: number) => api.delete(`/chips/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['chips'] }); toast.success('Eliminado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Chip | null>(null)
  const [form, setForm] = useState(empty)

  function set(k: keyof typeof empty) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (modal === 'create') await create.mutateAsync(form)
      else await upd.mutateAsync({ id: editing!.id, data: form })
      setModal(null)
    } catch { /* toast */ }
  }

  const columns: Column<Chip>[] = [
    { key: 'numero_chip', header: 'Número chip', render: c => <span className="font-mono">{c.numero_chip}</span> },
    { key: 'estado_chip', header: 'Estado chip' },
    { key: 'estado', header: 'Disponibilidad', render: c => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
        {c.estado}
      </span>
    )},
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-800">Chips GPS</h1>
        <button onClick={() => { setForm(empty); setEditing(null); setModal('create') }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Nuevo chip
        </button>
      </div>

      <DataTable columns={columns} data={chips} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar número..."
        searchFilter={(c, q) => c.numero_chip.toLowerCase().includes(q.toLowerCase())}
        actions={c => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => { setEditing(c); setForm({ numero_chip: c.numero_chip, estado_chip: c.estado_chip, estado: c.estado }); setModal('edit') }} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={15} /></button>
            <button onClick={async () => { if (confirm('¿Eliminar chip?')) await del_.mutateAsync(c.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Chip' : 'Editar Chip'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Número de chip" required value={form.numero_chip} onChange={set('numero_chip')} />
          <FormField label="Estado chip" value={form.estado_chip} onChange={set('estado_chip')} />
          <FormField as="select" label="Disponibilidad" value={form.estado} onChange={set('estado')}>
            <option value="DISPONIBLE">Disponible</option>
            <option value="ASIGNADO">Asignado</option>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={create.isPending || upd.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
