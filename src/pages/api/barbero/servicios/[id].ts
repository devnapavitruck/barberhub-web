import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const servicioId = Number(id)

  if (!['PATCH', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', ['PATCH', 'DELETE'])
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // --- auth ---
  const auth = req.headers.authorization || ''
  const token = auth.replace(/^Bearer\s+/, '')
  if (!token) return res.status(401).json({ error: 'No autorizado' })

  let payload: { userId: number; rol: string }
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as any
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
  if (payload.rol !== 'BARBERO') return res.status(403).json({ error: 'Rol inválido' })

  // Encontrar el perfil (id de PerfilBarbero)
  const perfil = await prisma.perfilBarbero.findUnique({
    where: { usuarioId: payload.userId },
    select: { id: true },
  })
  if (!perfil) return res.status(404).json({ error: 'Perfil no encontrado' })

  // Verificar que el servicio pertenece a este barbero
  const belong = await prisma.servicio.findFirst({
    where: { id: servicioId, barberoId: perfil.id },
    select: { id: true },
  })
  if (!belong) return res.status(404).json({ error: 'Servicio no encontrado' })

  if (req.method === 'PATCH') {
    const { nombre, precio, duracion } = req.body as {
      nombre?: string
      precio?: number
      duracion?: number
    }

    const updated = await prisma.servicio.update({
      where: { id: servicioId },
      data: {
        nombre: (nombre ?? '').toString().slice(0, 75),
        precio: Number(precio ?? 0),
        duracion: Number(duracion ?? 60),
      },
      select: { id: true },
    })
    return res.status(200).json({ success: true, id: updated.id })
  }

  // DELETE
  await prisma.servicio.delete({ where: { id: servicioId } })
  return res.status(200).json({ success: true })
}
