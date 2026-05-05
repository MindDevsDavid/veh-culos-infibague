import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

const include = { vehiculo: { select: { placa_vehiculo: true, linea: true, marca: { select: { descripcion: true } } } } }

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { vehiculo_id } = req.query
  const mant = await prisma.mantenimiento.findMany({
    where: vehiculo_id ? { id_vehiculo: Number(vehiculo_id) } : undefined,
    include,
    orderBy: { fecha_ingreso: 'desc' },
  })
  res.json(mant)
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const m = await prisma.mantenimiento.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!m) { res.status(404).json({ error: 'Mantenimiento no encontrado' }); return }
  res.json(m)
})

router.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const {
    id_vehiculo, tipo_mantenimiento, descripcion, fecha_ingreso,
    kilometraje_ingreso, horas_ingreso, proveedor_taller, observacion_ingreso,
  } = req.body

  if (!id_vehiculo || !tipo_mantenimiento || !fecha_ingreso) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  // Cambiar estado del vehículo a EN_MANTENIMIENTO
  await prisma.vehiculo.update({ where: { id: id_vehiculo }, data: { estado: 'EN_MANTENIMIENTO', modifica_u: req.user!.email } })

  const m = await prisma.mantenimiento.create({
    data: {
      id_vehiculo, tipo_mantenimiento, descripcion,
      fecha_ingreso: new Date(fecha_ingreso),
      kilometraje_ingreso, horas_ingreso, proveedor_taller, observacion_ingreso,
      modifica_u: req.user!.email,
    },
    include,
  })
  res.status(201).json(m)
})

router.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const {
    tipo_mantenimiento, descripcion, fecha_ingreso, kilometraje_ingreso, horas_ingreso,
    proveedor_taller, observacion_ingreso, fecha_salida, kilometraje_salida,
    horas_salida, observacion_salida, fecha_factura, numero_factura, valor_factura,
  } = req.body

  const m = await prisma.mantenimiento.update({
    where: { id },
    data: {
      tipo_mantenimiento, descripcion,
      fecha_ingreso: fecha_ingreso ? new Date(fecha_ingreso) : undefined,
      kilometraje_ingreso, horas_ingreso, proveedor_taller, observacion_ingreso,
      fecha_salida: fecha_salida ? new Date(fecha_salida) : undefined,
      kilometraje_salida, horas_salida, observacion_salida,
      fecha_factura: fecha_factura ? new Date(fecha_factura) : undefined,
      numero_factura, valor_factura,
      modifica_u: req.user!.email,
    },
    include,
  })

  // Si se registra salida, vehículo vuelve a ACTIVO
  if (fecha_salida) {
    await prisma.vehiculo.update({ where: { id: m.id_vehiculo }, data: { estado: 'ACTIVO', modifica_u: req.user!.email } })
  }

  res.json(m)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.mantenimiento.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
