// src/pages/api/cliente/barberos.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Sólo GET permitido' })
  }

  try {
    // 1) Traigo todos los perfiles de barbero con nombres y apellidos, servicios y galería
    const perfiles = await prisma.perfilBarbero.findMany({
      select: {
        usuarioId: true,
        nombres: true,       // Añadido
        apellidos: true,     // Añadido
        region: true,
        comuna: true,
        ciudad: true,
        direccion: true,
        servicios: {
          select: { id: true, nombre: true, precio: true, duracion: true },
        },
        galeria: {
          select: { url: true },
          take: 1,            // sólo la primera imagen
        },
      },
    })

    // 2) Para cada perfil, completo email y avgRating
    const listado = await Promise.all(
      perfiles.map(async (p) => {
        // Email del usuario
        const usuario = await prisma.usuario.findUnique({
          where: { id: p.usuarioId },
          select: { email: true },
        })

        // Valoraciones del barbero
        const valoraciones = await prisma.valoracion.findMany({
          where: { reserva: { barberoId: p.usuarioId } },
          select: { tijeras: true },
        })
        const ratings = valoraciones.map((v) => v.tijeras)
        const avgRating =
          ratings.length > 0
            ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
            : 0

        return {
          barberoId: p.usuarioId,
          email: usuario?.email || '',
          nombre: `${p.nombres} ${p.apellidos}`,         // Ahora usa nombres + apellidos
          ubicacion: {
            region: p.region,
            comuna: p.comuna,
            ciudad: p.ciudad,
            direccion: p.direccion,
          },
          fotoUrl: p.galeria[0]?.url || '/images/default-barbero.png',
          servicios: p.servicios,
          avgRating,
        }
      })
    )

    return res.status(200).json(listado)
  } catch (error: any) {
    console.error('Error cargando barberos:', error)
    return res.status(500).json({ error: 'No se pudieron cargar los barberos' })
  }
}
