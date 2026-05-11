import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge, { MAPS } from '../../components/StatusBadge'
import { useVehiculos, useCreateVehiculo, useUpdateVehiculo, useDeleteVehiculo } from '../../hooks/useVehiculos'
import { useMarcas, useColores, useTiposVehiculo, useDependencias } from '../../hooks/useCatalogos'
import type { Vehiculo } from '../../types'

const COMBUSTIBLE = ['GASOLINA', 'DIESEL', 'GAS', 'ELECTRICO', 'HIBRIDO']

function VehiculoDetail({ v }: { v: Vehiculo }) {
  const today = new Date()
  const reqs = v.requisitos ?? []
  const hasVencido = reqs.some(r => r.estado_requisito === 'VENCIDO')

  function expiryClass(fecha: string) {
    const d = new Date(fecha)
    const diff = (d.getTime() - today.getTime()) / 86400000
    if (diff < 0) return 'text-red-600 font-medium'
    if (diff <= 30) return 'text-amber-600 font-medium'
    return 'text-slate-700'
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div><span className="text-slate-500">Línea</span><p className="font-medium">{v.linea}</p></div>
        <div><span className="text-slate-500">Marca</span><p className="font-medium">{v.marca?.descripcion ?? '—'}</p></div>
        <div><span className="text-slate-500">Tipo</span><p className="font-medium">{v.tipo_vehiculo?.descripcion ?? '—'}</p></div>
        <div><span className="text-slate-500">Año</span><p className="font-medium">{v.anno}</p></div>
        <div><span className="text-slate-500">Combustible</span><p className="font-medium">{v.tipo_combustible}</p></div>
        <div><span className="text-slate-500">Estado</span><p><StatusBadge value={v.estado} map={MAPS.ESTADO_VEHICULO} /></p></div>
        <div><span className="text-slate-500">Dependencia</span><p className="font-medium">{v.dependencia?.descripcion ?? '—'}</p></div>
      </div>

      <hr className="border-slate-200" />

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Documentos / Requisitos</h3>
        {hasVencido && (
          <div className="mb-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
            Este vehículo tiene documentos vencidos.
          </div>
        )}
        {reqs.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Sin documentos registrados.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="pb-1 pr-3 font-medium">Tipo</th>
                <th className="pb-1 pr-3 font-medium">Número</th>
                <th className="pb-1 pr-3 font-medium">Entidad</th>
                <th className="pb-1 pr-3 font-medium">Vencimiento</th>
                <th className="pb-1 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map(r => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 text-slate-700">{r.tipo_requisito?.descripcion ?? '—'}</td>
                  <td className="py-1.5 pr-3 font-mono text-slate-700">{r.numero_requisito}</td>
                  <td className="py-1.5 pr-3 text-slate-700">{r.empresa_expide}</td>
                  <td className={`py-1.5 pr-3 ${expiryClass(r.fecha_vencimiento)}`}>{r.fecha_vencimiento?.slice(0, 10)}</td>
                  <td className="py-1.5"><StatusBadge value={r.estado_requisito} map={MAPS.ESTADO_REQUISITO} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

const empty = {
  id_tipo_vehiculo: '', id_marca: '', placa_vehiculo: '', linea: '', anno: '',
  id_color: '', numero_chasis: '', numero_motor: '', tipo_combustible: 'GASOLINA',
  capacidad_combustible: '', capacidad_peso: '', capacidad_pasajeros: '',
  id_dependencia_asignada: '', id_responsable: '', estado: 'ACTIVO',
  fecha_adquisicion: '', valor_adquisicion: '', placa_almacen: '',
}

type FormState = typeof empty

export default function AdminVehiculos() {
  const { data: vehiculos = [], isLoading } = useVehiculos()
  const { data: marcas = [] }  = useMarcas()
  const { data: colores = [] } = useColores()
  const { data: tipos = [] }   = useTiposVehiculo()
  const { data: deps = [] }    = useDependencias()

  const create = useCreateVehiculo()
  const update = useUpdateVehiculo()
  const remove = useDeleteVehiculo()

  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Vehiculo | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [detailVehiculo, setDetailVehiculo] = useState<Vehiculo | null>(null)

  function openCreate() { setForm(empty); setEditing(null); setModal('create') }
  function openEdit(v: Vehiculo) {
    setEditing(v)
    setForm({
      id_tipo_vehiculo: String(v.id_tipo_vehiculo), id_marca: String(v.id_marca),
      placa_vehiculo: v.placa_vehiculo, linea: v.linea, anno: String(v.anno),
      id_color: String(v.id_color), numero_chasis: v.numero_chasis, numero_motor: v.numero_motor,
      tipo_combustible: v.tipo_combustible,
      capacidad_combustible: String(v.capacidad_combustible ?? ''),
      capacidad_peso: String(v.capacidad_peso ?? ''),
      capacidad_pasajeros: String(v.capacidad_pasajeros ?? ''),
      id_dependencia_asignada: String(v.id_dependencia_asignada),
      id_responsable: String(v.id_responsable),
      estado: v.estado,
      fecha_adquisicion: v.fecha_adquisicion?.slice(0, 10) ?? '',
      valor_adquisicion: String(v.valor_adquisicion ?? ''),
      placa_almacen: v.placa_almacen ?? '',
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
      id_tipo_vehiculo: Number(form.id_tipo_vehiculo), id_marca: Number(form.id_marca),
      anno: Number(form.anno), id_color: Number(form.id_color),
      id_dependencia_asignada: Number(form.id_dependencia_asignada),
      id_responsable: Number(form.id_responsable),
      capacidad_combustible: form.capacidad_combustible ? Number(form.capacidad_combustible) : undefined,
      capacidad_peso: form.capacidad_peso ? Number(form.capacidad_peso) : undefined,
      capacidad_pasajeros: form.capacidad_pasajeros ? Number(form.capacidad_pasajeros) : undefined,
      valor_adquisicion: form.valor_adquisicion ? Number(form.valor_adquisicion) : undefined,
    }
    try {
      if (modal === 'create') await create.mutateAsync(payload)
      else await update.mutateAsync({ id: editing!.id, data: payload })
      setModal(null)
    } catch { /* toast shown by hook */ }
  }

  async function handleDelete(v: Vehiculo) {
    if (!confirm(`¿Eliminar vehículo ${v.placa_vehiculo}?`)) return
    await remove.mutateAsync(v.id)
  }

  const columns: Column<Vehiculo>[] = [
    { key: 'placa_vehiculo', header: 'Placa', render: v => <span className="font-mono font-medium">{v.placa_vehiculo}</span> },
    { key: 'linea', header: 'Línea/Modelo' },
    { key: 'marca', header: 'Marca', render: v => v.marca?.descripcion ?? '' },
    { key: 'anno', header: 'Año' },
    { key: 'tipo_combustible', header: 'Combustible' },
    { key: 'estado', header: 'Estado', render: v => <StatusBadge value={v.estado} map={MAPS.ESTADO_VEHICULO} /> },
  ]

  const isPending = create.isPending || update.isPending

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Vehículos</h1>
          <p className="text-sm text-slate-500">{vehiculos.length} vehículos registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Nuevo vehículo
        </button>
      </div>

      <DataTable
        columns={columns} data={vehiculos} keyField="id"
        searchable searchPlaceholder="Buscar placa, línea..."
        searchFilter={(v, q) => [v.placa_vehiculo, v.linea, v.marca?.descripcion ?? ''].join(' ').toLowerCase().includes(q.toLowerCase())}
        loading={isLoading}
        actions={v => (
          <div className="flex items-center justify-end gap-1">
            <button onClick={() => setDetailVehiculo(v)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"><Eye size={15} /></button>
            <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
            <button onClick={() => handleDelete(v)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
          </div>
        )}
      />

      <Modal open={detailVehiculo !== null} onClose={() => setDetailVehiculo(null)} title={`Detalle — ${detailVehiculo?.placa_vehiculo ?? ''}`} size="lg">
        {detailVehiculo && <VehiculoDetail v={detailVehiculo} />}
      </Modal>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Nuevo Vehículo' : 'Editar Vehículo'} size="xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField as="select" label="Tipo vehículo" required value={form.id_tipo_vehiculo} onChange={set('id_tipo_vehiculo')}>
            <option value="">Seleccionar...</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.descripcion}</option>)}
          </FormField>
          <FormField as="select" label="Marca" required value={form.id_marca} onChange={set('id_marca')}>
            <option value="">Seleccionar...</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.descripcion}</option>)}
          </FormField>
          <FormField label="Placa" required value={form.placa_vehiculo} onChange={set('placa_vehiculo')} maxLength={6} style={{ textTransform: 'uppercase' }} />
          <FormField label="Línea/Modelo" required value={form.linea} onChange={set('linea')} />
          <FormField label="Año" type="number" required value={form.anno} onChange={set('anno')} min={1990} max={2100} />
          <FormField as="select" label="Color" required value={form.id_color} onChange={set('id_color')}>
            <option value="">Seleccionar...</option>
            {colores.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
          </FormField>
          <FormField label="Número chasis" value={form.numero_chasis} onChange={set('numero_chasis')} />
          <FormField label="Número motor" value={form.numero_motor} onChange={set('numero_motor')} />
          <FormField as="select" label="Tipo combustible" value={form.tipo_combustible} onChange={set('tipo_combustible')}>
            {COMBUSTIBLE.map(c => <option key={c} value={c}>{c}</option>)}
          </FormField>
          <FormField label="Capacidad combustible (gal)" type="number" value={form.capacidad_combustible} onChange={set('capacidad_combustible')} />
          <FormField label="Capacidad carga (kg)" type="number" value={form.capacidad_peso} onChange={set('capacidad_peso')} />
          <FormField label="Capacidad pasajeros" type="number" value={form.capacidad_pasajeros} onChange={set('capacidad_pasajeros')} />
          <FormField as="select" label="Dependencia asignada" required value={form.id_dependencia_asignada} onChange={set('id_dependencia_asignada')}>
            <option value="">Seleccionar...</option>
            {deps.map(d => <option key={d.id} value={d.id}>{d.descripcion}</option>)}
          </FormField>
          <FormField label="ID Responsable" type="number" required value={form.id_responsable} onChange={set('id_responsable')} />
          <FormField as="select" label="Estado" value={form.estado} onChange={set('estado')}>
            <option value="ACTIVO">Activo</option>
            <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
            <option value="FUERA_DE_SERVICIO">Fuera de Servicio</option>
          </FormField>
          <FormField label="Fecha adquisición" type="date" value={form.fecha_adquisicion} onChange={set('fecha_adquisicion')} />
          <FormField label="Valor adquisición ($)" type="number" value={form.valor_adquisicion} onChange={set('valor_adquisicion')} />
          <FormField label="Placa almacén" value={form.placa_almacen} onChange={set('placa_almacen')} />

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
