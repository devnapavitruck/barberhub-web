// src/pages/api/ratings/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Crea tabla auxiliar si no existe (no toca tu schema)
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

    if (req.method === 'GET') {
      const barberoUserId = Number(req.query.barberoUserId)
      const clienteUserId = req.query.clienteUserId ? Number(req.query.clienteUserId) : null
      if (!barberoUserId) return res.status(400).json({ error: 'barberoUserId requerido' })

      const agg = await prisma.$queryRaw<{ avg: number | null; count: bigint }[]>`
        SELECT AVG(estrellas) AS avg, COUNT(*) AS count
        FROM ratings_barbero
        WHERE barbero_usuario_id = ${barberoUserId}
      `
      const base = agg?.[0]
      let mine: number | null = null
      if (clienteUserId) {
        const own = await prisma.$queryRaw<{ estrellas: number }[]>`
          SELECT estrellas FROM ratings_barbero
          WHERE barbero_usuario_id = ${barberoUserId} AND cliente_usuario_id = ${clienteUserId}
          LIMIT 1
        `
        mine = own?.[0]?.estrellas ?? null
      }
      return res.json({ avg: Number(base?.avg ?? 0), count: Number(base?.count ?? 0), mine })
    }

    if (req.method === 'POST') {
      const { barberoUserId, clienteUserId, estrellas } = req.body || {}
      if (!barberoUserId || !clienteUserId || !estrellas) {
        return res.status(400).json({ error: 'Datos incompletos' })
      }
      await prisma.$executeRaw`
        INSERT INTO ratings_barbero (barbero_usuario_id, cliente_usuario_id, estrellas)
        VALUES (${Number(barberoUserId)}, ${Number(clienteUserId)}, ${Number(estrellas)})
        ON DUPLICATE KEY UPDATE estrellas = VALUES(estrellas), updated_at = CURRENT_TIMESTAMP
      `
      return res.json({ ok: true })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'server_error' })
  }
}
