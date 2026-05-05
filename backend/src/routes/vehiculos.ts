import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const include = {
  tipo_vehiculo: true,
  marca: true,
  color: true,
  dependencia: true,
  chip: true,
  requisitos: { include: { tipo_requisito: true } },
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (_req, res: Response) => {
  const vehiculos = await prisma.vehiculo.findMany({ include, orderBy: { placa_vehiculo: 'asc' } })
  res.json(vehiculos)
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const v = await prisma.vehiculo.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!v) { res.status(404).json({ error: 'Vehículo no encontrado' }); return }
  res.json(v)
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
    res.status(400).json({ error: 'Faltan campos requeridos: placa_vehiculo, id_tipo_vehiculo, id_marca' })
    return
  }

  const v = await prisma.vehiculo.create({
    data: {
      id_tipo_vehiculo, placa_vehiculo: placa_vehiculo.toUpperCase(), id_marca, linea, anno,
      id_color, numero_chasis, numero_motor, tipo_combustible,
      capacidad_combustible, capacidad_peso, capacidad_pasajeros,
      id_dependencia_asignada, id_responsable, estado: estado ?? 'ACTIVO',
      fecha_adquisicion: new Date(fecha_adquisicion), valor_adquisicion,
      id_chip_asignado, fecha_asignacion_chip: fecha_asignacion_chip ? new Date(fecha_asignacion_chip) : undefined,
      placa_almacen, modifica_u: req.user!.email,
    },
    include,
  })
  res.status(201).json(v)
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

  const v = await prisma.vehiculo.update({
    where: { id },
    data: {
      id_tipo_vehiculo, placa_vehiculo: placa_vehiculo?.toUpperCase(), id_marca, linea, anno,
      id_color, numero_chasis, numero_motor, tipo_combustible,
      capacidad_combustible, capacidad_peso, capacidad_pasajeros,
      id_dependencia_asignada, id_responsable, estado,
      fecha_adquisicion: fecha_adquisicion ? new Date(fecha_adquisicion) : undefined,
      valor_adquisicion, id_chip_asignado,
      fecha_asignacion_chip: fecha_asignacion_chip ? new Date(fecha_asignacion_chip) : undefined,
      placa_almacen, modifica_u: req.user!.email,
    },
    include,
  })
  res.json(v)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.vehiculo.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
