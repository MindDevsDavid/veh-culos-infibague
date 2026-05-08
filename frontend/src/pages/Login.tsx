import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { Truck, AlertOctagon } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [licenciaVencida, setLicenciaVencida] = useState<{ nombre: string; fecha: string } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLicenciaVencida(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.error === 'LICENCIA_VENCIDA') {
        setLicenciaVencida({ nombre: data.nombre, fecha: data.fecha_vence })
      } else {
        toast.error('Credenciales inválidas')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8">
        <div className="card p-10 shadow-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4">
              <Truck className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Control de Vehículos</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">INFIbagué</p>
          </div>

          {licenciaVencida && (
            <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
              <AlertOctagon size={32} className="text-red-600 shrink-0" />
              <p className="text-base font-bold text-red-700">Licencia Vencida</p>
              <p className="text-sm text-red-600">
                {licenciaVencida.nombre}, tu licencia de conducción venció el{' '}
                <span className="font-semibold">
                  {new Date(licenciaVencida.fecha).toLocaleDateString('es-CO')}
                </span>
                . Renueva tu licencia para poder ingresar al sistema.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="input"
                placeholder="usuario@infibague.gov.co"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 text-base"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-6">
          Sistema de gestión vehicular • INFIbagué
        </p>
      </div>
    </div>
  )
}
