import { Router, Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'
import { uploadPdf } from '../middleware/upload'

const router = Router()
router.use(authenticate)

const include = {
  vehiculo: { select: { placa_vehiculo: true } },
  tipo_requisito: true,
}

router.get('/', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const { vehiculo_id, vencidos } = req.query
  const hoy = new Date()
  const requisitos = await prisma.controlRequisito.findMany({
    where: {
      ...(vehiculo_id ? { id_vehiculo: Number(vehiculo_id) } : {}),
      ...(vencidos === 'true' ? { estado_requisito: 'VENCIDO' } : {}),
    },
    include,
    orderBy: { fecha_vencimiento: 'asc' },
  })

  // Calcular días para vencer
  const result = requisitos.map(r => ({
    ...r,
    dias_para_vencer: Math.ceil((new Date(r.fecha_vencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)),
  }))
  res.json(result)
})

router.get('/:id', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const r = await prisma.controlRequisito.findUnique({ where: { id: Number(req.params.id) }, include })
  if (!r) { res.status(404).json({ error: 'Requisito no encontrado' }); return }
  res.json(r)
})

router.post('/', allowRoles('ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const {
    id_vehiculo, id_tipo_requisito, numero_requisito, empresa_expide,
    fecha_expedicion, fecha_vencimiento, observacion,
  } = req.body

  if (!id_vehiculo || !id_tipo_requisito || !numero_requisito || !fecha_vencimiento) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }

  const hoy = new Date()
  const vence = new Date(fecha_vencimiento)
  const estado_requisito = vence < hoy ? 'VENCIDO' : 'VIGENTE'

  const r = await prisma.controlRequisito.create({
    data: {
      id_vehiculo: Number(id_vehiculo),
      id_tipo_requisito: Number(id_tipo_requisito),
      numero_requisito, empresa_expide,
      fecha_expedicion: new Date(fecha_expedicion),
      fecha_vencimiento: vence,
      estado_requisito, observacion,
      modifica_u: req.user!.email,
    },
    include,
  })

  // Guardar PDF en ctv_pdfs si se subió archivo
  if (req.file) {
    await prisma.pdf.create({
      data: {
        nombre_tabla: 'ctv_control_requisitos',
        id_tabla: r.id,
        ruta_base: req.file.destination,
        ruta_logica: req.file.path,
        nombre_archivo: req.file.filename,
        modifica_u: req.user!.email,
      },
    })
  }

  res.status(201).json(r)
})

router.put('/:id', allowRoles('ADMIN'), uploadPdf.single('archivo'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { id_tipo_requisito, numero_requisito, empresa_expide, fecha_expedicion, fecha_vencimiento, observacion } = req.body

  const hoy = new Date()
  const vence = fecha_vencimiento ? new Date(fecha_vencimiento) : undefined
  const estado_requisito = vence ? (vence < hoy ? 'VENCIDO' : 'VIGENTE') : undefined

  const r = await prisma.controlRequisito.update({
    where: { id },
    data: {
      id_tipo_requisito: id_tipo_requisito ? Number(id_tipo_requisito) : undefined,
      numero_requisito, empresa_expide,
      fecha_expedicion: fecha_expedicion ? new Date(fecha_expedicion) : undefined,
      fecha_vencimiento: vence, estado_requisito, observacion,
      modifica_u: req.user!.email,
    },
    include,
  })

  if (req.file) {
    // Reemplazar PDF anterior
    const old = await prisma.pdf.findFirst({ where: { nombre_tabla: 'ctv_control_requisitos', id_tabla: id } })
    if (old) {
      fs.unlink(old.ruta_logica, () => {})
      await prisma.pdf.update({ where: { id: old.id }, data: { ruta_base: req.file!.destination, ruta_logica: req.file!.path, nombre_archivo: req.file!.filename, modifica_u: req.user!.email } })
    } else {
      await prisma.pdf.create({ data: { nombre_tabla: 'ctv_control_requisitos', id_tabla: id, ruta_base: req.file!.destination, ruta_logica: req.file!.path, nombre_archivo: req.file!.filename, modifica_u: req.user!.email } })
    }
  }

  res.json(r)
})

router.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const pdf = await prisma.pdf.findFirst({ where: { nombre_tabla: 'ctv_control_requisitos', id_tabla: id } })
  if (pdf) {
    fs.unlink(pdf.ruta_logica, () => {})
    await prisma.pdf.delete({ where: { id: pdf.id } })
  }
  await prisma.controlRequisito.delete({ where: { id } })
  res.json({ ok: true })
})

// Serve PDF de un requisito
router.get('/:id/archivo', allowRoles('ADMIN', 'AUTORIZADOR'), async (req: Request, res: Response) => {
  const pdf = await prisma.pdf.findFirst({ where: { nombre_tabla: 'ctv_control_requisitos', id_tabla: Number(req.params.id) } })
  if (!pdf) { res.status(404).json({ error: 'Archivo no encontrado' }); return }
  res.sendFile(path.resolve(pdf.ruta_logica))
})

export default router
