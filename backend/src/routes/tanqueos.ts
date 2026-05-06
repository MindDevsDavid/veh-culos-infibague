import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const SELECT_T = `
  SELECT t.*, v.placa_vehiculo AS v_placa, c.nombre_conductor, u.nombre AS autorizador_nombre
  FROM ctv_control_tanqueo t
  LEFT JOIN ctv_vehiculos v ON t.id_vehiculo = v.id
  LEFT JOIN ctv_conductores c ON t.id_conductor_tanqueo = c.id
  LEFT JOIN usuarios u ON t.id_autorizador = u.id
`

function mapT(row: any) {
  return {
    ...row,
    vehiculo: { placa_vehiculo: row.v_placa },
    conductor: { nombre_conductor: row.nombre_conductor },
    autorizador: { nombre: row.autorizador_nombre },
  }
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { vehiculo_id, salida_id } = req.query
  const conditions: string[] = []
  const params: any[] = []
  if (vehiculo_id) { conditions.push('t.id_vehiculo = ?'); params.push(vehiculo_id) }
  if (salida_id) { conditions.push('t.id_salida = ?'); params.push(salida_id) }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  const rows = await query(SELECT_T + where + ' ORDER BY t.fecha_tanqueo DESC', params)
  res.json(rows.map(mapT))
})

router.post('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { id_vehiculo, id_salida, placa_vehiculo, fecha_tanqueo, tipo_combustible, cantidad_galones, id_conductor_tanqueo } = req.body
  if (!id_vehiculo || !id_salida || !cantidad_galones) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }
  const r = await run(
    `INSERT INTO ctv_control_tanqueo
     (id_vehiculo, id_salida, placa_vehiculo, fecha_tanqueo, tipo_combustible, cantidad_galones, id_conductor_tanqueo, id_autorizador, modifica_u)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_vehiculo, id_salida, placa_vehiculo ?? '', fecha_tanqueo ? new Date(fecha_tanqueo) : new Date(), tipo_combustible ?? null, cantidad_galones, id_conductor_tanqueo ?? null, req.user!.sub, req.user!.email],
  )
  const row = await queryOne(SELECT_T + ' WHERE t.id = ?', [r.insertId])
  res.status(201).json(mapT(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_control_tanqueo WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
