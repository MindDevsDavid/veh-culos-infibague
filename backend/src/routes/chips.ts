import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (_req, res: Response) => {
  const chips = await query('SELECT * FROM ctv_chips ORDER BY id DESC')
  res.json(chips)
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const chip = await queryOne('SELECT * FROM ctv_chips WHERE id = ?', [req.params.id])
  if (!chip) { res.status(404).json({ error: 'Chip no encontrado' }); return }
  res.json(chip)
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { numero_chip, estado_chip, estado } = req.body
  if (!numero_chip) { res.status(400).json({ error: 'numero_chip requerido' }); return }
  const r = await run(
    'INSERT INTO ctv_chips (numero_chip, estado_chip, estado, modifica_u) VALUES (?, ?, ?, ?)',
    [numero_chip, estado_chip ?? 'ACTIVO', estado ?? 'VIGENTE', req.user!.email],
  )
  const chip = await queryOne('SELECT * FROM ctv_chips WHERE id = ?', [r.insertId])
  res.status(201).json(chip)
})

router.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { numero_chip, estado_chip, estado } = req.body
  await run(
    'UPDATE ctv_chips SET numero_chip=?, estado_chip=?, estado=?, modifica_u=? WHERE id=?',
    [numero_chip, estado_chip, estado, req.user!.email, req.params.id],
  )
  const chip = await queryOne('SELECT * FROM ctv_chips WHERE id = ?', [req.params.id])
  res.json(chip)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_chips WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
