// src/pages/api/barbero/reservas/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma' // dejamos tu import actual

type Estado = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Sólo GET' })

  // Acepta ?estado= o ?status= (opcional)
  const raw = (req.query.estado ?? req.query.status) as string | undefined
  const estado = raw ? (raw.toUpperCase() as Estado) : undefined
  const valid = new Set<Estado>(['PENDING', 'CONFIRMED', 'CANCELLED'])
  if (estado && !valid.has(estado)) return res.status(400).json({ error: 'Estado inválido' })

  // Filtros
  const where: any = {}
  if (estado) {
    where.estado = estado
    // Si quieres PENDING solo para hoy, descomenta:
    // if (estado === 'PENDING') {
    //   const inicio = new Date(); inicio.setHours(0, 0, 0, 0)
    //   const fin = new Date();    fin.setHours(23, 59, 59, 999)
    //   where.fecha = { gte: inicio, lte: fin }
    // }
  }

  try {
    const reservas = await prisma.reserva.findMany({
      where,
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      include: {
        servicio: { select: { id: true, nombre: true, duracion: true, precio: true } },
        cliente: {
          select: {
            id: true,
            clientePerfil: { select: { nombres: true, apellidos: true } },
          },
        },
      },
    })

    const items = reservas.map((r: any) => ({
      id: r.id,
      estado: r.estado as Estado,
      fecha: r.fecha instanceof Date ? r.fecha.toISOString() : r.fecha,
      hora:
        typeof r.hora === 'string' && r.hora
          ? r.hora
          : r.fecha instanceof Date
          ? r.fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
          : '',
      completadaAt: r.completadaAt ?? null,
      servicio: {
        id: r.servicio.id,
        nombre: r.servicio.nombre,
        duracion: r.servicio.duracion,
        precio: r.servicio.precio,
      },
      cliente: {
        id: r.cliente?.id ?? null,
        nombres: r.cliente?.clientePerfil?.nombres ?? '',
        apellidos: r.cliente?.clientePerfil?.apellidos ?? '',
      },
    }))

    return res.status(200).json({ items }) // ← SIEMPRE 200, aunque vacío
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
