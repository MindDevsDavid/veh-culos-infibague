import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'
import api from '../../api/client'
import DataTable from '../../components/DataTable'
import type { Column } from '../../components/DataTable'
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
  conductor?: { nombre_conductor: string }
  autorizador?: { nombre: string } | null
}

const ESTADO_MAP: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: 'bg-amber-100 text-amber-700' },
  AUTORIZADA: { label: 'Autorizada', color: 'bg-green-100 text-green-700' },
}

export default function AlmacenistaTanqueos() {
  const qc = useQueryClient()
  const { data: items = [], isLoading } = useQuery<Tanqueo[]>({
    queryKey: ['tanqueos'],
    queryFn: () => api.get('/tanqueos').then(r => r.data),
  })

  const autorizar = useMutation({
    mutationFn: (id: number) => api.put(`/tanqueos/${id}/autorizar`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tanqueos'] }); toast.success('Tanqueo autorizado') },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Error al autorizar'),
  })

  const pendientes = items.filter(t => t.estado === 'PENDIENTE')
  const historial  = items.filter(t => t.estado !== 'PENDIENTE')

  const columns: Column<Tanqueo>[] = [
    { key: 'vehiculo',        header: 'Vehículo',    render: t => <span className="font-mono font-medium">{t.vehiculo?.placa_vehiculo ?? t.placa_vehiculo}</span> },
    { key: 'conductor',       header: 'Conductor',   render: t => t.conductor?.nombre_conductor ?? '' },
    { key: 'id_salida',       header: 'Salida #',    render: t => <span className="font-mono">#{t.id_salida}</span> },
    { key: 'tipo_combustible',header: 'Combustible' },
    { key: 'cantidad_galones',header: 'Galones',     render: t => `${t.cantidad_galones} gal` },
    { key: 'fecha_tanqueo',   header: 'Fecha',       render: t => new Date(t.fecha_tanqueo).toLocaleDateString('es-CO') },
    { key: 'estado',          header: 'Estado',      render: t => <StatusBadge value={t.estado} map={ESTADO_MAP} /> },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Tanqueos</h1>
        <p className="text-sm text-slate-500">{pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''} de autorizar</p>
      </div>

      {pendientes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Pendientes de autorización</h2>
          {pendientes.map(t => (
            <div key={t.id} className="bg-white border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="font-mono font-semibold text-slate-800">{t.vehiculo?.placa_vehiculo ?? t.placa_vehiculo}</span>
                <span className="text-slate-600">{t.conductor?.nombre_conductor}</span>
                <span className="text-slate-500">Salida #{t.id_salida}</span>
                <span className="text-slate-600">{t.tipo_combustible ?? '—'} · {t.cantidad_galones} gal</span>
                <span className="text-slate-400">{new Date(t.fecha_tanqueo).toLocaleDateString('es-CO')}</span>
              </div>
              <button
                onClick={() => autorizar.mutate(t.id)}
                disabled={autorizar.isPending}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-60"
              >
                <CheckCircle size={15} /> Autorizar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Historial</h2>
        <DataTable
          columns={columns} data={historial} keyField="id" loading={isLoading}
          searchable searchPlaceholder="Buscar placa, conductor..."
          searchFilter={(t, q) => [t.vehiculo?.placa_vehiculo ?? t.placa_vehiculo, t.conductor?.nombre_conductor ?? ''].join(' ').toLowerCase().includes(q.toLowerCase())}
        />
      </div>
    </div>
  )
}
