import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import cron from 'node-cron'
import { run } from './utils/db'

import authRouter from './routes/auth'
import catalogosRouter from './routes/catalogos'
import chipsRouter from './routes/chips'
import vehiculosRouter from './routes/vehiculos'
import conductoresRouter from './routes/conductores'
import mantenimientoRouter from './routes/mantenimiento'
import requisitosRouter from './routes/requisitos'
import componentesRouter from './routes/componentes'
import tanqueosRouter from './routes/tanqueos'
import salidasRouter from './routes/salidas'
import inspeccionesRouter from './routes/inspecciones'
import historialRouter from './routes/historial'
import usuariosRouter from './routes/usuarios'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/10\.1\.1\.\d+/.test(origin) || origin.includes('localhost')) {
      cb(null, true)
    } else {
      cb(new Error('CORS no permitido'))
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/auth', authRouter)
app.use('/api/catalogos', catalogosRouter)
app.use('/api/chips', chipsRouter)
app.use('/api/vehiculos', vehiculosRouter)
app.use('/api/conductores', conductoresRouter)
app.use('/api/mantenimiento', mantenimientoRouter)
app.use('/api/requisitos', requisitosRouter)
app.use('/api/componentes', componentesRouter)
app.use('/api/tanqueos', tanqueosRouter)
app.use('/api/salidas', salidasRouter)
app.use('/api/inspecciones', inspeccionesRouter)
app.use('/api/historial', historialRouter)
app.use('/api/usuarios', usuariosRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

cron.schedule('0 0 * * *', async () => {
  await run(
    "UPDATE ctv_control_requisitos SET estado_requisito='VENCIDO' WHERE fecha_vencimiento < NOW() AND estado_requisito='VIGENTE'",
  )
  console.log('[CRON] Requisitos vencidos actualizados')
})

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[ERROR]', err)
  res.status(500).json({ error: err.message ?? 'Error interno' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor CTV corriendo en puerto ${PORT}`)
})

export default app
