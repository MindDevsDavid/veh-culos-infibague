import { Router, Request, Response } from 'express'
import { query, queryOne, run, transaction } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadPdf } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const SELECT_T = `
  SELECT t.*, v.placa_vehiculo AS v_placa, c.nombre_conductor, u.nombre AS autorizador_nombre
  FROM ctv_control_tanqueada t
  LEFT JOIN ctv_vehiculos v ON t.id_vehiculo = v.id
  LEFT JOIN ctv_conductores c ON t.id_conductor_tanqueo = c.id
  LEFT JOIN usuarios u ON t.id_autorizador = u.id
`

function mapT(row: any) {
  return {
    ...row,
    vehiculo: { placa_vehiculo: row.v_placa },
    conductor: { nombre_conductor: row.nombre_conductor },
    autorizador: row.autorizador_nombre ? { nombre: row.autorizador_nombre } : null,
  }
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR', 'ALMACENISTA', 'CONDUCTOR', 'CONSULTAS'), async (req: Request, res: Response) => {
  const { vehiculo_id, salida_id } = req.query
  const conditions: string[] = []
  const params: any[] = []

  if (req.user!.rol === 'CONDUCTOR') {
    conditions.push('t.id_conductor_tanqueo = (SELECT id FROM ctv_conductores WHERE id_usuario = ? LIMIT 1)')
    params.push(req.user!.sub)
  }
  if (vehiculo_id) { conditions.push('t.id_vehiculo = ?'); params.push(vehiculo_id) }
  if (salida_id) { conditions.push('t.id_salida = ?'); params.push(salida_id) }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  const rows = await query(SELECT_T + where + ' ORDER BY t.modifica_f DESC', params)
  res.json(rows.map(mapT))
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR', 'ALMACENISTA', 'CONDUCTOR', 'CONSULTAS'), async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_T + ' WHERE t.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Tanqueo no encontrado' }); return }
  res.json(mapT(row))
})

// Guarda PDF adjunto en ctv_pdfs (insert o update) para un tanqueo
async function guardarPdfTanqueo(idTanqueo: number, file: Express.Multer.File, email: string) {
  const old = await queryOne<any>("SELECT id FROM ctv_pdfs WHERE nombre_tabla='ctv_control_tanqueada' AND id_tabla=?", [idTanqueo])
  await transaction(async conn => {
    await conn.query('SET SESSION max_allowed_packet = 67108864')
    if (old) {
      await conn.query('UPDATE ctv_pdfs SET nombre_archivo=?, contenido=?, modifica_u=? WHERE id=?',
        [file.originalname, file.buffer, email, old.id])
    } else {
      await conn.query(
        'INSERT INTO ctv_pdfs (nombre_tabla, id_tabla, nombre_archivo, contenido, modifica_u) VALUES (?, ?, ?, ?, ?)',
        ['ctv_control_tanqueada', idTanqueo, file.originalname, file.buffer, email],
      )
    }
  })
}

// CONDUCTOR solicita tanqueo — auto-fill desde viaje activo
router.post('/solicitar', allowRoles('CONDUCTOR', 'ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const { tipo_combustible, cantidad_galones } = req.body
  if (!cantidad_galones) { res.status(400).json({ error: 'cantidad_galones es requerido' }); return }
  if (!req.file) { res.status(400).json({ error: 'El documento PDF es obligatorio' }); return }

  const conductor = await queryOne<any>(
    'SELECT id FROM ctv_conductores WHERE id_usuario = ? LIMIT 1',
    [req.user!.sub]
  )
  if (!conductor) { res.status(404).json({ error: 'Conductor no encontrado' }); return }

  const viajeActivo = await queryOne<any>(
    "SELECT id, id_vehiculo, placa_vehiculo FROM ctv_salidas_vehiculos WHERE id_conductor = ? AND estado IN ('PENDIENTE','AUTORIZADA','INSPECCIONADA','EN_CURSO') ORDER BY modifica_f DESC LIMIT 1",
    [conductor.id]
  )
  if (!viajeActivo) {
    res.status(400).json({ error: 'No tienes un viaje activo. Solo puedes solicitar un tanqueo después del preoperacional y antes del postoperacional.' }); return
  }

  const r = await run(
    `INSERT INTO ctv_control_tanqueada
     (id_vehiculo, id_salida, placa_vehiculo, fecha_tanqueo, tipo_combustible, cantidad_galones, id_conductor_tanqueo, estado, modifica_u)
     VALUES (?, ?, ?, NOW(), ?, ?, ?, 'PENDIENTE', ?)`,
    [viajeActivo.id_vehiculo, viajeActivo.id, viajeActivo.placa_vehiculo,
     tipo_combustible ?? null, Number(cantidad_galones), conductor.id, req.user!.email]
  )

  if (req.file) await guardarPdfTanqueo(r.insertId, req.file, req.user!.email)

  const row = await queryOne(SELECT_T + ' WHERE t.id = ?', [r.insertId])
  res.status(201).json(mapT(row))
})

// Descargar PDF adjunto del tanqueo
router.get('/:id/archivo', allowRoles('ADMIN', 'AUTORIZADOR', 'ALMACENISTA', 'CONDUCTOR', 'CONSULTAS'), async (req: Request, res: Response) => {
  const pdf = await queryOne<any>(
    "SELECT nombre_archivo, contenido FROM ctv_pdfs WHERE nombre_tabla='ctv_control_tanqueada' AND id_tabla=?",
    [req.params.id],
  )
  if (!pdf) { res.status(404).json({ error: 'No hay archivo adjunto' }); return }
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="${pdf.nombre_archivo}"`)
  res.send(pdf.contenido)
})

// ALMACENISTA / ADMIN autoriza
router.put('/:id/autorizar', allowRoles('ADMIN', 'ALMACENISTA'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const tanqueo = await queryOne<any>('SELECT estado FROM ctv_control_tanqueada WHERE id = ?', [id])
  if (!tanqueo) { res.status(404).json({ error: 'Tanqueo no encontrado' }); return }
  if (tanqueo.estado !== 'PENDIENTE') { res.status(400).json({ error: `No se puede autorizar en estado ${tanqueo.estado}` }); return }

  await run(
    "UPDATE ctv_control_tanqueada SET estado='AUTORIZADA', id_autorizador=?, modifica_u=? WHERE id=?",
    [req.user!.sub, req.user!.email, id]
  )
  const row = await queryOne(SELECT_T + ' WHERE t.id = ?', [id])
  res.json(mapT(row))
})

// ADMIN: registro manual (ya autorizado)
router.post('/', allowRoles('ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const { id_vehiculo, id_salida, placa_vehiculo, fecha_tanqueo, tipo_combustible, cantidad_galones, id_conductor_tanqueo } = req.body
  if (!id_vehiculo || !id_salida || !cantidad_galones) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }
  if (!req.file) { res.status(400).json({ error: 'El documento PDF es obligatorio' }); return }
  const r = await run(
    `INSERT INTO ctv_control_tanqueada
     (id_vehiculo, id_salida, placa_vehiculo, fecha_tanqueo, tipo_combustible, cantidad_galones, id_conductor_tanqueo, id_autorizador, estado, modifica_u)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AUTORIZADA', ?)`,
    [id_vehiculo, id_salida, placa_vehiculo ?? '', fecha_tanqueo ? new Date(fecha_tanqueo) : new Date(),
     tipo_combustible ?? null, cantidad_galones, id_conductor_tanqueo ? Number(id_conductor_tanqueo) : null, req.user!.sub, req.user!.email]
  )

  if (req.file) await guardarPdfTanqueo(r.insertId, req.file, req.user!.email)

  const row = await queryOne(SELECT_T + ' WHERE t.id = ?', [r.insertId])
  res.status(201).json(mapT(row))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_control_tanqueada WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
