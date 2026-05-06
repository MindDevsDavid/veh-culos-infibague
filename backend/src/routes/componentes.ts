import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const SELECT_CC = `
  SELECT cc.*, c.descripcion AS componente_desc
  FROM ctv_control_componentes cc
  LEFT JOIN ctv_componentes c ON cc.id_componente = c.id
`

function mapCC(row: any) {
  return { ...row, componente: { id: row.id_componente, descripcion: row.componente_desc } }
}

router.get('/vehiculo/:vehiculoId', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const rows = await query(SELECT_CC + ' WHERE cc.id_vehiculo = ?', [req.params.vehiculoId])
  res.json(rows.map(mapCC))
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { id_vehiculo, id_componente, placa } = req.body
  if (!id_vehiculo || !id_componente) { res.status(400).json({ error: 'Faltan campos requeridos' }); return }
  const r = await run(
    'INSERT INTO ctv_control_componentes (id_vehiculo, id_componente, placa, modifica_u) VALUES (?, ?, ?, ?)',
    [id_vehiculo, id_componente, placa ?? '', req.user!.email],
  )
  const row = await queryOne(SELECT_CC + ' WHERE cc.id = ?', [r.insertId])
  res.status(201).json(mapCC(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_control_componentes WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
