// src/pages/api/barbero/metrics.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Sólo GET permitido' })
  }

  try {
    // Auth
    const auth = req.headers.authorization || ''
    const token = auth.replace(/^Bearer\s+/, '')
    if (!token) return res.status(401).json({ error: 'No autorizado' })

    const { userId, rol } = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number
      rol: 'CLIENTE' | 'BARBERO'
    }
    if (rol !== 'BARBERO') return res.status(403).json({ error: 'Rol inválido' })

    // Fechas (mes actual y hoy)
    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
    const inicioMesSiguiente = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const finHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

    // 1) Reservas de hoy confirmadas
    const reservasHoy = await prisma.reserva.count({
      where: {
        barberoId: userId,
        estado: 'CONFIRMED',
        fecha: { gte: inicioHoy, lt: finHoy },
      },
    })

    // 2) Ingresos del mes: reservas completadas (completadaAt != null) dentro del mes, sumando servicio.precio
    const completadasDelMes = await prisma.reserva.findMany({
      where: {
        barberoId: userId,
        completadaAt: { gte: inicioMes, lt: inicioMesSiguiente },
      },
      select: { servicio: { select: { precio: true } } },
    })
    const ingresosMes = completadasDelMes.reduce(
      (acc, r) => acc + (r.servicio?.precio ?? 0),
      0
    )

    // 3) Ocupación (placeholder hasta que definamos slots reales)
    const ocupacion = 0

    return res.status(200).json({ reservasHoy, ingresosMes, ocupacion })
  } catch (e: any) {
    console.error('metrics error:', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
