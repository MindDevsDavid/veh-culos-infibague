import jwt from 'jsonwebtoken'
import { AuthPayload } from '../middleware/auth'

export function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' })
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })
}

export function verifyRefreshToken(token: string): AuthPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as unknown as AuthPayload
}
