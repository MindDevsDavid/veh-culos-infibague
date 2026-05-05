import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import FormField from './FormField'
import { inspeccionesApi } from '../api/inspecciones'
import { useVehiculos } from '../hooks/useVehiculos'
import { useConductores } from '../hooks/useConductores'

type Estado10  = 'BUENO' | 'REGULAR' | 'MALO'
type Extintor  = 'VIGENTE' | 'VENCIDO' | 'NO_TIENE'
type SiNo      = 'SI' | 'NO'

interface Props {
  tipo: 'PREOPERACIONAL' | 'POSTOPERACIONAL'
  salidaId?: number
}

const opc10: Estado10[] = ['BUENO', 'REGULAR', 'MALO']

function Sel({ label, name, options, value, onChange, req }: { label: string; name: string; options: string[]; value: string; onChange: (v: string) => void; req?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}{req && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Check({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
      <input type="checkbox" checked={value === 'true'} onChange={e => onChange(e.target.checked ? 'true' : 'false')} className="rounded" />
      {label}
    </label>
  )
}

const emptyForm = {
  id_vehiculo: '', placa_vehiculo: '', id_conductor: '', kilometraje: '',
  estado_motor: '', nivel_refrigerante: '', nivel_bateria: '',
  estado_llantas_delanteras: '', estado_llantas_traseras: '', presion_llantas: '', estado_eje: '', suspension: '',
  luces_delanteras: 'false', luces_traseras: 'false', direccionales: 'false',
  luces_freno: 'false', luces_reversa: 'false', bocina: 'false', tablero: 'false',
  frenos: '', cinturones: 'false',
  extintor: '', botiquin: '', kit_carretera: '', limpieza: '', carroceria: '', vidrios: '', espejos: '',
  nivel_aceite: '', fugas_aceite: 'false', llanta_repuesto: 'false', estado_llanta_repuesto: '',
  apto_para_operar: 'false', reportado_mantenimiento: 'false', observaciones: '',
}

export default function InspeccionForm({ tipo, salidaId }: Props) {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [fotos, setFotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { data: vehiculos = [] } = useVehiculos()
  const { data: conductores = [] } = useConductores()

  function set(k: keyof typeof emptyForm) {
    return (v: string) => setForm(f => ({ ...f, [k]: v }))
  }
  function setInput(k: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))
  }

  function onVehiculoChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = vehiculos.find(v => v.id === Number(e.target.value))
    setForm(f => ({ ...f, id_vehiculo: e.target.value, placa_vehiculo: v?.placa_vehiculo ?? '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.id_vehiculo || !form.id_conductor || !form.kilometraje) {
      toast.error('Completa los campos obligatorios')
      return
    }
    setSubmitting(true)
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.set('tipo_inspeccion', tipo)
    fotos.forEach(f => fd.append('fotos', f))
    try {
      await inspeccionesApi.create(fd)
      toast.success('Inspección registrada')
      navigate('/conductor/solicitudes')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Error al guardar inspección')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Inspección {tipo === 'PREOPERACIONAL' ? 'Preoperacional' : 'Postoperacional'}</h1>
        <p className="text-sm text-slate-500">Completa todos los campos antes de {tipo === 'PREOPERACIONAL' ? 'solicitar el viaje' : 'entregar el vehículo'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Datos generales */}
        <Section title="Datos generales">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600">Vehículo<span className="text-red-500 ml-0.5">*</span></label>
              <select value={form.id_vehiculo} onChange={onVehiculoChange} className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa_vehiculo} — {v.linea}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Conductor<span className="text-red-500 ml-0.5">*</span></label>
              <select value={form.id_conductor} onChange={setInput('id_conductor')} className="mt-1 w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar...</option>
                {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre_conductor}</option>)}
              </select>
            </div>
            <FormField label="Kilometraje actual" type="number" required value={form.kilometraje} onChange={setInput('kilometraje')} />
          </div>
        </Section>

        {/* Motor */}
        <Section title="Motor y fluidos">
          <div className="grid grid-cols-3 gap-3">
            <Sel label="Estado motor" name="estado_motor" options={opc10} value={form.estado_motor} onChange={set('estado_motor')} />
            <Sel label="Nivel refrigerante" name="nivel_refrigerante" options={['LLENO','MEDIO','BAJO']} value={form.nivel_refrigerante} onChange={set('nivel_refrigerante')} />
            <Sel label="Nivel batería" name="nivel_bateria" options={['BUENO','BAJO','DEFICIENTE']} value={form.nivel_bateria} onChange={set('nivel_bateria')} />
            <Sel label="Nivel aceite" name="nivel_aceite" options={['LLENO','MEDIO','BAJO']} value={form.nivel_aceite} onChange={set('nivel_aceite')} />
            <div className="flex items-center pt-5"><Check label="Fugas de aceite" value={form.fugas_aceite} onChange={set('fugas_aceite')} /></div>
          </div>
        </Section>

        {/* Llantas y suspensión */}
        <Section title="Llantas y suspensión">
          <div className="grid grid-cols-3 gap-3">
            <Sel label="Llantas delanteras" name="est_ld" options={opc10} value={form.estado_llantas_delanteras} onChange={set('estado_llantas_delanteras')} />
            <Sel label="Llantas traseras" name="est_lt" options={opc10} value={form.estado_llantas_traseras} onChange={set('estado_llantas_traseras')} />
            <Sel label="Presión llantas" name="presion" options={['CORRECTA','BAJA','ALTA']} value={form.presion_llantas} onChange={set('presion_llantas')} />
            <Sel label="Estado eje" name="eje" options={opc10} value={form.estado_eje} onChange={set('estado_eje')} />
            <Sel label="Suspensión" name="suspension" options={opc10} value={form.suspension} onChange={set('suspension')} />
            <div className="flex items-center pt-5"><Check label="Llanta repuesto" value={form.llanta_repuesto} onChange={set('llanta_repuesto')} /></div>
            {form.llanta_repuesto === 'true' && (
              <Sel label="Estado llanta repuesto" name="est_lr" options={opc10} value={form.estado_llanta_repuesto} onChange={set('estado_llanta_repuesto')} />
            )}
          </div>
        </Section>

        {/* Luces y controles */}
        <Section title="Luces y controles">
          <div className="grid grid-cols-3 gap-3">
            <Check label="Luces delanteras" value={form.luces_delanteras} onChange={set('luces_delanteras')} />
            <Check label="Luces traseras" value={form.luces_traseras} onChange={set('luces_traseras')} />
            <Check label="Direccionales" value={form.direccionales} onChange={set('direccionales')} />
            <Check label="Luces de freno" value={form.luces_freno} onChange={set('luces_freno')} />
            <Check label="Luces de reversa" value={form.luces_reversa} onChange={set('luces_reversa')} />
            <Check label="Bocina" value={form.bocina} onChange={set('bocina')} />
            <Check label="Tablero funcional" value={form.tablero} onChange={set('tablero')} />
            <Check label="Cinturones" value={form.cinturones} onChange={set('cinturones')} />
            <Sel label="Frenos" name="frenos" options={['BUENO','REGULAR','MALO']} value={form.frenos} onChange={set('frenos')} />
          </div>
        </Section>

        {/* Seguridad y carrocería */}
        <Section title="Seguridad y carrocería">
          <div className="grid grid-cols-3 gap-3">
            <Sel label="Extintor" name="extintor" options={['VIGENTE','VENCIDO','NO_TIENE']} value={form.extintor} onChange={set('extintor')} />
            <Sel label="Botiquín" name="botiquin" options={['COMPLETO','INCOMPLETO','NO_TIENE']} value={form.botiquin} onChange={set('botiquin')} />
            <Sel label="Kit carretera" name="kit" options={['COMPLETO','INCOMPLETO','NO_TIENE']} value={form.kit_carretera} onChange={set('kit_carretera')} />
            <Sel label="Limpieza interior" name="limpieza" options={opc10} value={form.limpieza} onChange={set('limpieza')} />
            <Sel label="Carrocería" name="carroceria" options={opc10} value={form.carroceria} onChange={set('carroceria')} />
            <Sel label="Vidrios" name="vidrios" options={opc10} value={form.vidrios} onChange={set('vidrios')} />
            <Sel label="Espejos" name="espejos" options={opc10} value={form.espejos} onChange={set('espejos')} />
          </div>
        </Section>

        {/* Resultado */}
        <Section title="Resultado de la inspección">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">¿Apto para operar?</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="apto" value="true" checked={form.apto_para_operar === 'true'} onChange={() => set('apto_para_operar')('true')} /> Sí
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="apto" value="false" checked={form.apto_para_operar === 'false'} onChange={() => set('apto_para_operar')('false')} /> No
              </label>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">¿Reportar mantenimiento?</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mant" value="true" checked={form.reportado_mantenimiento === 'true'} onChange={() => set('reportado_mantenimiento')('true')} /> Sí
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" name="mant" value="false" checked={form.reportado_mantenimiento === 'false'} onChange={() => set('reportado_mantenimiento')('false')} /> No
              </label>
            </div>
          </div>
          {form.apto_para_operar === 'false' && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 mt-2">
              Vehículo marcado como NO apto — no podrá salir hasta subsanar.
            </div>
          )}
        </Section>

        {/* Fotos */}
        <Section title="Fotos (máx. 4)">
          <input type="file" accept="image/*" multiple onChange={e => setFotos(Array.from(e.target.files ?? []).slice(0, 4))}
            className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
          {fotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {fotos.map((f, i) => <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{f.name}</span>)}
            </div>
          )}
        </Section>

        {/* Observaciones */}
        <Section title="Observaciones">
          <textarea value={form.observaciones} onChange={setInput('observaciones')} rows={3}
            placeholder="Observaciones adicionales..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </Section>

        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate('/conductor/solicitudes')} className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button type="submit" disabled={submitting} className="px-6 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60">
            {submitting ? 'Guardando...' : 'Guardar inspección'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}
