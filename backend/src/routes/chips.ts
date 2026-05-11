import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const SELECT_CHIP = `
  SELECT c.*, v.placa_vehiculo, v.linea
  FROM ctv_chips c
  LEFT JOIN ctv_vehiculos v ON c.id_vehiculo = v.id
`

function mapChip(row: any) {
  return {
    ...row,
    vehiculo: row.id_vehiculo ? { id: row.id_vehiculo, placa_vehiculo: row.placa_vehiculo, linea: row.linea } : null,
  }
}

router.get('/', allowRoles('ADMIN'), async (_req, res: Response) => {
  const rows = await query(SELECT_CHIP + ' ORDER BY c.id DESC')
  res.json(rows.map(mapChip))
})

router.get('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_CHIP + ' WHERE c.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Chip no encontrado' }); return }
  res.json(mapChip(row))
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { numero_chip, id_vehiculo, estado } = req.body
  if (!numero_chip) { res.status(400).json({ error: 'numero_chip requerido' }); return }
  if (numero_chip.length > 15) { res.status(400).json({ error: 'numero_chip no puede superar 15 caracteres' }); return }
  const vehiculoId = id_vehiculo ? Number(id_vehiculo) : null
  const estado_chip = vehiculoId ? 'INSTALADO' : 'NO_INSTALADO'
  const r = await run(
    'INSERT INTO ctv_chips (numero_chip, id_vehiculo, estado_chip, estado, modifica_u) VALUES (?, ?, ?, ?, ?)',
    [numero_chip, vehiculoId, estado_chip, estado ?? 'VIGENTE', req.user!.email],
  )
  const row = await queryOne(SELECT_CHIP + ' WHERE c.id = ?', [r.insertId])
  res.status(201).json(mapChip(row))
})

router.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { numero_chip, id_vehiculo, estado } = req.body
  if (numero_chip && numero_chip.length > 15) { res.status(400).json({ error: 'numero_chip no puede superar 15 caracteres' }); return }
  const vehiculoId = id_vehiculo ? Number(id_vehiculo) : null
  const estado_chip = vehiculoId ? 'INSTALADO' : 'NO_INSTALADO'
  await run(
    'UPDATE ctv_chips SET numero_chip=?, id_vehiculo=?, estado_chip=?, estado=?, modifica_u=? WHERE id=?',
    [numero_chip, vehiculoId, estado_chip, estado ?? 'VIGENTE', req.user!.email, req.params.id],
  )
  const row = await queryOne(SELECT_CHIP + ' WHERE c.id = ?', [req.params.id])
  res.json(mapChip(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_chips WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
