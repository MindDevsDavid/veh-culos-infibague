import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Fuel } from 'lucide-react'
import api from '../../api/client'
import { useSalidas } from '../../hooks/useSalidas'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
import Modal from '../../components/Modal'
import FormField from '../../components/FormField'
import StatusBadge from '../../components/StatusBadge'

interface Tanqueo {
  id: number
  placa_vehiculo: string
  fecha_tanqueo: string
  tipo_combustible: string
  cantidad_galones: number
  estado: string
  id_salida: number
  vehiculo?: { placa_vehiculo: string }
  autorizador?: { nombre: string } | null
}

const ESTADO_MAP: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700' },
  AUTORIZADA: { label: 'Autorizada', color: 'bg-green-100 text-green-700' },
}

const ESTADOS_ACTIVOS = ['PENDIENTE', 'AUTORIZADA', 'INSPECCIONADA', 'EN_CURSO']

const emptyForm = { tipo_combustible: 'GASOLINA', cantidad_galones: '' }

export default function ConductorTanqueos() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const { data: tanqueos = [], isLoading } = useQuery<Tanqueo[]>({
    queryKey: ['tanqueos'],
    queryFn: () => api.get('/tanqueos').then(r => r.data),
  })

  const { data: salidas = [] } = useSalidas()
  const viajeActivo = salidas.find((s: any) => ESTADOS_ACTIVOS.includes(s.estado))

  const solicitar = useMutation({
    mutationFn: (data: { tipo_combustible: string; cantidad_galones: number }) =>
      api.post('/tanqueos/solicitar', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tanqueos'] })
      toast.success('Tanqueo solicitado')
      setModal(false)
      setForm(emptyForm)
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al solicitar tanqueo'),
  })

  function set(k: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.cantidad_galones) { toast.error('Ingresa la cantidad de galones'); return }
    await solicitar.mutateAsync({ tipo_combustible: form.tipo_combustible, cantidad_galones: Number(form.cantidad_galones) })
  }

  const columns: Column<Tanqueo>[] = [
    { key: 'vehiculo',        header: 'Vehículo',    render: t => <span className="font-mono font-medium">{t.vehiculo?.placa_vehiculo ?? t.placa_vehiculo}</span> },
    { key: 'id_salida',       header: 'Salida #',    render: t => <span className="font-mono">#{t.id_salida}</span> },
    { key: 'tipo_combustible',header: 'Combustible' },
    { key: 'cantidad_galones',header: 'Galones',     render: t => `${t.cantidad_galones} gal` },
    { key: 'fecha_tanqueo',   header: 'Fecha',       render: t => new Date(t.fecha_tanqueo).toLocaleDateString('es-CO') },
    { key: 'estado',          header: 'Estado',      render: t => <StatusBadge value={t.estado} map={ESTADO_MAP} /> },
    { key: 'autorizador',     header: 'Autorizado por', render: t => t.autorizador?.nombre ?? '—' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Mis Tanqueos</h1>
          <p className="text-sm text-slate-500">{tanqueos.length} registros</p>
        </div>
        <button
          onClick={() => setModal(true)}
          disabled={!viajeActivo}
          title={!viajeActivo ? 'Necesitas un viaje activo para solicitar un tanqueo' : ''}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Fuel size={16} /> Solicitar tanqueo
        </button>
      </div>

      {!viajeActivo && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
          Solo puedes solicitar un tanqueo cuando tienes un viaje activo (después del preoperacional y antes del postoperacional).
        </div>
      )}

      {viajeActivo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          <span className="font-semibold">Viaje activo:</span> <span className="font-mono">{(viajeActivo as any).placa_vehiculo}</span> → {(viajeActivo as any).lugar_destino} · Estado: {(viajeActivo as any).estado}
        </div>
      )}

      <DataTable columns={columns} data={tanqueos} keyField="id" loading={isLoading} />

      <Modal open={modal} onClose={() => setModal(false)} title="Solicitar Tanqueo" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {viajeActivo && (
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600 space-y-1">
              <div><span className="font-medium">Vehículo:</span> {(viajeActivo as any).placa_vehiculo}</div>
              <div><span className="font-medium">Salida #:</span> {(viajeActivo as any).id}</div>
            </div>
          )}
          <FormField as="select" label="Tipo de combustible" value={form.tipo_combustible} onChange={set('tipo_combustible')}>
            {['GASOLINA', 'DIESEL', 'GAS'].map(c => <option key={c} value={c}>{c}</option>)}
          </FormField>
          <FormField label="Cantidad (galones)" type="number" required value={form.cantidad_galones} onChange={set('cantidad_galones')} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={solicitar.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {solicitar.isPending ? 'Enviando...' : 'Solicitar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
