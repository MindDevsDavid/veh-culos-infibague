import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import api from '../../api/client'
import { useVehiculos } from '../../hooks/useVehiculos'
import { useTiposComponente } from '../../hooks/useCatalogos'
import type { TipoComponente } from '../../api/catalogos'

interface ControlComponente {
  id: number
  id_vehiculo: number
  id_tipo_componente: number
  tipo_componente?: TipoComponente | null
  vehiculo?: { id: number; placa_vehiculo: string; linea: string } | null
}

function VehiculoComponentes({ placa, linea, items, onDelete }: {
  placa: string; linea: string
  items: ControlComponente[]
  onDelete: (id: number) => void
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
          <span className="font-mono font-semibold text-slate-800">{placa}</span>
          <span className="text-sm text-slate-500">{linea}</span>
        </div>
        <span className="text-xs text-slate-400">{items.length} componente(s)</span>
      </button>
      {open && (
        <div className="divide-y divide-slate-100 bg-white">
          {items.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <span className="text-sm font-medium text-slate-800">{c.tipo_componente?.nombre_componente ?? `#${c.id_tipo_componente}`}</span>
                {c.tipo_componente?.descripcion_componente && (
                  <p className="text-xs text-slate-400 mt-0.5">{c.tipo_componente.descripcion_componente}</p>
                )}
              </div>
              <button
                onClick={() => { if (confirm('¿Desasignar componente?')) onDelete(c.id) }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              ><Trash2 size={14} /></button>
            </div>
          ))}
          {items.length === 0 && <p className="px-4 py-3 text-sm text-slate-400 italic">Sin componentes.</p>}
        </div>
      )}
    </div>
  )
}

export default function AdminComponentes() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery<ControlComponente[]>({
    queryKey: ['ctrl-componentes'],
    queryFn: () => api.get('/componentes').then(r => r.data),
  })
  const { data: vehiculos = [] } = useVehiculos()
  const { data: tipos = [] } = useTiposComponente()

  const create = useMutation({
    mutationFn: (d: object) => api.post('/componentes', d).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ctrl-componentes'] }); toast.success('Componente asignado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error'),
  })
  const del_ = useMutation({
    mutationFn: (id: number) => api.delete(`/componentes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ctrl-componentes'] }); toast.success('Eliminado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error'),
  })

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ id_vehiculo: '', id_tipo_componente: '' })

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await create.mutateAsync({ id_vehiculo: Number(form.id_vehiculo), id_tipo_componente: Number(form.id_tipo_componente) })
      setModal(false)
      setForm({ id_vehiculo: '', id_tipo_componente: '' })
    } catch { /* toast */ }
  }

  const byVehiculo = vehiculos
    .map(v => ({ v, comps: items.filter(c => c.id_vehiculo === v.id) }))
    .filter(({ comps }) => comps.length > 0)

  const sinAsignar = items.filter(c => !c.vehiculo)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Control Componentes</h1>
          <p className="text-sm text-slate-500">{items.length} componentes asignados · {byVehiculo.length} vehículos</p>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Asignar componente
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-400">Cargando...</p>}

      {!isLoading && items.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          No hay componentes asignados.
        </div>
      )}

      <div className="space-y-3">
        {byVehiculo.map(({ v, comps }) => (
          <VehiculoComponentes
            key={v.id}
            placa={v.placa_vehiculo}
            linea={v.linea}
            items={comps}
            onDelete={id => del_.mutate(id)}
          />
        ))}
        {sinAsignar.length > 0 && (
          <VehiculoComponentes
            placa="Sin vehículo"
            linea=""
            items={sinAsignar}
            onDelete={id => del_.mutate(id)}
          />
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Asignar Componente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField as="select" label="Vehículo" required value={form.id_vehiculo} onChange={set('id_vehiculo')}>
            <option value="">Seleccionar...</option>
            {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
          </FormField>
          <FormField as="select" label="Tipo de componente" required value={form.id_tipo_componente} onChange={set('id_tipo_componente')}>
            <option value="">Seleccionar...</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre_componente}</option>)}
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
