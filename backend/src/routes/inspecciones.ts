import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadFotos } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const include = {
  vehiculo: { select: { placa_vehiculo: true } },
  conductor: { select: { nombre_conductor: true } },
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { vehiculo_id, conductor_id, tipo } = req.query
  const items = await prisma.inspeccion.findMany({
    where: {
      ...(vehiculo_id ? { id_vehiculo: Number(vehiculo_id) } : {}),
      ...(conductor_id ? { id_conductor: Number(conductor_id) } : {}),
      ...(tipo ? { tipo_inspeccion: String(tipo) } : {}),
    },
    include,
    orderBy: { fecha: 'desc' },
  })
  res.json(items)
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR'), async (req: Request, res: Response) => {
  const insp = await prisma.inspeccion.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!insp) { res.status(404).json({ error: 'Inspección no encontrada' }); return }
  if (req.user!.rol === 'CONDUCTOR' && insp.id_conductor !== req.user!.sub) {
    res.status(403).json({ error: 'Sin acceso' }); return
  }
  res.json(insp)
})

// Conductor sube inspección (pre o post) con hasta 4 fotos
router.post('/', allowRoles('ADMIN', 'CONDUCTOR'), uploadFotos.array('fotos', 4), async (req: Request, res: Response) => {
  const {
    id_vehiculo, placa_vehiculo, id_conductor, tipo_inspeccion, kilometraje,
    estado_motor, nivel_refrigerante, nivel_bateria,
    estado_llantas_delanteras, estado_llantas_traseras, presion_llantas,
    estado_eje, suspension,
    luces_delanteras, luces_traseras, direccionales, luces_freno, luces_reversa,
    bocina, tablero, frenos, cinturones,
    extintor, botiquin, kit_carretera, limpieza, carroceria, vidrios, espejos,
    nivel_aceite, fugas_aceite, llanta_repuesto, estado_llanta_repuesto,
    apto_para_operar, reportado_mantenimiento, observaciones,
  } = req.body

  if (!id_vehiculo || !id_conductor || !tipo_inspeccion || !kilometraje) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1

  const fotos = req.files as Express.Multer.File[] | undefined
  const fotoPaths = fotos?.map(f => f.filename) ?? []

  const insp = await prisma.inspeccion.create({
    data: {
      fecha: new Date(),
      hora: new Date(),
      id_vehiculo: Number(id_vehiculo),
      placa_vehiculo: placa_vehiculo ?? '',
      id_conductor: Number(id_conductor),
      tipo_inspeccion,
      kilometraje: Number(kilometraje),
      estado_motor, nivel_refrigerante, nivel_bateria,
      estado_llantas_delanteras, estado_llantas_traseras, presion_llantas,
      estado_eje, suspension,
      luces_delanteras: toBool(luces_delanteras),
      luces_traseras: toBool(luces_traseras),
      direccionales: toBool(direccionales),
      luces_freno: toBool(luces_freno),
      luces_reversa: toBool(luces_reversa),
      bocina: toBool(bocina),
      tablero: toBool(tablero),
      frenos, cinturones: toBool(cinturones),
      extintor, botiquin, kit_carretera, limpieza, carroceria, vidrios, espejos,
      nivel_aceite, fugas_aceite: toBool(fugas_aceite),
      llanta_repuesto: toBool(llanta_repuesto),
      estado_llanta_repuesto: estado_llanta_repuesto ?? 'N/A',
      apto_para_operar: toBool(apto_para_operar),
      reportado_mantenimiento: toBool(reportado_mantenimiento),
      observaciones,
      modifica_u: req.user!.email,
    },
    include,
  })

  // Guardar rutas de fotos en ctv_pdfs (reutilizamos la tabla genérica)
  for (const foto of fotoPaths) {
    await prisma.pdf.create({
      data: {
        nombre_tabla: 'ctv_inspecciones',
        id_tabla: insp.id,
        ruta_base: 'uploads/inspecciones',
        ruta_logica: `uploads/inspecciones/${foto}`,
        nombre_archivo: foto,
        modifica_u: req.user!.email,
      },
    })
  }

  // Si es postoperacional y reportado_mantenimiento → cambiar estado vehículo
  if (tipo_inspeccion === 'POSTOPERACIONAL' && toBool(reportado_mantenimiento)) {
    await prisma.vehiculo.update({
      where: { id: Number(id_vehiculo) },
      data: { estado: 'EN_MANTENIMIENTO', modifica_u: req.user!.email },
    })
  }

  // Si es postoperacional → completar la salida asociada y crear historial
  if (tipo_inspeccion === 'POSTOPERACIONAL') {
    const salida = await prisma.salidaVehiculo.findFirst({
      where: { id_vehiculo: Number(id_vehiculo), estado: 'RETORNANDO' },
      orderBy: { modifica_f: 'desc' },
    })
    if (salida) {
      await prisma.salidaVehiculo.update({
        where: { id: salida.id },
        data: { estado: 'COMPLETADA', modifica_u: req.user!.email },
      })

      // Crear historial_uso automáticamente
      const km_final = Number(kilometraje)
      await prisma.historialUso.create({
        data: {
          id_vehiculo: Number(id_vehiculo),
          id_salida: salida.id,
          fecha: new Date(),
          kilometraje_inicial: salida.kilometraje_salida,
          kilometraje_final: km_final,
          cantidad_recorridos: km_final - salida.kilometraje_salida,
          observaciones,
          modifica_u: req.user!.email,
        },
      })
    }
  }

  res.status(201).json(insp)
})

export default router
