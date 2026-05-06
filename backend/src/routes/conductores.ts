import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const SELECT_CONDUCTOR = `
  SELECT c.*, d.descripcion as dependencia_descripcion
  FROM ctv_conductores c
  LEFT JOIN ctv_dependencias d ON c.id_dependencia_conductor = d.id
`

function mapConductor(row: any) {
  const hoy = new Date()
  return {
    ...row,
    dependencia: row.id_dependencia_conductor
      ? { id: row.id_dependencia_conductor, descripcion: row.dependencia_descripcion }
      : null,
    licencia_vencida: row.fecha_vence_licencia ? new Date(row.fecha_vence_licencia) < hoy : false,
    th_vencida: row.fecha_vence_th ? new Date(row.fecha_vence_th) < hoy : !row.autorizacion_th,
  }
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR'), async (_req, res: Response) => {
  const rows = await query(SELECT_CONDUCTOR + ' ORDER BY c.nombre_conductor ASC')
  res.json(rows.map(mapConductor))
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR'), async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_CONDUCTOR + ' WHERE c.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Conductor no encontrado' }); return }
  res.json(mapConductor(row))
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const {
    nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia,
    fecha_vence_licencia, autorizacion_th, fecha_autorizacion_th, fecha_vence_th,
    telefono, id_dependencia_conductor,
  } = req.body

  if (!nombre_conductor || !cedula_conductor || !licencia_conduccion || !fecha_vence_licencia) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  const r = await run(
    `INSERT INTO ctv_conductores
     (nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia,
      fecha_vence_licencia, autorizacion_th, fecha_autorizacion_th, fecha_vence_th,
      telefono, id_dependencia_conductor, modifica_u)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia ?? null,
      fecha_vence_licencia, autorizacion_th ?? 0,
      fecha_autorizacion_th ?? null, fecha_vence_th ?? null,
      telefono ?? null, id_dependencia_conductor,
      req.user!.email,
    ],
  )
  const row = await queryOne(SELECT_CONDUCTOR + ' WHERE c.id = ?', [r.insertId])
  res.status(201).json(mapConductor(row))
})

router.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const {
    nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia,
    fecha_vence_licencia, autorizacion_th, fecha_autorizacion_th, fecha_vence_th,
    telefono, id_dependencia_conductor,
  } = req.body

  await run(
    `UPDATE ctv_conductores SET
     nombre_conductor=?, cedula_conductor=?, licencia_conduccion=?, categoria_licencia=?,
     fecha_vence_licencia=?, autorizacion_th=?, fecha_autorizacion_th=?, fecha_vence_th=?,
     telefono=?, id_dependencia_conductor=?, modifica_u=?
     WHERE id=?`,
    [
      nombre_conductor, cedula_conductor, licencia_conduccion, categoria_licencia ?? null,
      fecha_vence_licencia ?? null, autorizacion_th ?? 0,
      fecha_autorizacion_th ?? null, fecha_vence_th ?? null,
      telefono ?? null, id_dependencia_conductor,
      req.user!.email, id,
    ],
  )
  const row = await queryOne(SELECT_CONDUCTOR + ' WHERE c.id = ?', [id])
  res.json(mapConductor(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_conductores WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
