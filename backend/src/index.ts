import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import cron from 'node-cron'
import prisma from './utils/prisma'

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
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Routes
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

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// Cron: recalculate expired requisitos daily at midnight
cron.schedule('0 0 * * *', async () => {
  const hoy = new Date()
  await prisma.controlRequisito.updateMany({
    where: { fecha_vencimiento: { lt: hoy }, estado_requisito: 'VIGENTE' },
    data: { estado_requisito: 'VENCIDO' },
  })
  console.log('[CRON] Requisitos vencidos actualizados')
})

app.listen(PORT, () => {
  console.log(`Servidor CTV corriendo en puerto ${PORT}`)
})

export default app
