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
import { useConductores } from '../../hooks/useConductores'

interface Tanqueo {
  id: number; id_vehiculo: number; id_salida: number; placa_vehiculo: string
  fecha_tanqueo: string; tipo_combustible: string; cantidad_galones: number
  vehiculo?: { placa_vehiculo: string }; conductor?: { nombre_conductor: string }; autorizador?: { nombre: string }
}

const empty = { id_vehiculo: '', id_salida: '', placa_vehiculo: '', fecha_tanqueo: '', tipo_combustible: 'GASOLINA', cantidad_galones: '', id_conductor_tanqueo: '' }

export default function AdminTanqueos() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery<Tanqueo[]>({ queryKey: ['tanqueos'], queryFn: () => api.get('/tanqueos').then(r => r.data) })
  const { data: vehiculos = [] } = useVehiculos()
  const { data: conductores = [] } = useConductores()

  const create = useMutation({ mutationFn: (d: unknown) => api.post('/tanqueos', d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tanqueos'] }); toast.success('Tanqueo registrado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const del_   = useMutation({ mutationFn: (id: number) => api.delete(`/tanqueos/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['tanqueos'] }); toast.success('Eliminado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)

  function set(k: keyof typeof empty) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  function onVehiculoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = vehiculos.find(v => v.id === Number(e.target.value))
    setForm(f => ({ ...f, id_vehiculo: e.target.value, placa_vehiculo: v?.placa_vehiculo ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync({ ...form, id_vehiculo: Number(form.id_vehiculo), id_salida: Number(form.id_salida), cantidad_galones: Number(form.cantidad_galones), id_conductor_tanqueo: form.id_conductor_tanqueo ? Number(form.id_conductor_tanqueo) : undefined })
      setModal(false); setForm(empty)
    } catch { /* toast */ }
  }

  const columns: Column<Tanqueo>[] = [
    { key: 'vehiculo', header: 'Vehículo', render: t => t.vehiculo?.placa_vehiculo ?? t.placa_vehiculo },
    { key: 'fecha_tanqueo', header: 'Fecha', render: t => new Date(t.fecha_tanqueo).toLocaleDateString('es-CO') },
    { key: 'tipo_combustible', header: 'Combustible' },
    { key: 'cantidad_galones', header: 'Galones', render: t => `${t.cantidad_galones} gal` },
    { key: 'conductor', header: 'Conductor', render: t => t.conductor?.nombre_conductor ?? '' },
    { key: 'autorizador', header: 'Autorizado por', render: t => t.autorizador?.nombre ?? '' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Tanqueos</h1>
          <p className="text-sm text-slate-500">{items.length} registros</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Registrar tanqueo
        </button>
      </div>

      <DataTable columns={columns} data={items} keyField="id" loading={isLoading}
        searchable searchPlaceholder="Buscar placa, conductor..."
        searchFilter={(t, q) => [t.vehiculo?.placa_vehiculo ?? t.placa_vehiculo, t.conductor?.nombre_conductor ?? ''].join(' ').toLowerCase().includes(q.toLowerCase())}
        actions={t => (
          <button onClick={async () => { if (confirm('¿Eliminar este tanqueo?')) await del_.mutateAsync(t.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title="Registrar Tanqueo" size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField as="select" label="Vehículo" required value={form.id_vehiculo} onChange={onVehiculoChange}>
            <option value="">Seleccionar...</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
          </FormField>
          <FormField label="ID Salida asociada" type="number" required value={form.id_salida} onChange={set('id_salida')} />
          <FormField label="Fecha tanqueo" type="date" value={form.fecha_tanqueo} onChange={set('fecha_tanqueo')} />
          <FormField as="select" label="Tipo combustible" value={form.tipo_combustible} onChange={set('tipo_combustible')}>
            {['GASOLINA','DIESEL','GAS'].map(c => <option key={c} value={c}>{c}</option>)}
          </FormField>
          <FormField label="Galones" type="number" required value={form.cantidad_galones} onChange={set('cantidad_galones')} />
          <FormField as="select" label="Conductor" value={form.id_conductor_tanqueo} onChange={set('id_conductor_tanqueo')}>
            <option value="">Seleccionar...</option>
            {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre_conductor}</option>)}
          </FormField>
          <div className="col-span-full flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={create.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
