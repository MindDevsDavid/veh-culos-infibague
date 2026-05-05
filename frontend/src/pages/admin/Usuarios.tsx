import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { usuariosApi } from '../../api/usuarios'
import type { Usuario } from '../../api/usuarios'
import type { Rol } from '../../types'

const ROLES: Rol[] = ['ADMIN', 'CONDUCTOR', 'AUTORIZADOR', 'VIGILANTE', 'CONSULTAS']
const ROL_LABEL: Record<Rol, string> = { ADMIN: 'Administrador', CONDUCTOR: 'Conductor', AUTORIZADOR: 'Autorizador', VIGILANTE: 'Vigilante', CONSULTAS: 'Consultas' }

const empty = { nombre: '', email: '', password: '', rol: 'CONDUCTOR' as Rol, activo: 'true' }
type FormState = typeof empty

export default function AdminUsuarios() {
  const qc = useQueryClient()
  const { data: usuarios = [], isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.list })

  const create = useMutation({ mutationFn: usuariosApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario creado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const upd    = useMutation({ mutationFn: ({ id, data }: { id: number; data: unknown }) => usuariosApi.update(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario actualizado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })
  const del_   = useMutation({ mutationFn: usuariosApi.remove, onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuario desactivado') }, onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error') })

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<FormState>(empty)

  function openCreate() { setForm(empty); setEditing(null); setModal('create') }
  function openEdit(u: Usuario) {
    setEditing(u)
    setForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, activo: String(u.activo) })
    setModal('edit')
  }

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Record<string, unknown> = { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo === 'true' }
    if (form.password) payload.password = form.password
    try {
      if (modal === 'create') await create.mutateAsync(payload)
      else await upd.mutateAsync({ id: editing!.id, data: payload })
      setModal(null)
    } catch { /* toast shown */ }
  }

  const columns: Column<Usuario>[] = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'email', header: 'Correo' },
    { key: 'rol', header: 'Rol', render: u => <span className="text-xs font-semibold">{ROL_LABEL[u.rol]}</span> },
    { key: 'activo', header: 'Estado', render: u => (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
        {u.activo ? 'Activo' : 'Inactivo'}
      </span>
    )},
  ]

  const isPending = create.isPending || upd.isPending

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-500">{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <DataTable
        columns={columns} data={usuarios} keyField="id"
        searchable searchPlaceholder="Buscar nombre, correo..."
        searchFilter={(u, q) => [u.nombre, u.email].join(' ').toLowerCase().includes(q.toLowerCase())}
        loading={isLoading}
        actions={u => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={15} /></button>
            {u.activo && (
              <button onClick={async () => { if (confirm(`¿Desactivar a ${u.nombre}?`)) await del_.mutateAsync(u.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
            )}
          </div>
        )}
      />

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nombre completo" required value={form.nombre} onChange={set('nombre')} />
          <FormField label="Correo electrónico" type="email" required value={form.email} onChange={set('email')} />
          <FormField label={modal === 'create' ? 'Contraseña' : 'Nueva contraseña (dejar en blanco para no cambiar)'} type="password" required={modal === 'create'} value={form.password} onChange={set('password')} placeholder={modal === 'edit' ? 'Sin cambios' : ''} />
          <FormField as="select" label="Rol" value={form.rol} onChange={set('rol')}>
            {ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </FormField>
          {modal === 'edit' && (
            <FormField as="select" label="Estado" value={form.activo} onChange={set('activo')}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </FormField>
          )}
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
