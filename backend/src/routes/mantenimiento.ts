import { Router, Request, Response } from 'express'
import { query, queryOne, run, transaction } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadPdf } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const SELECT_MANT = `
  SELECT m.*, v.placa_vehiculo, v.linea, mk.descripcion AS marca_desc
  FROM ctv_mantenimientos m
  LEFT JOIN ctv_vehiculos v ON m.id_vehiculo = v.id
  LEFT JOIN ctv_marcas mk ON v.id_marca = mk.id
`

function mapMant(row: any) {
  return {
    ...row,
    vehiculo: { placa_vehiculo: row.placa_vehiculo, linea: row.linea, marca: { descripcion: row.marca_desc } },
  }
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { vehiculo_id } = req.query
  const sql = SELECT_MANT + (vehiculo_id ? ' WHERE m.id_vehiculo = ?' : '') + ' ORDER BY m.fecha_ingreso DESC'
  const rows = await query(sql, vehiculo_id ? [vehiculo_id] : [])
  res.json(rows.map(mapMant))
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_MANT + ' WHERE m.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Mantenimiento no encontrado' }); return }
  res.json(mapMant(row))
})

router.post('/', allowRoles('ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const { id_vehiculo, tipo_mantenimiento, descripcion, fecha_ingreso, kilometraje_ingreso, horas_ingreso, proveedor_taller, observacion_ingreso } = req.body
  if (!id_vehiculo || !tipo_mantenimiento || !fecha_ingreso) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  await run('UPDATE ctv_vehiculos SET estado=?, modifica_u=? WHERE id=?', ['EN_MANTENIMIENTO', req.user!.email, id_vehiculo])

  const r = await run(
    `INSERT INTO ctv_mantenimientos
     (id_vehiculo, tipo_mantenimiento, descripcion, fecha_ingreso, kilometraje_ingreso, horas_ingreso, proveedor_taller, observacion_ingreso, modifica_u)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id_vehiculo, tipo_mantenimiento, descripcion, fecha_ingreso, kilometraje_ingreso ?? null, horas_ingreso ?? null, proveedor_taller, observacion_ingreso ?? null, req.user!.email],
  )

  if (req.file) {
    await transaction(async conn => {
      await conn.query('SET SESSION max_allowed_packet = 67108864')
      await conn.query(
        'INSERT INTO ctv_pdfs (nombre_tabla, id_tabla, nombre_archivo, contenido, modifica_u) VALUES (?, ?, ?, ?, ?)',
        ['ctv_mantenimientos', r.insertId, req.file!.originalname, req.file!.buffer, req.user!.email],
      )
    })
  }

  const row = await queryOne(SELECT_MANT + ' WHERE m.id = ?', [r.insertId])
  res.status(201).json(mapMant(row))
})

router.get('/:id/archivo', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const pdf = await queryOne<any>(
    "SELECT nombre_archivo, contenido FROM ctv_pdfs WHERE nombre_tabla='ctv_mantenimientos' AND id_tabla=?",
    [req.params.id],
  )
  if (!pdf) { res.status(404).json({ error: 'No hay archivo adjunto' }); return }
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${pdf.nombre_archivo}"`)
  res.send(pdf.contenido)
})

router.put('/:id', allowRoles('ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const {
    tipo_mantenimiento, descripcion, fecha_ingreso, kilometraje_ingreso, horas_ingreso,
    proveedor_taller, observacion_ingreso, fecha_salida, kilometraje_salida,
    horas_salida, observacion_salida, fecha_factura, numero_factura, valor_factura,
  } = req.body

  await run(
    `UPDATE ctv_mantenimientos SET
     tipo_mantenimiento=?, descripcion=?, fecha_ingreso=?, kilometraje_ingreso=?, horas_ingreso=?,
     proveedor_taller=?, observacion_ingreso=?, fecha_salida=?, kilometraje_salida=?,
     horas_salida=?, observacion_salida=?, fecha_factura=?, numero_factura=?, valor_factura=?, modifica_u=?
     WHERE id=?`,
    [
      tipo_mantenimiento, descripcion, fecha_ingreso ?? null, kilometraje_ingreso ?? null, horas_ingreso ?? null,
      proveedor_taller, observacion_ingreso ?? null,
      fecha_salida ?? null, kilometraje_salida ?? null,
      horas_salida ?? null, observacion_salida ?? null,
      fecha_factura ?? null, numero_factura ?? null, valor_factura ?? null,
      req.user!.email, id,
    ],
  )

  if (req.file) {
    const old = await queryOne<any>("SELECT id FROM ctv_pdfs WHERE nombre_tabla='ctv_mantenimientos' AND id_tabla=?", [id])
    await transaction(async conn => {
      await conn.query('SET SESSION max_allowed_packet = 67108864')
      if (old) {
        await conn.query('UPDATE ctv_pdfs SET nombre_archivo=?, contenido=?, modifica_u=? WHERE id=?',
          [req.file!.originalname, req.file!.buffer, req.user!.email, old.id])
      } else {
        await conn.query(
          'INSERT INTO ctv_pdfs (nombre_tabla, id_tabla, nombre_archivo, contenido, modifica_u) VALUES (?, ?, ?, ?, ?)',
          ['ctv_mantenimientos', id, req.file!.originalname, req.file!.buffer, req.user!.email],
        )
      }
    })
  }

  if (fecha_salida) {
    const row_m = await queryOne<any>('SELECT id_vehiculo FROM ctv_mantenimientos WHERE id = ?', [id])
    if (row_m) await run('UPDATE ctv_vehiculos SET estado=?, modifica_u=? WHERE id=?', ['ACTIVO', req.user!.email, row_m.id_vehiculo])
  }

  const row = await queryOne(SELECT_MANT + ' WHERE m.id = ?', [id])
  res.json(mapMant(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_mantenimientos WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
