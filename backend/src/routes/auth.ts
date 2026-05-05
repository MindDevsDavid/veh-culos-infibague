import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { authenticate, AuthPayload } from '../middleware/auth'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).json({ error: 'Email y contraseña requeridos' })
    return
  }

  const user = await prisma.usuario.findUnique({ where: { email } })
  if (!user || !user.activo) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    res.status(401).json({ error: 'Credenciales inválidas' })
    return
  }

  const payload: AuthPayload = { sub: user.id, email: user.email, rol: user.rol, nombre: user.nombre }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  res.json({ accessToken, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } })
})

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('refresh_token')
  res.json({ message: 'Sesión cerrada' })
})

router.post('/refresh', (req: Request, res: Response): void => {
  const token = req.cookies?.refresh_token
  if (!token) {
    res.status(401).json({ error: 'Refresh token requerido' })
    return
  }
  try {
    const payload = verifyRefreshToken(token)
    const newPayload: AuthPayload = { sub: payload.sub, email: payload.email, rol: payload.rol, nombre: payload.nombre }
    res.json({ accessToken: signAccessToken(newPayload) })
  } catch {
    res.status(401).json({ error: 'Refresh token inválido' })
  }
})

router.get('/me', authenticate, (req: Request, res: Response): void => {
  res.json(req.user)
})

export default router
