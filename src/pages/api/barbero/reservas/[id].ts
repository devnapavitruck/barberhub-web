// src/pages/api/barbero/reservas/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { reservationTemplate } from '@/utils/emailTemplates'
import { sendHtmlEmail, buildICS } from '@/utils/mailer'

type Estado = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Sólo PATCH' })

  const id = Number(req.query.id)
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' })

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const estado = (body?.estado as string | undefined)?.toUpperCase() as Estado | undefined
    if (!estado || !['CONFIRMED', 'CANCELLED'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' })
    }

    // 1) Obtenemos la reserva (solo los campos que necesitamos, seguro con tu esquema)
    const prev = await prisma.reserva.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
        fecha: true,
        hora: true,
        barberoId: true, // userId del barbero (según tu lógica previa)
        cliente: {
          select: {
            email: true,
            clientePerfil: { select: { nombres: true, apellidos: true } },
          },
        },
        servicio: { select: { nombre: true, duracion: true } },
      },
    })
    if (!prev) return res.status(404).json({ error: 'Reserva no encontrada' })

    // 2) Actualizamos estado
    const updated = await prisma.reserva.update({
      where: { id },
      data: { estado },
      select: { id: true, estado: true, fecha: true, hora: true },
    })

    // 3) Si pasó a CONFIRMED y antes no lo estaba, intentamos enviar email al cliente
    if (estado === 'CONFIRMED' && prev.estado !== 'CONFIRMED') {
      const to = prev.cliente?.email
      if (to) {
        try {
          // Barbero (por perfil, a partir de usuarioId)
          let barberoNombre = 'Barbero'
          let barberoCiudad = ''
          if (prev.barberoId) {
            const perfilBarbero = await prisma.perfilBarbero.findFirst({
              where: { usuarioId: prev.barberoId },
              select: { nombres: true, apellidos: true, nombreBarberia: true, ciudad: true },
            })
            if (perfilBarbero) {
              barberoNombre =
                `${perfilBarbero.nombres ?? ''} ${perfilBarbero.apellidos ?? ''}`.trim() ||
                perfilBarbero.nombreBarberia ||
                'Barbero'
              barberoCiudad = perfilBarbero.ciudad || ''
            }
          }

          // Computamos fecha/hora local y fin por duración
          const start = new Date(prev.fecha)
          if (prev.hora) {
            const [h, m] = prev.hora.split(':').map((n) => parseInt(n || '0', 10))
            start.setHours(h, m, 0, 0)
          }
          const dur = prev.servicio?.duracion ?? 60
          const end = new Date(start.getTime() + dur * 60000)

          const clienteNombre =
            `${prev.cliente?.clientePerfil?.nombres ?? ''} ${prev.cliente?.clientePerfil?.apellidos ?? ''}`.trim() || 'Cliente'

          const fechaFormateada = start.toLocaleDateString('es-CL', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
          const horaFormateada = start.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

          const html = reservationTemplate({
            nombre: clienteNombre,
            barbero: barberoNombre,
            servicio: prev.servicio?.nombre ?? 'Servicio',
            fechaFormateada,
            hora: horaFormateada,
            direccion: barberoCiudad || '—',
          })

          const ics = buildICS({
            uid: `reserva-${id}@barberhub`,
            title: `BarberHub: ${prev.servicio?.nombre ?? 'Reserva'}`,
            startISO: start.toISOString(),
            endISO: end.toISOString(),
            location: barberoCiudad,
            description: `Reserva con ${barberoNombre}`,
          })

          await sendHtmlEmail({
            to,
            subject: '✅ Reserva confirmada — BarberHub',
            html,
            attachments: [{ filename: 'reserva.ics', content: ics, contentType: 'text/calendar' }],
          })
        } catch (mailErr) {
          // No bloqueamos la confirmación si falla el mail
          console.warn('Aviso: error al enviar correo de confirmación:', (mailErr as any)?.message || mailErr)
        }
      }
    }

    return res.status(200).json({ ok: true, item: updated })
  } catch (e: any) {
    if (e?.code === 'P2025') return res.status(404).json({ error: 'Reserva no encontrada' })
    console.error('PATCH /barbero/reservas/[id] error:', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
