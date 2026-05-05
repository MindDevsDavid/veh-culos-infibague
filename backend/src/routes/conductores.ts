import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const include = { dependencia: true }

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (_req, res: Response) => {
  const hoy = new Date()
  const conductores = await prisma.conductor.findMany({
    include,
    orderBy: { nombre_conductor: 'asc' },
  })
  // Adjuntar flags de vencimiento calculados
  const result = conductores.map(c => ({
    ...c,
    licencia_vencida: new Date(c.fecha_vence_licencia) < hoy,
    th_vencida: c.fecha_vence_th ? new Date(c.fecha_vence_th) < hoy : !c.autorizacion_th,
  }))
  res.json(result)
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const c = await prisma.conductor.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!c) { res.status(404).json({ error: 'Conductor no encontrado' }); return }
  res.json(c)
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const {
    nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia,
    fecha_vence_licencia, autorizacion_th, fecha_autorizacion_th, fecha_vence_th,
    telefono, id_dependencia_conductor, usuario_id,
  } = req.body

  if (!nombre_conductor || !cedula_conductor || !licencia_conduccion || !fecha_vence_licencia) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  const c = await prisma.conductor.create({
    data: {
      nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia,
      fecha_vence_licencia: new Date(fecha_vence_licencia),
      autorizacion_th: autorizacion_th ?? 0,
      fecha_autorizacion_th: fecha_autorizacion_th ? new Date(fecha_autorizacion_th) : undefined,
      fecha_vence_th: fecha_vence_th ? new Date(fecha_vence_th) : undefined,
      telefono, id_dependencia_conductor, usuario_id,
      modifica_u: req.user!.email,
    },
    include,
  })
  res.status(201).json(c)
})

router.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const {
    nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia,
    fecha_vence_licencia, autorizacion_th, fecha_autorizacion_th, fecha_vence_th,
    telefono, id_dependencia_conductor, usuario_id,
  } = req.body

  const c = await prisma.conductor.update({
    where: { id },
    data: {
      nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia,
      fecha_vence_licencia: fecha_vence_licencia ? new Date(fecha_vence_licencia) : undefined,
      autorizacion_th,
      fecha_autorizacion_th: fecha_autorizacion_th ? new Date(fecha_autorizacion_th) : undefined,
      fecha_vence_th: fecha_vence_th ? new Date(fecha_vence_th) : undefined,
      telefono, id_dependencia_conductor, usuario_id,
      modifica_u: req.user!.email,
    },
    include,
  })
  res.json(c)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.conductor.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
