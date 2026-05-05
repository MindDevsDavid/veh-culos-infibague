import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const include = {
  vehiculo: { select: { placa_vehiculo: true } },
  conductor: { select: { nombre_conductor: true } },
  autorizador: { select: { nombre: true } },
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { vehiculo_id, salida_id } = req.query
  const tanqueos = await prisma.controlTanqueo.findMany({
    where: {
      ...(vehiculo_id ? { id_vehiculo: Number(vehiculo_id) } : {}),
      ...(salida_id ? { id_salida: Number(salida_id) } : {}),
    },
    include,
    orderBy: { fecha_tanqueo: 'desc' },
  })
  res.json(tanqueos)
})

router.post('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const {
    id_vehiculo, id_salida, placa_vehiculo, fecha_tanqueo,
    tipo_combustible, cantidad_galones, id_conductor_tanqueo,
  } = req.body

  if (!id_vehiculo || !id_salida || !cantidad_galones) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  const t = await prisma.controlTanqueo.create({
    data: {
      id_vehiculo, id_salida, placa_vehiculo: placa_vehiculo ?? '',
      fecha_tanqueo: fecha_tanqueo ? new Date(fecha_tanqueo) : new Date(),
      tipo_combustible, cantidad_galones,
      id_conductor_tanqueo, id_autorizador: req.user!.sub,
      modifica_u: req.user!.email,
    },
    include,
  })
  res.status(201).json(t)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.controlTanqueo.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
