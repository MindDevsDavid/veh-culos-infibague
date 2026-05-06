import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { query, queryOne, run } from '../utils/db'
import { authenticate } from '../middleware/auth'
import { allowRoles } from '../middleware/roles'

const router = Router()
router.use(authenticate, allowRoles('ADMIN'))

router.get('/', async (_req, res: Response) => {
  const usuarios = await query(
    'SELECT id, nombre, email, rol, activo, modifica_f FROM usuarios ORDER BY nombre ASC'
  )
  res.json(usuarios)
})

router.post('/', async (req: Request, res: Response) => {
  const { nombre, email, password, rol } = req.body
  if (!nombre || !email || !password || !rol) {
    res.status(400).json({ error: 'Faltan campos requeridos' }); return
  }
  const exists = await queryOne('SELECT id FROM usuarios WHERE email = ?', [email])
  if (exists) { res.status(409).json({ error: 'Email ya registrado' }); return }

  const hash = await bcrypt.hash(password, 10)
  const r = await run(
    'INSERT INTO usuarios (nombre, email, password_hash, rol, activo, modifica_u) VALUES (?, ?, ?, ?, 1, ?)',
    [nombre, email, hash, rol, req.user!.email],
  )
  const u = await queryOne('SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?', [r.insertId])
  res.status(201).json(u)
})

router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { nombre, email, password, rol, activo } = req.body
  if (password) {
    const hash = await bcrypt.hash(password, 10)
    await run(
      'UPDATE usuarios SET nombre=?, email=?, password_hash=?, rol=?, activo=?, modifica_u=? WHERE id=?',
      [nombre, email, hash, rol, activo, req.user!.email, id],
    )
  } else {
    await run(
      'UPDATE usuarios SET nombre=?, email=?, rol=?, activo=?, modifica_u=? WHERE id=?',
      [nombre, email, rol, activo, req.user!.email, id],
    )
  }
  const u = await queryOne('SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?', [id])
  res.json(u)
})

router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (id === req.user!.sub) { res.status(400).json({ error: 'No puedes eliminar tu propio usuario' }); return }
  await run('UPDATE usuarios SET activo=0, modifica_u=? WHERE id=?', [req.user!.email, id])
  res.json({ ok: true })
})

export default router
