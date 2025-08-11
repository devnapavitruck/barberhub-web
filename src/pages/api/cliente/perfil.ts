// pages/api/cliente/perfil.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'        // tu instancia de Prisma
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Extrae y valida el token
  const auth = req.headers.authorization?.split(' ')[1]
  if (!auth) return res.status(401).json({ error: 'No autorizado' })
  let userId: number
  try {
    const payload = jwt.verify(auth, process.env.JWT_SECRET!) as { userId: number }
    userId = payload.userId
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // 2) GET: devuelve el perfil existente o valores vacíos
  if (req.method === 'GET') {
    const perfil = await prisma.perfilCliente.findUnique({
      where: { usuarioId: userId },
      select: { nombres: true, apellidos: true, telefono: true, ciudad: true },
    })
    return res.status(200).json(
      perfil ?? { nombres: '', apellidos: '', telefono: '', ciudad: '' }
    )
  }

  // 3) PATCH: crea o actualiza (upsert) el perfil
  if (req.method === 'PATCH') {
    const { nombres, apellidos, telefono, ciudad } = req.body
    if (!nombres || !apellidos || !telefono || !ciudad) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' })
    }
    const perfil = await prisma.perfilCliente.upsert({
      where: { usuarioId: userId },
      create: { usuarioId: userId, nombres, apellidos, telefono, ciudad },
      update: { nombres, apellidos, telefono, ciudad },
    })
    return res.status(200).json(perfil)
  }

  return res.status(405).json({ error: 'Método no permitido' })
}
