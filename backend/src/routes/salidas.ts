import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadFotosSalida } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const SELECT_S = `
  SELECT s.*,
    v.id AS v_id, v.placa_vehiculo AS v_placa, v.linea AS v_linea,
    tv.descripcion AS v_tipo_desc, mk.descripcion AS v_marca_desc,
    c.nombre_conductor, c.cedula_conductor,
    ua.nombre AS autorizador_nombre,
    uvs.nombre AS vigilante_salida_nombre,
    uve.nombre AS vigilante_entrada_nombre,
    d.descripcion AS dependencia_desc,
    insp.id AS insp_id, insp.tipo_inspeccion, insp.apto_operar AS apto_para_operar, insp.kilometraje AS insp_km
  FROM ctv_salidas_vehiculos s
  LEFT JOIN ctv_vehiculos v ON s.id_vehiculo = v.id
  LEFT JOIN ctv_tipo_vehiculos tv ON v.id_tipo_vehiculo = tv.id
  LEFT JOIN ctv_marcas mk ON v.id_marca = mk.id
  LEFT JOIN ctv_conductores c ON s.id_conductor = c.id
  LEFT JOIN usuarios ua ON s.id_autorizado_por = ua.id
  LEFT JOIN usuarios uvs ON s.id_vigilante_salida = uvs.id
  LEFT JOIN usuarios uve ON s.id_vigilante_entrada = uve.id
  LEFT JOIN ctv_dependencias d ON s.id_dependencia_uso = d.id
  LEFT JOIN ctv_inspecciones insp ON s.id_inspeccion = insp.id
`

async function mapSalida(row: any) {
  const fotos = await query('SELECT * FROM ctv_fotos_salida_entrada WHERE id_salida = ?', [row.id])
  return {
    ...row,
    vehiculo: { id: row.v_id, placa_vehiculo: row.v_placa, linea: row.v_linea, tipo_vehiculo: { descripcion: row.v_tipo_desc }, marca: { descripcion: row.v_marca_desc } },
    conductor: { nombre_conductor: row.nombre_conductor, cedula_conductor: row.cedula_conductor },
    autorizador: row.id_autorizado_por ? { nombre: row.autorizador_nombre } : null,
    vigilante_salida: row.id_vigilante_salida ? { nombre: row.vigilante_salida_nombre } : null,
    vigilante_entrada: row.id_vigilante_entrada ? { nombre: row.vigilante_entrada_nombre } : null,
    dependencia_uso: { descripcion: row.dependencia_desc },
    inspeccion_pre: row.insp_id ? { id: row.insp_id, tipo_inspeccion: row.tipo_inspeccion, apto_para_operar: row.apto_para_operar, kilometraje: row.insp_km } : null,
    fotos,
  }
}

async function mapSalidas(rows: any[]) {
  return Promise.all(rows.map(mapSalida))
}

async function validarParaSalida(id_vehiculo: number, id_conductor: number): Promise<string | null> {
  const vencidos = await query(
    `SELECT cr.*, t.descripcion AS tipo_desc FROM ctv_control_requisitos cr
     LEFT JOIN ctv_tipos_requisito t ON cr.id_tipo_requisito = t.id
     WHERE cr.id_vehiculo = ? AND cr.estado_requisito = 'VENCIDO'`,
    [id_vehiculo],
  )
  if (vencidos.length > 0) {
    const lista = vencidos.map((v: any) => v.tipo_desc).join(', ')
    return `Vehículo tiene requisitos vencidos: ${lista}`
  }

  const vehiculo = await queryOne<any>('SELECT * FROM ctv_vehiculos WHERE id = ?', [id_vehiculo])
  if (!vehiculo) return 'Vehículo no encontrado'
  if (vehiculo.estado !== 'ACTIVO') return `Vehículo en estado ${vehiculo.estado}, no puede salir`

  const conductor = await queryOne<any>('SELECT * FROM ctv_conductores WHERE id = ?', [id_conductor])
  if (!conductor) return 'Conductor no encontrado'
  if (!conductor.autorizacion_th) return 'Conductor no tiene autorización TH'
  if (conductor.fecha_vence_th && new Date(conductor.fecha_vence_th) < new Date()) {
    return `Autorización TH del conductor vencida el ${new Date(conductor.fecha_vence_th).toLocaleDateString('es-CO')}`
  }

  return null
}

router.get('/', async (req: Request, res: Response) => {
  const { estado, vehiculo_id } = req.query
  const rol = req.user!.rol
  const userId = req.user!.sub

  const conditions: string[] = []
  const params: any[] = []

  if (vehiculo_id) { conditions.push('s.id_vehiculo = ?'); params.push(vehiculo_id) }
  if (estado) { conditions.push('s.estado = ?'); params.push(estado) }

  if (rol === 'CONDUCTOR') { conditions.push('s.id_conductor = (SELECT id FROM ctv_conductores WHERE id_usuario = ? LIMIT 1)'); params.push(userId) }
  if (rol === 'VIGILANTE') { conditions.push("s.estado IN ('AUTORIZADA','INSPECCIONADA','EN_CURSO','RETORNANDO')") }
  if (rol === 'CONSULTAS') { conditions.push("s.estado = 'EN_CURSO'") }

  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  const rows = await query(SELECT_S + where + ' ORDER BY s.modifica_f DESC', params)
  res.json(await mapSalidas(rows))
})

router.get('/en-curso', allowRoles('ADMIN', 'AUTORIZADOR', 'CONSULTAS'), async (_req, res: Response) => {
  const rows = await query(SELECT_S + " WHERE s.estado = 'EN_CURSO' ORDER BY s.hora_salida DESC")
  res.json(await mapSalidas(rows))
})

router.get('/:id', async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_S + ' WHERE s.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (req.user!.rol === 'CONDUCTOR' && (row as any).id_conductor !== req.user!.sub) {
    res.status(403).json({ error: 'Sin acceso' }); return
  }
  res.json(await mapSalida(row as any))
})

router.post('/', allowRoles('ADMIN', 'CONDUCTOR'), async (req: Request, res: Response) => {
  const { id_vehiculo, id_conductor, id_inspeccion, fecha_salida, motivo_salida, lugar_destino, kilometraje_salida, firma, id_dependencia_uso, observaciones } = req.body

  if (!id_vehiculo || !id_conductor || !motivo_salida || !lugar_destino || !id_dependencia_uso) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  const error = await validarParaSalida(Number(id_vehiculo), Number(id_conductor))
  if (error) { res.status(422).json({ error }); return }

  if (id_inspeccion) {
    const insp = await queryOne<any>('SELECT * FROM ctv_inspecciones WHERE id = ?', [id_inspeccion])
    if (!insp) { res.status(400).json({ error: 'Inspección preoperacional no encontrada' }); return }
    if (!insp.apto_operar) { res.status(422).json({ error: 'Inspección preoperacional indica vehículo NO apto para operar' }); return }
    if (insp.tipo_inspeccion !== 'PREOPERACIONAL') { res.status(400).json({ error: 'La inspección debe ser PREOPERACIONAL' }); return }
  }

  const vehiculo = await queryOne<any>('SELECT placa_vehiculo FROM ctv_vehiculos WHERE id = ?', [id_vehiculo])

  const r = await run(
    `INSERT INTO ctv_salidas_vehiculos
     (id_vehiculo, placa_vehiculo, id_conductor, id_inspeccion, fecha_salida, motivo_salida,
      lugar_destino, kilometraje_salida, firma, id_dependencia_uso, observaciones, estado, modifica_u)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
    [
      Number(id_vehiculo), vehiculo!.placa_vehiculo, Number(id_conductor),
      id_inspeccion ? Number(id_inspeccion) : null,
      fecha_salida ? new Date(fecha_salida) : new Date(),
      motivo_salida, lugar_destino, Number(kilometraje_salida),
      firma ?? null, Number(id_dependencia_uso), observaciones ?? null,
      req.user!.email,
    ],
  )
  const row = await queryOne(SELECT_S + ' WHERE s.id = ?', [r.insertId])
  res.status(201).json(await mapSalida(row as any))
})

router.put('/:id/autorizar', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const salida = await queryOne<any>('SELECT estado FROM ctv_salidas_vehiculos WHERE id = ?', [id])
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (salida.estado !== 'PENDIENTE') { res.status(400).json({ error: `No se puede autorizar en estado ${salida.estado}` }); return }

  await run('UPDATE ctv_salidas_vehiculos SET estado=?, id_autorizado_por=?, modifica_u=? WHERE id=?',
    ['AUTORIZADA', req.user!.sub, req.user!.email, id])
  const row = await queryOne(SELECT_S + ' WHERE s.id = ?', [id])
  res.json(await mapSalida(row as any))
})

router.put('/:id/rechazar', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { motivo_rechazo } = req.body
  if (!motivo_rechazo) { res.status(400).json({ error: 'motivo_rechazo requerido' }); return }

  const salida = await queryOne<any>('SELECT estado FROM ctv_salidas_vehiculos WHERE id = ?', [id])
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (!['PENDIENTE', 'AUTORIZADA'].includes(salida.estado)) {
    res.status(400).json({ error: `No se puede rechazar en estado ${salida.estado}` }); return
  }

  await run('UPDATE ctv_salidas_vehiculos SET estado=?, motivo_rechazo=?, id_autorizado_por=?, modifica_u=? WHERE id=?',
    ['RECHAZADA', motivo_rechazo, req.user!.sub, req.user!.email, id])
  const row = await queryOne(SELECT_S + ' WHERE s.id = ?', [id])
  res.json(await mapSalida(row as any))
})

router.put('/:id/check-salida', allowRoles('ADMIN', 'VIGILANTE'), uploadFotosSalida.array('fotos', 2), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const salida = await queryOne<any>('SELECT * FROM ctv_salidas_vehiculos WHERE id = ?', [id])
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (!['AUTORIZADA', 'INSPECCIONADA'].includes(salida.estado)) {
    res.status(400).json({ error: `No se puede hacer check-salida en estado ${salida.estado}` }); return
  }

  const ahora = new Date()
  await run('UPDATE ctv_salidas_vehiculos SET estado=?, hora_salida=?, id_vigilante_salida=?, modifica_u=? WHERE id=?',
    ['EN_CURSO', ahora, req.user!.sub, req.user!.email, id])

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      await run(
        'INSERT INTO ctv_fotos_salida_entrada (id_salida, id_vehiculo, id_subido_por, tipo_accion, ruta_base, ruta_logica, nombre_foto, modifica_u) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, salida.id_vehiculo, req.user!.sub, 'SALIDA', file.destination, file.path, file.filename, req.user!.email],
      )
    }
  }

  const row = await queryOne(SELECT_S + ' WHERE s.id = ?', [id])
  res.json(await mapSalida(row as any))
})

router.put('/:id/check-entrada', allowRoles('ADMIN', 'VIGILANTE'), uploadFotosSalida.array('fotos', 2), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const salida = await queryOne<any>('SELECT * FROM ctv_salidas_vehiculos WHERE id = ?', [id])
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (salida.estado !== 'EN_CURSO') {
    res.status(400).json({ error: `No se puede hacer check-entrada en estado ${salida.estado}` }); return
  }

  const ahora = new Date()
  await run('UPDATE ctv_salidas_vehiculos SET estado=?, hora_entrada=?, fecha_entrada=?, id_vigilante_entrada=?, modifica_u=? WHERE id=?',
    ['RETORNANDO', ahora, ahora, req.user!.sub, req.user!.email, id])

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      await run(
        'INSERT INTO ctv_fotos_salida_entrada (id_salida, id_vehiculo, id_subido_por, tipo_accion, ruta_base, ruta_logica, nombre_foto, modifica_u) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, salida.id_vehiculo, req.user!.sub, 'ENTRADA', file.destination, file.path, file.filename, req.user!.email],
      )
    }
  }

  const row = await queryOne(SELECT_S + ' WHERE s.id = ?', [id])
  res.json(await mapSalida(row as any))
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_salidas_vehiculos WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
