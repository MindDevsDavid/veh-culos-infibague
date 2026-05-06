import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Camera } from 'lucide-react'
import { salidasApi } from '../../api/salidas'
import { useCheckEntrada } from '../../hooks/useSalidas'
import StatusBadge, { MAPS } from '../../components/StatusBadge'

export default function CheckEntrada() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const salidaId = Number(id)

  const { data: salida, isLoading } = useQuery({
    queryKey: ['salidas', salidaId],
    queryFn: () => salidasApi.get(salidaId),
    enabled: salidaId > 0,
  })

  const checkEntrada = useCheckEntrada()
  const [fotos, setFotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const fd = new FormData()
    fotos.forEach(f => fd.append('fotos', f))
    try {
      await checkEntrada.mutateAsync({ id: salidaId, form: fd })
      navigate('/vigilante/activos')
    } catch {
      setSubmitting(false)
    }
  }

  if (isLoading) return <div className="text-slate-400 p-8 text-center">Cargando...</div>
  if (!salida) return <div className="text-red-600 p-8 text-center">Salida no encontrada</div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Check Entrada</h1>
        <p className="text-sm text-slate-500">Registrar hora exacta de regreso del vehículo</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-lg font-bold text-slate-800">{salida.placa_vehiculo}</span>
          <StatusBadge value={salida.estado} map={MAPS.ESTADO_SALIDA} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div><span className="text-slate-500">Conductor:</span> <span className="ml-1">{(salida as any).conductor?.nombre_conductor}</span></div>
          <div><span className="text-slate-500">Salió a:</span> <span className="ml-1">{salida.hora_salida ? new Date(salida.hora_salida).toLocaleTimeString('es-CO') : '—'}</span></div>
          <div><span className="text-slate-500">Destino:</span> <span className="ml-1">{salida.lugar_destino}</span></div>
        </div>
      </div>

      {salida.estado !== 'EN_CURSO' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
          Esta salida está en estado <strong>{salida.estado}</strong> — no se puede hacer check-entrada.
        </div>
      )}

      {salida.estado === 'EN_CURSO' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Camera size={16} /> Fotos del vehículo al ingreso (máx. 2)
            </div>
            <input
              type="file" accept="image/*" multiple
              onChange={e => setFotos(Array.from(e.target.files ?? []).slice(0, 2))}
              className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
            {fotos.length > 0 && (
              <div className="flex gap-2">
                {fotos.map((f, i) => <div key={i} className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1">{f.name}</div>)}
              </div>
            )}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-800">
            Al confirmar se registrará la hora exacta actual como hora de entrada. El conductor deberá completar la inspección postoperacional.
          </div>

          <button type="submit" disabled={submitting || checkEntrada.isPending} className="w-full py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-60 transition-colors">
            {submitting ? 'Registrando...' : 'Confirmar entrada'}
          </button>
        </form>
      )}
    </div>
  )
}
