// src/pages/api/cliente/barberos.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

async function ensureRatingsTable() {
  // Crea la tabla auxiliar (ratings sin reserva) si no existe — no rompe si ya existe
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ratings_barbero (
      id INT AUTO_INCREMENT PRIMARY KEY,
      barbero_usuario_id INT NOT NULL,
      cliente_usuario_id INT NOT NULL,
      estrellas INT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_rating (barbero_usuario_id, cliente_usuario_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Sólo GET permitido' })
  }

  try {
    // 1) Traigo todos los perfiles de barbero con su ID de PERFIL y USER
    const perfiles = await prisma.perfilBarbero.findMany({
      select: {
        id: true,            // <- perfilId (ID real del barbero)
        usuarioId: true,     // <- barberoUserId (Usuario.id)
        nombres: true,
        apellidos: true,
        region: true,
        comuna: true,
        ciudad: true,
        direccion: true,
        servicios: {
          select: { id: true, nombre: true, precio: true, duracion: true },
        },
        galeria: {
          select: { url: true },
          take: 1,           // sólo la primera imagen
        },
      },
      orderBy: { id: 'asc' },
      // (opcional) puedes filtrar por "disponibles=true" si ya tienes esa lógica
    })

    if (!perfiles.length) {
      return res.status(200).json([])
    }

    const userIds = perfiles.map(p => p.usuarioId)

    // 2) Emails de usuarios en un solo fetch (evita N consultas)
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true },
    })
    const emailMap = new Map(usuarios.map(u => [u.id, u.email || '']))

    // 3) Ratings SIN reserva (tabla auxiliar) — primero intentamos con esto
    await ensureRatingsTable()
    const aggFree = await prisma.$queryRaw<
      { barberoUserId: number; avg: number | null; count: bigint }[]
    >`
      SELECT
        barbero_usuario_id AS barberoUserId,
        AVG(estrellas)     AS avg,
        COUNT(*)           AS count
      FROM ratings_barbero
      WHERE barbero_usuario_id IN (${Prisma.join(userIds)})
      GROUP BY barbero_usuario_id
    `
    const freeMap = new Map(
      aggFree.map(r => [
        Number(r.barberoUserId),
        { avg: Number(r.avg ?? 0), count: Number(r.count ?? 0) },
      ])
    )

    // 4) Fallback: ratings con reserva (Valoracion + Reserva) por si no hay en tabla auxiliar
    const aggLegacy = await prisma.$queryRaw<
      { barberoUserId: number; avg: number | null; count: bigint }[]
    >`
      SELECT
        r.barberoId AS barberoUserId,
        AVG(v.tijeras) AS avg,
        COUNT(*) AS count
      FROM Valoracion v
      JOIN Reserva r ON v.reservaId = r.id
      WHERE r.barberoId IN (${Prisma.join(userIds)})
      GROUP BY r.barberoId
    `
    const legacyMap = new Map(
      aggLegacy.map(r => [
        Number(r.barberoUserId),
        { avg: Number(r.avg ?? 0), count: Number(r.count ?? 0) },
      ])
    )

    // 5) Construyo el listado final (sin romper tu formato previo)
    const listado = perfiles.map((p) => {
      const ratingFree = freeMap.get(p.usuarioId)
      const ratingLegacy = legacyMap.get(p.usuarioId)
      const rating = ratingFree ?? ratingLegacy ?? { avg: 0, count: 0 }

      return {
        perfilId: p.id,              // <- NUEVO: ID del barbero (PerfilBarbero.id)
        barberoId: p.usuarioId,      // (mantengo tu campo previo, es el userId del barbero)
        barberoUserId: p.usuarioId,  // (alias claro por si lo quieres usar)
        email: emailMap.get(p.usuarioId) || '',
        nombre: `${p.nombres} ${p.apellidos}`.trim(),
        ubicacion: {
          region: p.region,
          comuna: p.comuna,
          ciudad: p.ciudad,
          direccion: p.direccion,
        },
        fotoUrl: p.galeria[0]?.url || '/images/default-barbero.png',
        servicios: p.servicios,
        avgRating: rating.avg,       // <- promedio de estrellas
        ratingCount: rating.count,   // <- cantidad de valoraciones
      }
    })

    return res.status(200).json(listado)
  } catch (error: any) {
    console.error('Error cargando barberos:', error)
    return res.status(500).json({ error: 'No se pudieron cargar los barberos' })
  }
}
