import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import { useConductores, useCreateConductor, useUpdateConductor, useDeleteConductor } from '../../hooks/useConductores'
import { useDependencias } from '../../hooks/useCatalogos'
import type { Conductor } from '../../types'

const empty = {
  nombre_conductor: '', cedula_conductor: '', licencia_conduccion: '', categoria_licencia: '',
  fecha_vence_licencia: '', categoria_licencia_2: '', fecha_vence_licencia_2: '',
  categoria_licencia_3: '', fecha_vence_licencia_3: '',
  autorizacion_th: '', fecha_autorizacion_th: '', fecha_vence_th: '',
  telefono: '', id_dependencia_conductor: '',
  email: '', password: '', password_confirm: '',
}
type FormState = typeof empty

export default function AdminConductores() {
  const { data: conductores = [], isLoading } = useConductores()
  const { data: deps = [] } = useDependencias()
  const create = useCreateConductor()
  const update = useUpdateConductor()
  const remove = useDeleteConductor()

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Conductor | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [licenciasVisibles, setLicenciasVisibles] = useState(1)

  function openCreate() { setForm(empty); setEditing(null); setLicenciasVisibles(1); setModal('create') }
  function openEdit(c: Conductor) {
    setEditing(c)
    setLicenciasVisibles(c.categoria_licencia_3 ? 3 : (c.categoria_licencia_2 ? 2 : 1))
    setForm({
      nombre_conductor: c.nombre_conductor, cedula_conductor: c.cedula_conductor,
      licencia_conduccion: c.licencia_conduccion, categoria_licencia: c.categoria_licencia,
      fecha_vence_licencia: c.fecha_vence_licencia?.slice(0,10) ?? '',
      categoria_licencia_2: c.categoria_licencia_2 ?? '',
      fecha_vence_licencia_2: c.fecha_vence_licencia_2?.slice(0,10) ?? '',
      categoria_licencia_3: c.categoria_licencia_3 ?? '',
      fecha_vence_licencia_3: c.fecha_vence_licencia_3?.slice(0,10) ?? '',
      autorizacion_th: String(c.autorizacion_th ?? ''),
      fecha_autorizacion_th: c.fecha_autorizacion_th?.slice(0,10) ?? '',
      fecha_vence_th: c.fecha_vence_th?.slice(0,10) ?? '',
      telefono: String(c.telefono ?? ''), id_dependencia_conductor: String(c.id_dependencia_conductor),
    })
    setModal('edit')
  }

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (modal === 'create' && form.password !== form.password_confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    const { password_confirm, ...rest } = form
    const payload = {
      ...rest,
      categoria_licencia_2: licenciasVisibles >= 2 ? (form.categoria_licencia_2 || null) : null,
      fecha_vence_licencia_2: licenciasVisibles >= 2 ? (form.fecha_vence_licencia_2 || null) : null,
      categoria_licencia_3: licenciasVisibles >= 3 ? (form.categoria_licencia_3 || null) : null,
      fecha_vence_licencia_3: licenciasVisibles >= 3 ? (form.fecha_vence_licencia_3 || null) : null,
      autorizacion_th: form.autorizacion_th || null,
      telefono: form.telefono ? Number(form.telefono) : undefined,
      id_dependencia_conductor: Number(form.id_dependencia_conductor),
    }
    try {
      if (modal === 'create') await create.mutateAsync(payload)
      else await update.mutateAsync({ id: editing!.id, data: payload })
      setModal(null)
    } catch { /* toast shown by hook */ }
  }

  const hoy = new Date()
  const en30dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000)
  const vencidasLicencia = conductores.filter(c => c.fecha_vence_licencia && new Date(c.fecha_vence_licencia) < hoy)
  const proximasLicencia = conductores.filter(c => {
    if (!c.fecha_vence_licencia) return false
    const v = new Date(c.fecha_vence_licencia)
    return v >= hoy && v <= en30dias
  })

  const columns: Column<Conductor>[] = [
    { key: 'nombre_conductor', header: 'Nombre' },
    { key: 'cedula_conductor', header: 'Cédula' },
    { key: 'categoria_licencia', header: 'Categoría' },
    { key: 'fecha_vence_licencia', header: 'Vence licencia', render: c => {
      const v = new Date(c.fecha_vence_licencia)
      const vencida = v < hoy
      return <span className={vencida ? 'text-red-600 font-medium' : ''}>{v.toLocaleDateString('es-CO')}{vencida && ' ⚠'}</span>
    }},
    { key: 'autorizacion_th', header: 'TH', render: c => {
      const tieneNum = !!c.autorizacion_th
      const vigente = tieneNum && (!c.fecha_vence_th || new Date(c.fecha_vence_th) >= hoy)
      return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${vigente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {tieneNum ? c.autorizacion_th : 'Sin auth'}
        </span>
      )
    }},
    { key: 'dependencia', header: 'Dependencia', render: c => c.dependencia?.descripcion ?? '' },
  ]

  const isPending = create.isPending || update.isPending
  const vencidasCount = conductores.filter(c => !c.autorizacion_th || (c.fecha_vence_th && new Date(c.fecha_vence_th) < hoy)).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Conductores</h1>
          <p className="text-sm text-slate-500">{conductores.length} conductores registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Nuevo conductor
        </button>
      </div>

      {vencidasCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0" />
          {vencidasCount} conductor(es) con TH vencida o sin autorización.
        </div>
      )}

      {vencidasLicencia.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-red-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Licencias vencidas:</span>{' '}
            {vencidasLicencia.map((c, i) => (
              <span key={c.id}>
                {c.nombre_conductor} <span className="text-red-600">({new Date(c.fecha_vence_licencia).toLocaleDateString('es-CO')})</span>
                {i < vencidasLicencia.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {proximasLicencia.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Licencias próximas a vencer (≤30 días):</span>{' '}
            {proximasLicencia.map((c, i) => (
              <span key={c.id}>
                {c.nombre_conductor} <span className="text-amber-600">({new Date(c.fecha_vence_licencia).toLocaleDateString('es-CO')})</span>
                {i < proximasLicencia.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      <DataTable
        columns={columns} data={conductores} keyField="id"
        searchable searchPlaceholder="Buscar nombre, cédula..."
        searchFilter={(c, q) => [c.nombre_conductor, c.cedula_conductor].join(' ').toLowerCase().includes(q.toLowerCase())}
        loading={isLoading}
        actions={c => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil size={15} /></button>
            <button onClick={async () => { if (confirm(`¿Eliminar a ${c.nombre_conductor}?`)) await remove.mutateAsync(c.id) }} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Conductor' : 'Editar Conductor'} size="lg">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-full">
            <FormField label="Nombre completo" required value={form.nombre_conductor} onChange={set('nombre_conductor')} />
          </div>
          <FormField label="Cédula" required value={form.cedula_conductor} onChange={set('cedula_conductor')} />
          <FormField label="Licencia No." required value={form.licencia_conduccion} onChange={set('licencia_conduccion')} />
          {modal === 'create' && <>
            <FormField label="Email (acceso al sistema)" type="email" required value={form.email} onChange={set('email')} placeholder="conductor@ejemplo.com" />
            <div />
            <FormField label="Contraseña" type="password" required value={form.password} onChange={set('password')} />
            <FormField label="Confirmar contraseña" type="password" required value={form.password_confirm} onChange={set('password_confirm')} />
          </>}
          <FormField label="Categoría licencia *" required value={form.categoria_licencia} onChange={set('categoria_licencia')} placeholder="B1, C1, C2..." />
          <FormField label="Vence licencia *" type="date" required value={form.fecha_vence_licencia} onChange={set('fecha_vence_licencia')} />
          
          {licenciasVisibles >= 2 && (
            <>
              <FormField label="Categoría licencia 2" value={form.categoria_licencia_2} onChange={set('categoria_licencia_2')} placeholder="B1, C1, C2..." />
              <FormField label="Vence licencia 2" type="date" value={form.fecha_vence_licencia_2} onChange={set('fecha_vence_licencia_2')} />
            </>
          )}

          {licenciasVisibles >= 3 && (
            <>
              <FormField label="Categoría licencia 3" value={form.categoria_licencia_3} onChange={set('categoria_licencia_3')} placeholder="B1, C1, C2..." />
              <FormField label="Vence licencia 3" type="date" value={form.fecha_vence_licencia_3} onChange={set('fecha_vence_licencia_3')} />
            </>
          )}

          {licenciasVisibles < 3 && (
            <div className="col-span-full">
              <button type="button" onClick={() => setLicenciasVisibles(v => v + 1)} className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Plus size={14} /> Agregar otra licencia
              </button>
            </div>
          )}

          <FormField label="No. Autorización TH" value={form.autorizacion_th} onChange={set('autorizacion_th')} placeholder="Ej: TH-2024-001" />
          <FormField label="Fecha autorización TH" type="date" value={form.fecha_autorizacion_th} onChange={set('fecha_autorizacion_th')} />
          <FormField label="Fecha vence TH" type="date" value={form.fecha_vence_th} onChange={set('fecha_vence_th')} />
          <FormField label="Teléfono" type="number" value={form.telefono} onChange={set('telefono')} />
          <FormField as="select" label="Dependencia" required value={form.id_dependencia_conductor} onChange={set('id_dependencia_conductor')}>
            <option value="">Seleccionar...</option>
            {deps.map(d => <option key={d.id} value={d.id}>{d.descripcion}</option>)}
          </FormField>

          <div className="col-span-full flex justify-end gap-3 pt-2">
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
