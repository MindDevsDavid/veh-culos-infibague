import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadFotosSalida } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const include = {
  vehiculo: { include: { tipo_vehiculo: true, marca: true } },
  conductor: { select: { nombre_conductor: true, cedula_conductor: true } },
  autorizador: { select: { nombre: true } },
  vigilante_salida: { select: { nombre: true } },
  vigilante_entrada: { select: { nombre: true } },
  dependencia_uso: { select: { descripcion: true } },
  fotos: true,
  inspeccion_pre: true,
}

// ─── Validaciones de negocio ──────────────────────────────────────────────────

async function validarParaSalida(id_vehiculo: number, id_conductor: number): Promise<string | null> {
  // 1. Vehículo con requisitos vencidos
  const vencidos = await prisma.controlRequisito.findMany({
    where: { id_vehiculo, estado_requisito: 'VENCIDO' },
    include: { tipo_requisito: true },
  })
  if (vencidos.length > 0) {
    const lista = vencidos.map(v => v.tipo_requisito.descripcion).join(', ')
    return `Vehículo tiene requisitos vencidos: ${lista}`
  }

  // 2. Estado del vehículo
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: id_vehiculo } })
  if (!vehiculo) return 'Vehículo no encontrado'
  if (vehiculo.estado !== 'ACTIVO') return `Vehículo en estado ${vehiculo.estado}, no puede salir`

  // 3. TH conductor vencida
  const conductor = await prisma.conductor.findUnique({ where: { id: id_conductor } })
  if (!conductor) return 'Conductor no encontrado'
  if (!conductor.autorizacion_th) return 'Conductor no tiene autorización TH'
  if (conductor.fecha_vence_th && new Date(conductor.fecha_vence_th) < new Date()) {
    return `Autorización TH del conductor vencida el ${conductor.fecha_vence_th.toLocaleDateString('es-CO')}`
  }

  return null
}

// ─── GET /salidas — filtrado por rol ─────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  const { estado, vehiculo_id } = req.query
  const rol = req.user!.rol
  const userId = req.user!.sub

  let where: any = {}
  if (vehiculo_id) where.id_vehiculo = Number(vehiculo_id)
  if (estado) where.estado = estado

  // Filtros por rol
  if (rol === 'CONDUCTOR') where.id_conductor = userId
  if (rol === 'VIGILANTE') where.estado = { in: ['INSPECCIONADA', 'EN_CURSO', 'RETORNANDO'] }
  if (rol === 'CONSULTAS') where.estado = 'EN_CURSO'

  const salidas = await prisma.salidaVehiculo.findMany({
    where,
    include,
    orderBy: { modifica_f: 'desc' },
  })
  res.json(salidas)
})

router.get('/en-curso', allowRoles('ADMIN', 'AUTORIZADOR', 'CONSULTAS'), async (_req, res: Response) => {
  const salidas = await prisma.salidaVehiculo.findMany({
    where: { estado: 'EN_CURSO' },
    include,
    orderBy: { hora_salida: 'desc' },
  })
  res.json(salidas)
})

router.get('/:id', async (req: Request, res: Response) => {
  const salida = await prisma.salidaVehiculo.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }

  // Conductores solo ven las suyas
  if (req.user!.rol === 'CONDUCTOR' && salida.id_conductor !== req.user!.sub) {
    res.status(403).json({ error: 'Sin acceso' }); return
  }
  res.json(salida)
})

// ─── POST /salidas — conductor crea solicitud (inspección pre ya debe existir) ─

router.post('/', allowRoles('ADMIN', 'CONDUCTOR'), async (req: Request, res: Response) => {
  const {
    id_vehiculo, id_conductor, id_inspeccion, fecha_salida, motivo_salida,
    lugar_destino, kilometraje_salida, firma, id_dependencia_uso, observaciones,
  } = req.body

  if (!id_vehiculo || !id_conductor || !motivo_salida || !lugar_destino || !id_dependencia_uso) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  // Validar reglas de negocio
  const error = await validarParaSalida(Number(id_vehiculo), Number(id_conductor))
  if (error) { res.status(422).json({ error }); return }

  // Validar que la inspección preoperacional existe y está apta
  if (id_inspeccion) {
    const insp = await prisma.inspeccion.findUnique({ where: { id: Number(id_inspeccion) } })
    if (!insp) { res.status(400).json({ error: 'Inspección preoperacional no encontrada' }); return }
    if (!insp.apto_para_operar) { res.status(422).json({ error: 'Inspección preoperacional indica vehículo NO apto para operar' }); return }
    if (insp.tipo_inspeccion !== 'PREOPERACIONAL') { res.status(400).json({ error: 'La inspección debe ser PREOPERACIONAL' }); return }
  }

  // Obtener placa del vehículo
  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: Number(id_vehiculo) } })

  const salida = await prisma.salidaVehiculo.create({
    data: {
      id_vehiculo: Number(id_vehiculo),
      placa_vehiculo: vehiculo!.placa_vehiculo,
      id_conductor: Number(id_conductor),
      id_inspeccion: id_inspeccion ? Number(id_inspeccion) : undefined,
      fecha_salida: fecha_salida ? new Date(fecha_salida) : new Date(),
      motivo_salida, lugar_destino,
      kilometraje_salida: Number(kilometraje_salida),
      firma, id_dependencia_uso: Number(id_dependencia_uso),
      observaciones, estado: 'PENDIENTE',
      modifica_u: req.user!.email,
    },
    include,
  })
  res.status(201).json(salida)
})

// ─── PUT /salidas/:id/autorizar ───────────────────────────────────────────────

router.put('/:id/autorizar', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const salida = await prisma.salidaVehiculo.findUnique({ where: { id } })
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (salida.estado !== 'PENDIENTE') { res.status(400).json({ error: `No se puede autorizar en estado ${salida.estado}` }); return }

  const updated = await prisma.salidaVehiculo.update({
    where: { id },
    data: {
      estado: 'AUTORIZADA',
      id_autorizado_por: req.user!.sub,
      modifica_u: req.user!.email,
    },
    include,
  })
  res.json(updated)
})

// ─── PUT /salidas/:id/rechazar ────────────────────────────────────────────────

router.put('/:id/rechazar', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { motivo_rechazo } = req.body
  if (!motivo_rechazo) { res.status(400).json({ error: 'motivo_rechazo requerido' }); return }

  const salida = await prisma.salidaVehiculo.findUnique({ where: { id } })
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (!['PENDIENTE', 'AUTORIZADA'].includes(salida.estado)) {
    res.status(400).json({ error: `No se puede rechazar en estado ${salida.estado}` }); return
  }

  const updated = await prisma.salidaVehiculo.update({
    where: { id },
    data: { estado: 'RECHAZADA', motivo_rechazo, id_autorizado_por: req.user!.sub, modifica_u: req.user!.email },
    include,
  })
  res.json(updated)
})

// ─── PUT /salidas/:id/check-salida — vigilante registra hora + 2 fotos ────────

router.put('/:id/check-salida', allowRoles('ADMIN', 'VIGILANTE'), uploadFotosSalida.array('fotos', 2), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const salida = await prisma.salidaVehiculo.findUnique({ where: { id } })
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (!['AUTORIZADA', 'INSPECCIONADA'].includes(salida.estado)) {
    res.status(400).json({ error: `No se puede hacer check-salida en estado ${salida.estado}` }); return
  }

  const ahora = new Date()
  const updated = await prisma.salidaVehiculo.update({
    where: { id },
    data: {
      estado: 'EN_CURSO',
      hora_salida: ahora,
      id_vigilante_salida: req.user!.sub,
      modifica_u: req.user!.email,
    },
    include,
  })

  // Guardar fotos
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      await prisma.fotoSalidaEntrada.create({
        data: {
          id_salida: id,
          id_vehiculo: salida.id_vehiculo,
          id_subido_por: req.user!.sub,
          tipo_accion: 'SALIDA',
          ruta_base: file.destination,
          ruta_logica: file.path,
          nombre_foto: file.filename,
          modifica_u: req.user!.email,
        },
      })
    }
  }

  res.json(updated)
})

// ─── PUT /salidas/:id/check-entrada — vigilante registra hora + 2 fotos ───────

router.put('/:id/check-entrada', allowRoles('ADMIN', 'VIGILANTE'), uploadFotosSalida.array('fotos', 2), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const salida = await prisma.salidaVehiculo.findUnique({ where: { id } })
  if (!salida) { res.status(404).json({ error: 'Salida no encontrada' }); return }
  if (salida.estado !== 'EN_CURSO') {
    res.status(400).json({ error: `No se puede hacer check-entrada en estado ${salida.estado}` }); return
  }

  const ahora = new Date()
  const updated = await prisma.salidaVehiculo.update({
    where: { id },
    data: {
      estado: 'RETORNANDO',
      hora_entrada: ahora,
      fecha_entrada: ahora,
      id_vigilante_entrada: req.user!.sub,
      modifica_u: req.user!.email,
    },
    include,
  })

  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files) {
      await prisma.fotoSalidaEntrada.create({
        data: {
          id_salida: id,
          id_vehiculo: salida.id_vehiculo,
          id_subido_por: req.user!.sub,
          tipo_accion: 'ENTRADA',
          ruta_base: file.destination,
          ruta_logica: file.path,
          nombre_foto: file.filename,
          modifica_u: req.user!.email,
        },
      })
    }
  }

  res.json(updated)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.salidaVehiculo.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
