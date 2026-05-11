import { Router, Request, Response } from 'express'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const SELECT_VEHICULO = `
  SELECT v.*,
    tv.descripcion AS tipo_vehiculo_desc,
    m.descripcion  AS marca_desc,
    c.descripcion  AS color_desc,
    d.descripcion  AS dependencia_desc,
    ch.numero_chip, ch.estado_chip, ch.estado AS chip_estado
  FROM ctv_vehiculos v
  LEFT JOIN ctv_tipo_vehiculos tv ON v.id_tipo_vehiculo = tv.id
  LEFT JOIN ctv_marcas m ON v.id_marca = m.id
  LEFT JOIN ctv_color c ON v.id_color = c.id
  LEFT JOIN ctv_dependencias d ON v.id_dependencia_asignada = d.id
  LEFT JOIN ctv_chips ch ON v.id_chip_asignado = ch.id
`

async function attachRequisitos(vehiculos: any[]) {
  if (vehiculos.length === 0) return vehiculos
  const ids = vehiculos.map(v => v.id)
  const reqs = await query(
    `SELECT cr.*, tr.descripcion AS tipo_req_desc
     FROM ctv_control_requisitos cr
     LEFT JOIN ctv_tipos_requisito tr ON cr.id_tipo_requisito = tr.id
     WHERE cr.id_vehiculo IN (?)`,
    [ids],
  )
  return vehiculos.map(v => ({
    ...v,
    tipo_vehiculo: { id: v.id_tipo_vehiculo, descripcion: v.tipo_vehiculo_desc },
    marca: { id: v.id_marca, descripcion: v.marca_desc },
    color: { id: v.id_color, descripcion: v.color_desc },
    dependencia: { id: v.id_dependencia_asignada, descripcion: v.dependencia_desc },
    chip: v.id_chip_asignado ? { id: v.id_chip_asignado, numero_chip: v.numero_chip, estado_chip: v.estado_chip, estado: v.chip_estado } : null,
    requisitos: reqs.filter((r: any) => r.id_vehiculo === v.id).map((r: any) => ({
      ...r,
      tipo_requisito: { id: r.id_tipo_requisito, descripcion: r.tipo_req_desc },
    })),
  }))
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR', 'CONSULTAS'), async (_req, res: Response) => {
  const rows = await query(SELECT_VEHICULO + ' ORDER BY v.placa_vehiculo ASC')
  res.json(await attachRequisitos(rows))
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR', 'CONSULTAS'), async (req: Request, res: Response) => {
  const row = await queryOne(SELECT_VEHICULO + ' WHERE v.id = ?', [req.params.id])
  if (!row) { res.status(404).json({ error: 'Vehículo no encontrado' }); return }
  const [mapped] = await attachRequisitos([row])
  res.json(mapped)
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const {
    id_tipo_vehiculo, placa_vehiculo, id_marca, linea, anno, id_color,
    numero_chasis, numero_motor, tipo_combustible, capacidad_combustible,
    capacidad_peso, capacidad_pasajeros, id_dependencia_asignada, id_responsable,
    estado, fecha_adquisicion, valor_adquisicion, id_chip_asignado,
    fecha_asignacion_chip, placa_almacen,
  } = req.body

  if (!placa_vehiculo || !id_tipo_vehiculo || !id_marca) {
    res.status(400).json({ error: 'Faltan campos requeridos: placa_vehiculo, id_tipo_vehiculo, id_marca' }); return
  }
  if (placa_vehiculo.length > 7) {
    res.status(400).json({ error: 'placa_vehiculo no puede superar 7 caracteres' }); return
  }

  try {
    const r = await run(
      `INSERT INTO ctv_vehiculos
       (id_tipo_vehiculo, placa_vehiculo, id_marca, linea, anno, id_color,
        numero_chasis, numero_motor, tipo_combustible, capacidad_combustible,
        capacidad_peso, capacidad_pasajeros, id_dependencia_asignada, id_responsable,
        estado, fecha_adquisicion, valor_adquisicion, id_chip_asignado,
        fecha_asignacion_chip, placa_almacen, modifica_u)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_tipo_vehiculo, placa_vehiculo.toUpperCase(), id_marca, linea ?? null, anno ?? null, id_color ?? null,
        numero_chasis ?? null, numero_motor ?? null, tipo_combustible ?? null,
        capacidad_combustible ?? null, capacidad_peso ?? null, capacidad_pasajeros ?? null,
        id_dependencia_asignada, id_responsable ?? null,
        estado ?? 'ACTIVO', fecha_adquisicion, valor_adquisicion ?? null,
        id_chip_asignado ?? null, fecha_asignacion_chip ?? null, placa_almacen ?? null,
        req.user!.email,
      ],
    )
    const row = await queryOne(SELECT_VEHICULO + ' WHERE v.id = ?', [r.insertId])
    const [mapped] = await attachRequisitos([row])
    res.status(201).json(mapped)
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: `La placa ${placa_vehiculo.toUpperCase()} ya está registrada` }); return
    }
    throw err
  }
})

router.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const {
    id_tipo_vehiculo, placa_vehiculo, id_marca, linea, anno, id_color,
    numero_chasis, numero_motor, tipo_combustible, capacidad_combustible,
    capacidad_peso, capacidad_pasajeros, id_dependencia_asignada, id_responsable,
    estado, fecha_adquisicion, valor_adquisicion, id_chip_asignado,
    fecha_asignacion_chip, placa_almacen,
  } = req.body

  try {
    await run(
      `UPDATE ctv_vehiculos SET
       id_tipo_vehiculo=?, placa_vehiculo=?, id_marca=?, linea=?, anno=?, id_color=?,
       numero_chasis=?, numero_motor=?, tipo_combustible=?, capacidad_combustible=?,
       capacidad_peso=?, capacidad_pasajeros=?, id_dependencia_asignada=?, id_responsable=?,
       estado=?, fecha_adquisicion=?, valor_adquisicion=?, id_chip_asignado=?,
       fecha_asignacion_chip=?, placa_almacen=?, modifica_u=?
       WHERE id=?`,
      [
        id_tipo_vehiculo, placa_vehiculo?.toUpperCase() ?? null, id_marca, linea ?? null, anno ?? null, id_color ?? null,
        numero_chasis ?? null, numero_motor ?? null, tipo_combustible ?? null,
        capacidad_combustible ?? null, capacidad_peso ?? null, capacidad_pasajeros ?? null,
        id_dependencia_asignada, id_responsable ?? null,
        estado ?? null, fecha_adquisicion ?? null, valor_adquisicion ?? null,
        id_chip_asignado ?? null, fecha_asignacion_chip ?? null, placa_almacen ?? null,
        req.user!.email, id,
      ],
    )
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: `La placa ${placa_vehiculo?.toUpperCase()} ya está registrada en otro vehículo` }); return
    }
    throw err
  }
  const row = await queryOne(SELECT_VEHICULO + ' WHERE v.id = ?', [id])
  const [mapped] = await attachRequisitos([row])
  res.json(mapped)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await run('DELETE FROM ctv_vehiculos WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

export default router
