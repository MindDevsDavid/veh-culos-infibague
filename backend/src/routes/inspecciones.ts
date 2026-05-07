import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadFotos } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const SELECT_INSP = `
  SELECT i.*, v.placa_vehiculo AS v_placa, c.nombre_conductor
  FROM ctv_inspecciones i
  LEFT JOIN ctv_vehiculos v ON i.id_vehiculo = v.id
  LEFT JOIN ctv_conductores c ON i.id_conductor = c.id
`

function mapInsp(row: any) {
  return {
    ...row,
    vehiculo: { placa_vehiculo: row.v_placa },
    conductor: { nombre_conductor: row.nombre_conductor },
  }
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR'), async (req: Request, res: Response) => {
  const { vehiculo_id, conductor_id, tipo } = req.query
  const conditions: string[] = []
  const params: any[] = []
  if (req.user!.rol === 'CONDUCTOR') { conditions.push('i.id_conductor = (SELECT id FROM ctv_conductores WHERE id_usuario = ? LIMIT 1)'); params.push(req.user!.sub) }
  if (vehiculo_id) { conditions.push('i.id_vehiculo = ?'); params.push(vehiculo_id) }
  if (conductor_id && req.user!.rol !== 'CONDUCTOR') { conditions.push('i.id_conductor = ?'); params.push(conductor_id) }
  if (tipo) { conditions.push('i.tipo_inspeccion = ?'); params.push(tipo) }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  const rows = await query(SELECT_INSP + where + ' ORDER BY i.fecha DESC', params)
  res.json(rows.map(mapInsp))
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR'), async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_INSP + ' WHERE i.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Inspección no encontrada' }); return }
  if (req.user!.rol === 'CONDUCTOR' && (row as any).id_conductor !== req.user!.sub) {
    res.status(403).json({ error: 'Sin acceso' }); return
  }
  res.json(mapInsp(row as any))
})

router.post('/', allowRoles('ADMIN', 'CONDUCTOR'), uploadFotos.array('fotos', 4), async (req: Request, res: Response) => {
  const {
    id_vehiculo, placa_vehiculo, id_conductor, tipo_inspeccion, kilometraje,
    estado_motor, nivel_refrigerante, nivel_bateria,
    estado_llantas_delanteras, estado_llantas_traseras, presion_llantas,
    estado_eje, suspension,
    luces_delanteras, luces_traseras, direccionales, luces_freno, luces_reversa,
    bocina, tablero, frenos, cinturones,
    extintor, botiquin, kit_carretera, limpieza, carroceria, vidrios, espejos,
    nivel_aceite,
    apto_para_operar, reportado_mantenimiento, observaciones,
  } = req.body

  if (!id_vehiculo || !id_conductor || !tipo_inspeccion || !kilometraje) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  if (tipo_inspeccion === 'PREOPERACIONAL') {
    const retornando = await queryOne<any>(
      "SELECT id FROM ctv_salidas_vehiculos WHERE id_conductor = ? AND estado = 'RETORNANDO' LIMIT 1",
      [Number(id_conductor)]
    )
    if (retornando) {
      res.status(400).json({ error: 'El conductor tiene un viaje pendiente de postoperacional. Completá la inspección postoperacional antes de iniciar otro viaje.' }); return
    }

    const vehiculoOcupado = await queryOne<any>(
      "SELECT id FROM ctv_salidas_vehiculos WHERE id_vehiculo = ? AND estado IN ('PENDIENTE','AUTORIZADA','INSPECCIONADA','EN_CURSO','RETORNANDO') LIMIT 1",
      [Number(id_vehiculo)]
    )
    if (vehiculoOcupado) {
      res.status(400).json({ error: 'Este vehículo ya está en uso o tiene un viaje activo.' }); return
    }
  }

  const toBool = (v: any) => (v === true || v === 'true' || v === '1' || v === 1) ? 1 : 0
  const ahora = new Date()

  const r = await run(
    `INSERT INTO ctv_inspecciones
     (fecha, hora, id_vehiculo, placa_vehiculo, id_conductor, tipo_inspeccion, kilometraje,
      estado_motor, nivel_refrigerante, nivel_bateria,
      estado_llantas_delanteras, estado_llantas_traseras, presion_llantas,
      estado_eje, suspension,
      luces_delanteras, luces_traseras, direccionales, luces_freno, luces_reversa,
      bocina, tablero, frenos, cinturones,
      extintor, botiquin, kit_carretera, limpieza, carroceria, vidrios, espejos,
      nivel_aceite,
      apto_operar, reporte_mantenimiento, observaciones, modifica_u)
     VALUES (?, ?, ?, ?, ?, ?, ?,
             ?, ?, ?,
             ?, ?, ?,
             ?, ?,
             ?, ?, ?, ?, ?,
             ?, ?, ?, ?,
             ?, ?, ?, ?, ?, ?, ?,
             ?,
             ?, ?, ?, ?)`,
    [
      ahora, ahora, Number(id_vehiculo), placa_vehiculo ?? '', Number(id_conductor), tipo_inspeccion, Number(kilometraje),
      estado_motor ?? null, nivel_refrigerante ?? null, nivel_bateria ?? null,
      estado_llantas_delanteras ?? null, estado_llantas_traseras ?? null, presion_llantas ?? null,
      estado_eje ?? null, suspension ?? null,
      toBool(luces_delanteras), toBool(luces_traseras), toBool(direccionales), toBool(luces_freno), toBool(luces_reversa),
      toBool(bocina), toBool(tablero), frenos ?? null, toBool(cinturones),
      extintor ?? null, botiquin ?? null, kit_carretera ?? null, limpieza ?? null, carroceria ?? null, vidrios ?? null, espejos ?? null,
      nivel_aceite ?? null,
      toBool(apto_para_operar), toBool(reportado_mantenimiento), observaciones ?? null,
      req.user!.email,
    ],
  )

  const fotos = req.files as Express.Multer.File[] | undefined
  for (const foto of fotos ?? []) {
    await run(
      'INSERT INTO ctv_pdfs (nombre_tabla, id_tabla, ruta_base, ruta_logica, nombre_archivo, modifica_u) VALUES (?, ?, ?, ?, ?, ?)',
      ['ctv_inspecciones', r.insertId, 'uploads/inspecciones', `uploads/inspecciones/${foto.filename}`, foto.filename, req.user!.email],
    )
  }

  if (tipo_inspeccion === 'POSTOPERACIONAL' && toBool(reportado_mantenimiento)) {
    await run('UPDATE ctv_vehiculos SET estado=?, modifica_u=? WHERE id=?', ['EN_MANTENIMIENTO', req.user!.email, Number(id_vehiculo)])
  }

  if (tipo_inspeccion === 'POSTOPERACIONAL') {
    const salida = await queryOne<any>(
      "SELECT * FROM ctv_salidas_vehiculos WHERE id_vehiculo = ? AND estado = 'RETORNANDO' ORDER BY modifica_f DESC LIMIT 1",
      [Number(id_vehiculo)],
    )
    if (salida) {
      await run('UPDATE ctv_salidas_vehiculos SET estado=?, modifica_u=? WHERE id=?',
        ['COMPLETADA', req.user!.email, salida.id])
      await run(
        `INSERT INTO ctv_historial_uso
         (id_vehiculo, id_salida, fecha, kilometraje_inicial, kilometraje_final, horas_inicial, horas_final, cantidad_recorridos, observaciones, modifica_u)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Number(id_vehiculo), salida.id, ahora,
          salida.kilometraje_salida, Number(kilometraje),
          null, null,
          Number(kilometraje) - salida.kilometraje_salida,
          observaciones ?? null, req.user!.email,
        ],
      )
    }
  }

  const row = await queryOne(SELECT_INSP + ' WHERE i.id = ?', [r.insertId])
  res.status(201).json(mapInsp(row as any))
})

export default router
