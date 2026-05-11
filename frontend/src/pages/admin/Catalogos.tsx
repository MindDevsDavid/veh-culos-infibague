import { useState } from 'react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/client'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'

interface Item { id: number; descripcion: string }
interface DepItem extends Item { id_dependencia_ig?: number | null }

const TABS = ['Marcas', 'Colores', 'Tipos Vehículo', 'Tipos Requisito', 'Dependencias'] as const
type Tab = typeof TABS[number]

const TAB_KEY: Record<Tab, string> = {
  'Marcas':          'marcas',
  'Colores':         'colores',
  'Tipos Vehículo':  'tiposVehiculo',
  'Tipos Requisito': 'tiposRequisito',
  'Dependencias':    'dependencias',
}

const TAB_PATH: Record<Tab, string> = {
  'Marcas':          '/catalogos/marcas',
  'Colores':         '/catalogos/colores',
  'Tipos Vehículo':  '/catalogos/tipos-vehiculo',
  'Tipos Requisito': '/catalogos/tipos-requisito',
  'Dependencias':    '/catalogos/dependencias',
}

function CatalogoSection({ tab }: { tab: Tab }) {
  const qc = useQueryClient()
  const path = TAB_PATH[tab]
  const qKey = TAB_KEY[tab]
  const isDep = tab === 'Dependencias'

  const { data: items = [], isLoading } = useQuery<DepItem[]>({
    queryKey: [qKey],
    queryFn: () => api.get(path).then(r => r.data),
  })

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<DepItem | null>(null)
  const [desc, setDesc] = useState('')
  const [depIg, setDepIg] = useState('')

  function openCreate() { setEditing(null); setDesc(''); setDepIg(''); setModal('create') }
  function openEdit(item: DepItem) {
    setEditing(item)
    setDesc(item.descripcion)
    setDepIg(String(item.id_dependencia_ig ?? ''))
    setModal('edit')
  }

  const invalidate = () => qc.invalidateQueries({ queryKey: [qKey] })

  const create = useMutation({
    mutationFn: (payload: object) => api.post(path, payload).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Creado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error'),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: object }) => api.put(`${path}/${id}`, payload).then(r => r.data),
    onSuccess: () => { invalidate(); setModal(null); toast.success('Actualizado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`${path}/${id}`),
    onSuccess: () => { invalidate(); toast.success('Eliminado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'No se puede eliminar — está en uso'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim()) return
    const payload: Record<string, any> = { descripcion: desc.trim() }
    if (isDep) payload.id_dependencia_ig = depIg ? Number(depIg) : null
    if (modal === 'create') create.mutate(payload)
    else update.mutate({ id: editing!.id, payload })
  }

  const isPending = create.isPending || update.isPending

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{items.length} registros</span>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={14} /> Nuevo
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400 py-6 text-center">Cargando...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center italic">Sin registros.</p>
      ) : (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
              <div>
                <span className="text-sm font-medium text-slate-800">{item.descripcion}</span>
                {isDep && item.id_dependencia_ig && (
                  <span className="ml-2 text-xs text-slate-400">IG: {item.id_dependencia_ig}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                <button
                  onClick={() => { if (confirm(`¿Eliminar "${item.descripcion}"?`)) remove.mutate(item.id) }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                ><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? `Nuevo — ${tab}` : `Editar — ${tab}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Descripción" required value={desc} onChange={e => setDesc(e.target.value)} />
          {isDep && (
            <FormField label="ID Dependencia IG (opcional)" type="number" value={depIg} onChange={e => setDepIg(e.target.value)} />
          )}
          <div className="flex justify-end gap-3 pt-1">
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

export default function AdminCatalogos() {
  const [active, setActive] = useState<Tab>('Marcas')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Catálogos</h1>
        <p className="text-sm text-slate-500">Gestión de listas de referencia del sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                active === tab
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-5">
          <CatalogoSection key={active} tab={active} />
        </div>
      </div>
    </div>
  )
}
