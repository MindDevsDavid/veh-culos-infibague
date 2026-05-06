import { Router, Request, Response } from 'express'
import { query, queryOne } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)
router.use(allowRoles('ADMIN', 'AUTORIZADOR', 'CONSULTAS'))

const SELECT_H = `
  SELECT h.*,
    v.placa_vehiculo, v.linea, mk.descripcion AS marca_desc,
    s.motivo_salida, s.lugar_destino, s.fecha_salida, s.hora_salida,
    s.fecha_entrada, s.hora_entrada, s.firma, s.observaciones AS obs_salida,
    s.estado AS estado_salida,
    c.nombre_conductor, c.cedula_conductor,
    ua.nombre AS autorizador_nombre,
    d.descripcion AS dependencia_desc
  FROM ctv_historial_uso h
  LEFT JOIN ctv_vehiculos v ON h.id_vehiculo = v.id
  LEFT JOIN ctv_marcas mk ON v.id_marca = mk.id
  LEFT JOIN ctv_salidas_vehiculos s ON h.id_salida = s.id
  LEFT JOIN ctv_conductores c ON s.id_conductor = c.id
  LEFT JOIN usuarios ua ON s.id_autorizado_por = ua.id
  LEFT JOIN ctv_dependencias d ON s.id_dependencia_uso = d.id
`

function mapH(row: any) {
  return {
    ...row,
    vehiculo: { placa_vehiculo: row.placa_vehiculo, linea: row.linea, marca: { descripcion: row.marca_desc } },
    salida: row.id_salida ? {
      id: row.id_salida,
      motivo_salida: row.motivo_salida,
      lugar_destino: row.lugar_destino,
      fecha_salida: row.fecha_salida,
      hora_salida: row.hora_salida,
      fecha_entrada: row.fecha_entrada,
      hora_entrada: row.hora_entrada,
      firma: row.firma,
      observaciones: row.obs_salida,
      estado: row.estado_salida,
      conductor: { nombre_conductor: row.nombre_conductor, cedula_conductor: row.cedula_conductor },
      autorizador: row.autorizador_nombre ? { nombre: row.autorizador_nombre } : null,
      dependencia_uso: { descripcion: row.dependencia_desc },
    } : null,
  }
}

router.get('/', async (req: Request, res: Response) => {
  const { vehiculo_id, desde, hasta } = req.query
  const conditions: string[] = []
  const params: any[] = []
  if (vehiculo_id) { conditions.push('h.id_vehiculo = ?'); params.push(vehiculo_id) }
  if (desde) { conditions.push('h.fecha >= ?'); params.push(desde) }
  if (hasta) { conditions.push('h.fecha <= ?'); params.push(hasta) }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
  const rows = await query(SELECT_H + where + ' ORDER BY h.fecha DESC', params)
  res.json(rows.map(mapH))
})

router.get('/vehiculo/:vehiculoId', async (req: Request, res: Response) => {
  const rows = await query(SELECT_H + ' WHERE h.id_vehiculo = ? ORDER BY h.fecha DESC', [req.params.vehiculoId])
  res.json(rows.map(mapH))
})

export default router
