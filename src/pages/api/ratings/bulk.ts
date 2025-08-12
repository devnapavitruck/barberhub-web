// src/pages/api/ratings/bulk.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client' // <- usamos Prisma.join

function onlyNums(list: string | string[] | undefined): number[] {
  if (!list) return []
  const raw = Array.isArray(list) ? list.join(',') : list
  return raw
    .split(',')
    .map(x => Number(String(x).trim()))
    .filter(n => Number.isFinite(n) && n > 0)
}

async function ensureTable() {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  try {
    await ensureTable()

    const perfilIds = onlyNums(req.query.perfilIds as any)
    let userIds = onlyNums(req.query.barberoUserIds as any)

    // Si nos pasaron perfiles, convertir a usuarioId
    if (perfilIds.length) {
      const rows = await prisma.perfilBarbero.findMany({
        where: { id: { in: perfilIds } },
        select: { id: true, usuarioId: true },
      })

      const mapPerfilToUser: Record<number, number> = {}
      rows.forEach(r => { mapPerfilToUser[r.id] = r.usuarioId })
      userIds = [...new Set(rows.map(r => r.usuarioId))]

      if (!userIds.length) return res.json({ items: [], mapPerfilToUser })

      const agg = await prisma.$queryRaw<{ barberoUserId: number; avg: number | null; count: bigint }[]>`
        SELECT barbero_usuario_id AS barberoUserId,
               AVG(estrellas) AS avg,
               COUNT(*) AS count
        FROM ratings_barbero
        WHERE barbero_usuario_id IN (${Prisma.join(userIds)})
        GROUP BY barbero_usuario_id
      `
      const items = agg.map(r => ({
        barberoUserId: Number(r.barberoUserId),
        avg: Number(r.avg ?? 0),
        count: Number(r.count ?? 0),
      }))
      return res.json({ items, mapPerfilToUser })
    }

    // O directamente por userIds
    if (userIds.length) {
      const agg = await prisma.$queryRaw<{ barberoUserId: number; avg: number | null; count: bigint }[]>`
        SELECT barbero_usuario_id AS barberoUserId,
               AVG(estrellas) AS avg,
               COUNT(*) AS count
        FROM ratings_barbero
        WHERE barbero_usuario_id IN (${Prisma.join(userIds)})
        GROUP BY barbero_usuario_id
      `
      const items = agg.map(r => ({
        barberoUserId: Number(r.barberoUserId),
        avg: Number(r.avg ?? 0),
        count: Number(r.count ?? 0),
      }))
      return res.json({ items })
    }

    return res.json({ items: [] })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
}
