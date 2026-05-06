import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import api from '../../api/client'
import { useVehiculos } from '../../hooks/useVehiculos'
import { useComponentes } from '../../hooks/useCatalogos'

interface ControlComponente { id: number; id_vehiculo: number; id_componente: number; placa: string; vehiculo?: { placa_vehiculo: string }; componente?: { descripcion: string } }

export default function AdminComponentes() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery<ControlComponente[]>({ queryKey: ['ctrl-componentes'], queryFn: () => api.get('/componentes').then(r => r.data) })
  const { data: vehiculos = [] } = useVehiculos()
  const { data: comps = [] } = useComponentes()

  const create = useMutation({ mutationFn: ({ vehiculoId, data }: { vehiculoId: number; data: unknown }) => api.post(`/componentes/${vehiculoId}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['ctrl-componentes'] }); toast.success('Componente asignado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const del_   = useMutation({ mutationFn: (id: number) => api.delete(`/componentes/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['ctrl-componentes'] }); toast.success('Eliminado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ id_vehiculo: '', id_componente: '' })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = vehiculos.find(v => v.id === Number(form.id_vehiculo))
    try {
      await create.mutateAsync({ vehiculoId: Number(form.id_vehiculo), data: { id_componente: Number(form.id_componente), placa: v?.placa_vehiculo ?? '' } })
      setModal(false)
    } catch { /* toast */ }
  }

  const columns: Column<ControlComponente>[] = [
    { key: 'vehiculo', header: 'Vehículo', render: c => c.vehiculo?.placa_vehiculo ?? `#${c.id_vehiculo}` },
    { key: 'componente', header: 'Componente', render: c => c.componente?.descripcion ?? `#${c.id_componente}` },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Control Componentes</h1>
          <p className="text-sm text-slate-500">Componentes instalados por vehículo</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Asignar componente
        </button>
      </div>

      <DataTable columns={columns} data={items} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar vehículo, componente..."
        searchFilter={(c, q) => [c.vehiculo?.placa_vehiculo ?? '', c.componente?.descripcion ?? ''].join(' ').toLowerCase().includes(q.toLowerCase())}
        actions={c => (
          <button onClick={async () => { if (confirm('¿Desasignar componente?')) await del_.mutateAsync(c.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Asignar Componente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField as="select" label="Vehículo" required value={form.id_vehiculo} onChange={set('id_vehiculo')}>
            <option value="">Seleccionar...</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
          </FormField>
          <FormField as="select" label="Componente" required value={form.id_componente} onChange={set('id_componente')}>
            <option value="">Seleccionar...</option>
            {comps.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={create.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Asignar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
