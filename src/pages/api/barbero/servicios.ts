// src/pages/api/barbero/servicios.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type JWTPayload = { userId: number; rol: 'CLIENTE' | 'BARBERO' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // --- Auth ---
    const auth = req.headers.authorization || ''
    const token = auth.replace(/^Bearer\s+/, '')
    if (!token) return res.status(401).json({ error: 'No autorizado' })

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    if (payload.rol !== 'BARBERO') return res.status(403).json({ error: 'Rol inválido' })

    // Tomamos el perfil del barbero (OJO: barberoId = PerfilBarbero.id)
    const perfil = await prisma.perfilBarbero.findUnique({
      where: { usuarioId: payload.userId },
      select: { id: true },
    })

    // Si no existe el perfil aún
    if (!perfil) {
      if (req.method === 'GET') return res.status(200).json([]) // vacio
      return res.status(400).json({ error: 'Perfil de barbero no encontrado.' })
    }

    if (req.method === 'GET') {
      // Lista de servicios del barbero
      const servicios = await prisma.servicio.findMany({
        where: { barberoId: perfil.id },
        select: { id: true, nombre: true, precio: true, duracion: true },
        orderBy: { id: 'desc' },
      })
      return res.status(200).json(servicios)
    }

    if (req.method === 'POST') {
      const { nombre, precio, duracion } = req.body as {
        nombre?: string
        descripcion?: string // tu schema actual NO tiene este campo; lo ignoramos
        precio?: number | string
        duracion?: number | string // minutos
      }

      // Validaciones simples
      const nombreTrim = (nombre ?? '').toString().trim()
      if (!nombreTrim) return res.status(400).json({ error: 'El nombre es obligatorio.' })
      if (nombreTrim.length > 75) {
        return res.status(400).json({ error: 'El nombre no puede superar 75 caracteres.' })
      }

      // Precio: aceptar "25000" o "25.000" o "$25.000"
      const precioNum = Number(String(precio ?? '').replace(/[^\d]/g, ''))
      if (!precioNum || precioNum <= 0) {
        return res.status(400).json({ error: 'Precio inválido.' })
      }

      // Duración en minutos: 30/60/90/120 (ajusta si quieres)
      const duracionNum = Number(duracion)
      const permitidas = new Set([30, 60, 90, 120])
      if (!permitidas.has(duracionNum)) {
        return res.status(400).json({ error: 'Duración inválida. Usa 30, 60, 90 o 120.' })
      }

      const nuevo = await prisma.servicio.create({
        data: {
          barberoId: perfil.id, // CLAVE: usamos el id del perfil, no el userId
          nombre: nombreTrim,
          precio: precioNum,
          duracion: duracionNum,
        },
        select: { id: true, nombre: true, precio: true, duracion: true },
      })

      return res.status(201).json(nuevo)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  } catch (err: any) {
    console.error('API /barbero/servicios error:', err)
    return res.status(500).json({ error: err?.message ?? 'Error interno' })
  }
}
