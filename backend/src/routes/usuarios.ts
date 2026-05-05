import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate, allowRoles('ADMIN'))

router.get('/', async (_req, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, modifica_f: true },
    orderBy: { nombre: 'asc' },
  })
  res.json(usuarios)
})

router.post('/', async (req: Request, res: Response) => {
  const { nombre, email, password, rol } = req.body
  if (!nombre || !email || !password || !rol) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }
  const exists = await prisma.usuario.findUnique({ where: { email } })
  if (exists) { res.status(409).json({ error: 'Email ya registrado' }); return }

  const hash = await bcrypt.hash(password, 12)
  const u = await prisma.usuario.create({
    data: { nombre, email, password_hash: hash, rol, activo: true, modifica_u: req.user!.email },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  })
  res.status(201).json(u)
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { nombre, email, password, rol, activo } = req.body
  const data: any = { nombre, email, rol, activo, modifica_u: req.user!.email }
  if (password) data.password_hash = await bcrypt.hash(password, 12)

  const u = await prisma.usuario.update({
    where: { id },
    data,
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  })
  res.json(u)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (id === req.user!.sub) { res.status(400).json({ error: 'No puedes eliminar tu propio usuario' }); return }
  await prisma.usuario.update({ where: { id }, data: { activo: false, modifica_u: req.user!.email } })
  res.json({ ok: true })
})

export default router
