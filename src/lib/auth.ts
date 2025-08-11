// src/lib/auth.ts
import type { NextApiRequest } from 'next'
import jwt from 'jsonwebtoken'

export type Role = 'CLIENTE' | 'BARBERO'

export interface Session {
  user: { id: number; rol?: Role }
}

const SECRET = process.env.JWT_SECRET || 'dev-secret' // usa uno real en prod

type JwtPayload = {
  userId: number
  rol?: Role
  iat?: number
  exp?: number
}

/**
 * Lee token desde Authorization: Bearer <jwt> (preferido) o desde cookie 'token' (fallback),
 * verifica y retorna { userId, rol }. Lanza error si no hay token o es inválido.
 */
export function getUserFromReq(req: NextApiRequest): { userId: number; rol?: Role } {
  // 1) Authorization header
  const h = req.headers.authorization || ''
  const bearer = h.startsWith('Bearer ') ? h.slice(7) : ''

  // 2) Cookie fallback
  const cookieToken = req.cookies?.['token'] || ''

  const token = bearer || cookieToken
  if (!token) throw new Error('NO_TOKEN')

  const decoded = jwt.verify(token, SECRET) as JwtPayload
  if (!decoded?.userId) throw new Error('INVALID_TOKEN')

  return { userId: decoded.userId, rol: decoded.rol }
}

/**
 * Versión compatible con tu código actual (cookies).
 * Devuelve null si no hay token o si falla la verificación.
 */
export async function getSession({ req }: { req: NextApiRequest }): Promise<Session | null> {
  const token = req.cookies?.['token']
  if (!token) return null
  try {
    const decoded = jwt.verify(token, SECRET) as JwtPayload
    return { user: { id: decoded.userId, rol: decoded.rol } }
  } catch {
    return null
  }
}

// Export default para compatibilidad si ya lo usabas así.
export default getSession
