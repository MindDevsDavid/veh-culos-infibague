import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)
router.use(allowRoles('ADMIN', 'AUTORIZADOR', 'CONSULTAS'))

const include = {
  vehiculo: { select: { placa_vehiculo: true, linea: true, marca: { select: { descripcion: true } } } },
  salida: { select: { motivo_salida: true, lugar_destino: true, conductor: { select: { nombre_conductor: true } } } },
}

router.get('/', async (req: Request, res: Response) => {
  const { vehiculo_id, desde, hasta } = req.query
  const historial = await prisma.historialUso.findMany({
    where: {
      ...(vehiculo_id ? { id_vehiculo: Number(vehiculo_id) } : {}),
      ...(desde || hasta ? {
        fecha: {
          ...(desde ? { gte: new Date(String(desde)) } : {}),
          ...(hasta ? { lte: new Date(String(hasta)) } : {}),
        },
      } : {}),
    },
    include,
    orderBy: { fecha: 'desc' },
  })
  res.json(historial)
})

router.get('/vehiculo/:vehiculoId', async (req: Request, res: Response) => {
  const historial = await prisma.historialUso.findMany({
    where: { id_vehiculo: Number(req.params.vehiculoId) },
    include,
    orderBy: { fecha: 'desc' },
  })
  res.json(historial)
})

export default router
