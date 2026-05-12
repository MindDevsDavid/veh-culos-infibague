import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const SELECT_CC = `
  SELECT cc.*, tc.nombre_componente, tc.descripcion_componente,
    v.placa_vehiculo, v.linea
  FROM ctv_control_componentes cc
  LEFT JOIN ctv_tipos_componente tc ON cc.id_tipo_componente = tc.id
  LEFT JOIN ctv_vehiculos v ON cc.id_vehiculo = v.id
`

function mapCC(row: any) {
  return {
    ...row,
    tipo_componente: row.id_tipo_componente
      ? { id: row.id_tipo_componente, nombre_componente: row.nombre_componente, descripcion_componente: row.descripcion_componente }
      : null,
    vehiculo: row.id_vehiculo
      ? { id: row.id_vehiculo, placa_vehiculo: row.placa_vehiculo, linea: row.linea }
      : null,
  }
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (_req, res: Response) => {
  const rows = await query(SELECT_CC + ' ORDER BY v.placa_vehiculo ASC, tc.nombre_componente ASC')
  res.json(rows.map(mapCC))
})

router.get('/vehiculo/:vehiculoId', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const rows = await query(SELECT_CC + ' WHERE cc.id_vehiculo = ?', [req.params.vehiculoId])
  res.json(rows.map(mapCC))
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { id_vehiculo, id_tipo_componente } = req.body
  if (!id_vehiculo || !id_tipo_componente) {
    res.status(400).json({ error: 'id_vehiculo e id_tipo_componente son requeridos' }); return
  }
  const r = await run(
    'INSERT INTO ctv_control_componentes (id_vehiculo, id_tipo_componente, modifica_u) VALUES (?, ?, ?)',
    [Number(id_vehiculo), Number(id_tipo_componente), req.user!.email],
  )
  const row = await queryOne(SELECT_CC + ' WHERE cc.id = ?', [r.insertId])
  res.status(201).json(mapCC(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_control_componentes WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
