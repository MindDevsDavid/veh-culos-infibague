import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

// Componentes instalados por vehículo
router.get('/vehiculo/:vehiculoId', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const items = await prisma.controlComponente.findMany({
    where: { id_vehiculo: Number(req.params.vehiculoId) },
    include: { componente: true },
  })
  res.json(items)
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { id_vehiculo, id_componente, placa } = req.body
  if (!id_vehiculo || !id_componente) { res.status(400).json({ error: 'Faltan campos requeridos' }); return }
  const item = await prisma.controlComponente.create({
    data: { id_vehiculo, id_componente, placa: placa ?? '', modifica_u: req.user!.email },
    include: { componente: true },
  })
  res.status(201).json(item)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.controlComponente.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
