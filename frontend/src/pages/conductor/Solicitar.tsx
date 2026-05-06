import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import FormField from '../../components/FormField'
import { useCreateSalida } from '../../hooks/useSalidas'
import { useVehiculos } from '../../hooks/useVehiculos'
import { useConductores } from '../../hooks/useConductores'
import { useDependencias } from '../../hooks/useCatalogos'
import { useAuth } from '../../context/AuthContext'

const empty = {
  id_vehiculo: '', id_conductor: '', id_inspeccion: '',
  fecha_salida: '', motivo_salida: '', lugar_destino: '',
  kilometraje_salida: '', firma: '', id_dependencia_uso: '', observaciones: '',
}

export default function ConductorSolicitar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inspeccionId = searchParams.get('inspeccion')
  const [form, setForm] = useState({ ...empty, id_inspeccion: inspeccionId || '' })
  const crear = useCreateSalida()
  const { data: vehiculos = [] } = useVehiculos()
  const { data: conductores = [] } = useConductores()
  const { data: deps = [] } = useDependencias()

  useEffect(() => {
    if (user?.rol === 'CONDUCTOR' && conductores.length > 0) {
      const userId = user.id ?? user.sub
      const mio = conductores.find(c => c.id_usuario === userId)
      if (mio) setForm(f => ({ ...f, id_conductor: String(mio.id) }))
    }
  }, [conductores, user])

  function set(k: keyof typeof empty) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await crear.mutateAsync({
        ...form,
        id_vehiculo: Number(form.id_vehiculo),
        id_conductor: Number(form.id_conductor),
        id_inspeccion: form.id_inspeccion ? Number(form.id_inspeccion) : undefined,
        kilometraje_salida: Number(form.kilometraje_salida),
        id_dependencia_uso: Number(form.id_dependencia_uso),
      })
      navigate('/conductor/solicitudes')
    } catch { /* toast shown by hook */ }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Solicitar Viaje</h1>
        <p className="text-sm text-slate-500">Completa la solicitud de salida del vehículo</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 shadow-sm">
        {form.id_inspeccion ? (
          <span><strong>Inspección preoperacional seleccionada:</strong> ID {form.id_inspeccion}</span>
        ) : (
          <span><strong>Antes de enviar:</strong> Debés completar la inspección preoperacional primero. <a href="/conductor/inspeccion/nueva" className="underline font-medium">Hacer inspección</a></span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField as="select" label="Vehículo" required value={form.id_vehiculo} onChange={set('id_vehiculo')}>
            <option value="">Seleccionar...</option>
            {vehiculos.filter(v => v.estado === 'ACTIVO').map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
          </FormField>
          <FormField as="select" label="Conductor" required value={form.id_conductor} onChange={set('id_conductor')}>
            <option value="">Seleccionar...</option>
            {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre_conductor}</option>)}
          </FormField>
          <FormField label="ID Inspección preoperacional" type="number" value={form.id_inspeccion} onChange={set('id_inspeccion')} placeholder="ID de la inspección realizada" />
          <FormField label="Km actual del vehículo" type="number" required value={form.kilometraje_salida} onChange={set('kilometraje_salida')} />
          <FormField label="Fecha de viaje" type="date" required value={form.fecha_salida} onChange={set('fecha_salida')} />
          <FormField as="select" label="Dependencia que usa" required value={form.id_dependencia_uso} onChange={set('id_dependencia_uso')}>
            <option value="">Seleccionar...</option>
            {deps.map(d => <option key={d.id} value={d.id}>{d.descripcion}</option>)}
          </FormField>
          <FormField label="Lugar de destino" required value={form.lugar_destino} onChange={set('lugar_destino')} />
          <FormField label="Firma / Responsable" value={form.firma} onChange={set('firma')} />
        </div>
        <FormField as="textarea" label="Motivo del viaje" required value={form.motivo_salida} onChange={set('motivo_salida')} />
        <FormField as="textarea" label="Observaciones" value={form.observaciones} onChange={set('observaciones')} />

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/conductor/solicitudes')} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={crear.isPending} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            {crear.isPending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </div>
  )
}
