import { Router, Request, Response } from 'express'
import { query, queryOne, run, transaction } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadPdf } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const SELECT_REQ = `
  SELECT r.*, v.placa_vehiculo AS v_placa, t.descripcion AS tipo_req_desc
  FROM ctv_control_requisitos r
  LEFT JOIN ctv_vehiculos v ON r.id_vehiculo = v.id
  LEFT JOIN ctv_tipos_requisito t ON r.id_tipo_requisito = t.id
`

function mapReq(row: any) {
  const hoy = new Date()
  return {
    ...row,
    vehiculo: { placa_vehiculo: row.v_placa },
    tipo_requisito: { id: row.id_tipo_requisito, descripcion: row.tipo_req_desc },
    dias_para_vencer: row.fecha_vencimiento
      ? Math.ceil((new Date(row.fecha_vencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { vehiculo_id, vencidos } = req.query
  const conditions: string[] = []
  const params: any[] = []
  if (vehiculo_id) { conditions.push('r.id_vehiculo = ?'); params.push(vehiculo_id) }
  if (vencidos === 'true') { conditions.push("r.estado_requisito = 'VENCIDO'") }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  const rows = await query(SELECT_REQ + where + ' ORDER BY r.fecha_vencimiento ASC', params)
  res.json(rows.map(mapReq))
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_REQ + ' WHERE r.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Requisito no encontrado' }); return }
  res.json(mapReq(row))
})

router.post('/', allowRoles('ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const { id_vehiculo, id_tipo_requisito, numero_requisito, empresa_expide, fecha_expedicion, fecha_vencimiento, observacion } = req.body
  if (!id_vehiculo || !id_tipo_requisito || !numero_requisito || !fecha_vencimiento) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  const hoy = new Date()
  const vence = new Date(fecha_vencimiento)
  const estado_requisito = vence < hoy ? 'VENCIDO' : 'VIGENTE'

  const r = await run(
    `INSERT INTO ctv_control_requisitos
     (id_vehiculo, id_tipo_requisito, numero_requisito, empresa_expide, fecha_expedicion, fecha_vencimiento, estado_requisito, observacion, modifica_u)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [Number(id_vehiculo), Number(id_tipo_requisito), numero_requisito, empresa_expide ?? null, fecha_expedicion ?? null, vence, estado_requisito, observacion ?? null, req.user!.email],
  )

  if (req.file) {
    const fileBuffer = req.file.buffer
    const fileName = req.file.originalname
    const insertId = r.insertId
    const email = req.user!.email
    await transaction(async conn => {
      await conn.query('SET SESSION max_allowed_packet = 67108864')
      await conn.query(
        'INSERT INTO ctv_pdfs (nombre_tabla, id_tabla, nombre_archivo, contenido, modifica_u) VALUES (?, ?, ?, ?, ?)',
        ['ctv_control_requisitos', insertId, fileName, fileBuffer, email],
      )
    })
  }

  const row = await queryOne(SELECT_REQ + ' WHERE r.id = ?', [r.insertId])
  res.status(201).json(mapReq(row))
})

router.put('/:id', allowRoles('ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { id_tipo_requisito, numero_requisito, empresa_expide, fecha_expedicion, fecha_vencimiento, observacion } = req.body

  const hoy = new Date()
  const vence = fecha_vencimiento ? new Date(fecha_vencimiento) : null
  const estado_requisito = vence ? (vence < hoy ? 'VENCIDO' : 'VIGENTE') : null

  await run(
    `UPDATE ctv_control_requisitos SET
     id_tipo_requisito=?, numero_requisito=?, empresa_expide=?,
     fecha_expedicion=?, fecha_vencimiento=?, estado_requisito=?, observacion=?, modifica_u=?
     WHERE id=?`,
    [
      id_tipo_requisito ? Number(id_tipo_requisito) : null,
      numero_requisito ?? null, empresa_expide ?? null,
      fecha_expedicion ?? null, vence, estado_requisito, observacion ?? null,
      req.user!.email, id,
    ],
  )

  if (req.file) {
    const fileBuffer = req.file.buffer
    const fileName = req.file.originalname
    const email = req.user!.email
    const old = await queryOne<any>("SELECT id FROM ctv_pdfs WHERE nombre_tabla='ctv_control_requisitos' AND id_tabla=?", [id])
    await transaction(async conn => {
      await conn.query('SET SESSION max_allowed_packet = 67108864')
      if (old) {
        await conn.query('UPDATE ctv_pdfs SET nombre_archivo=?, contenido=?, modifica_u=? WHERE id=?',
          [fileName, fileBuffer, email, old.id])
      } else {
        await conn.query('INSERT INTO ctv_pdfs (nombre_tabla, id_tabla, nombre_archivo, contenido, modifica_u) VALUES (?, ?, ?, ?, ?)',
          ['ctv_control_requisitos', id, fileName, fileBuffer, email])
      }
    })
  }

  const row = await queryOne(SELECT_REQ + ' WHERE r.id = ?', [id])
  res.json(mapReq(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  await run("DELETE FROM ctv_pdfs WHERE nombre_tabla='ctv_control_requisitos' AND id_tabla=?", [id])
  await run('DELETE FROM ctv_control_requisitos WHERE id = ?', [id])
  res.json({ ok: true })
})

router.get('/:id/archivo', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const pdf = await queryOne<any>("SELECT nombre_archivo, contenido FROM ctv_pdfs WHERE nombre_tabla='ctv_control_requisitos' AND id_tabla=?", [req.params.id])
  if (!pdf || !pdf.contenido) { res.status(404).json({ error: 'Archivo no encontrado' }); return }
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${pdf.nombre_archivo}"`)
  res.send(pdf.contenido)
})

export default router
