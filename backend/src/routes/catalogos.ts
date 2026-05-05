import { Router, Request, Response } from 'express'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate)

// ─── Helper para generar rutas CRUD de catálogo simple ───────────────────────
function catalogRoutes(
  router: Router,
  model: any,
  readRoles: string[],
  writeRoles: string[]
) {
  router.get('/', allowRoles(...readRoles), async (_req: Request, res: Response) => {
    const items = await model.findMany({ orderBy: { descripcion: 'asc' } })
    res.json(items)
  })

  router.post('/', allowRoles(...writeRoles), async (req: Request, res: Response) => {
    const { descripcion } = req.body
    if (!descripcion) { res.status(400).json({ error: 'descripcion requerida' }); return }
    const item = await model.create({ data: { descripcion, modifica_u: req.user!.email } })
    res.status(201).json(item)
  })

  router.put('/:id', allowRoles(...writeRoles), async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const { descripcion } = req.body
    const item = await model.update({ where: { id }, data: { descripcion, modifica_u: req.user!.email } })
    res.json(item)
  })

  router.delete('/:id', allowRoles(...writeRoles), async (req: Request, res: Response) => {
    const id = Number(req.params.id)
    await model.delete({ where: { id } })
    res.json({ ok: true })
  })
}

// Marcas
const marcas = Router()
catalogRoutes(marcas, prisma.marca, ['ADMIN', 'AUTORIZADOR', 'CONDUCTOR'], ['ADMIN'])
router.use('/marcas', marcas)

// Colores
const colores = Router()
catalogRoutes(colores, prisma.color, ['ADMIN', 'AUTORIZADOR', 'CONDUCTOR'], ['ADMIN'])
router.use('/colores', colores)

// Tipos de vehículo
const tiposVehiculo = Router()
catalogRoutes(tiposVehiculo, prisma.tipoVehiculo, ['ADMIN', 'AUTORIZADOR', 'CONDUCTOR'], ['ADMIN'])
router.use('/tipos-vehiculo', tiposVehiculo)

// Tipos de requisito
const tiposRequisito = Router()
catalogRoutes(tiposRequisito, prisma.tipoRequisito, ['ADMIN', 'AUTORIZADOR'], ['ADMIN'])
router.use('/tipos-requisito', tiposRequisito)

// Componentes
const componentes = Router()
catalogRoutes(componentes, prisma.componente, ['ADMIN', 'AUTORIZADOR'], ['ADMIN'])
router.use('/componentes', componentes)

// Dependencias
const dependencias = Router()
router.use('/dependencias', dependencias)
dependencias.get('/', allowRoles('ADMIN', 'AUTORIZADOR', 'CONDUCTOR', 'VIGILANTE'), async (_req, res) => {
  const items = await prisma.dependencia.findMany({ orderBy: { descripcion: 'asc' } })
  res.json(items)
})
dependencias.post('/', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const { descripcion, id_dependencia_ig } = req.body
  const item = await prisma.dependencia.create({ data: { descripcion, id_dependencia_ig, modifica_u: req.user!.email } })
  res.status(201).json(item)
})
dependencias.put('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { descripcion, id_dependencia_ig } = req.body
  const item = await prisma.dependencia.update({ where: { id }, data: { descripcion, id_dependencia_ig, modifica_u: req.user!.email } })
  res.json(item)
})
dependencias.delete('/:id', allowRoles('ADMIN'), async (req: Request, res: Response) => {
  await prisma.dependencia.delete({ where: { id: Number(req.params.id) } })
  res.json({ ok: true })
})

export default router
