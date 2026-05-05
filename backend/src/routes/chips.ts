import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (_req, res: Response) => {
  const chips = await prisma.chip.findMany({ orderBy: { id: 'desc' } })
  res.json(chips)
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const chip = await prisma.chip.findUnique({ where: { id: Number(req.params.id) } })
  if (!chip) { res.status(404).json({ error: 'Chip no encontrado' }); return }
  res.json(chip)
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { numero_chip, estado_chip, estado } = req.body
  if (!numero_chip) { res.status(400).json({ error: 'numero_chip requerido' }); return }
  const chip = await prisma.chip.create({
    data: { numero_chip, estado_chip: estado_chip ?? 'ACTIVO', estado: estado ?? 'VIGENTE', modifica_u: req.user!.email },
  })
  res.status(201).json(chip)
})

router.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { numero_chip, estado_chip, estado } = req.body
  const chip = await prisma.chip.update({
    where: { id: Number(req.params.id) },
    data: { numero_chip, estado_chip, estado, modifica_u: req.user!.email },
  })
  res.json(chip)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.chip.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
