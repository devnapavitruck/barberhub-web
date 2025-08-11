// src/pages/api/me/perfil.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import { verify } from 'jsonwebtoken'

interface SessionPayload {
  userId: number
  role: 'CLIENTE' | 'BARBERO'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed' })
  }
  const token = authHeader.split(' ')[1]

  let payload: SessionPayload
  try {
    payload = verify(token, process.env.JWT_SECRET!) as SessionPayload
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const { userId, role } = payload

  // Incluimos exactamente según tu schema:
  // clientePerfil & barberoPerfil (1:1) :contentReference[oaicite:0]{index=0}
  // favoritos (ClienteFavoritos) + reservasCliente (ClienteReservas) + reservasBarbero (BarberoReservas) :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      clientePerfil: true,
      barberoPerfil: {
        include: {
          servicios: true,
          horarios: true,
          galeria: true,
        },
      },
      favoritos: {
        include: {
          barbero: {
            include: {
              barberoPerfil: {
                select: {
                  id: true,
                  nombres: true,
                  apellidos: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
      reservasCliente: {
        include: {
          barbero: {
            include: {
              barberoPerfil: {
                select: {
                  id: true,
                  nombres: true,
                  apellidos: true,
                },
              },
            },
          },
          servicio: true,
        },
      },
      reservasBarbero: {
        include: {
          cliente: {
            include: {
              clientePerfil: {
                select: {
                  id: true,
                  nombres: true,
                  apellidos: true,
                },
              },
            },
          },
          servicio: true,
        },
      },
    },
  })

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }

  if (role === 'CLIENTE') {
    const perfil = usuario.clientePerfil
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil de cliente no existe' })
    }
    return res.status(200).json({
      role,
      perfil: {
        id: perfil.id,
        avatarUrl: perfil.avatarUrl,
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        telefono: perfil.telefono,
        ciudad: perfil.ciudad,
        nacimiento: perfil.nacimiento,
        region: perfil.region,
        comuna: perfil.comuna,
        // Mapeo de favoritos con datos del perfil de cada barbero
        favoritos: usuario.favoritos.map(f => ({
          id: f.id,
          barbero: {
            id: f.barbero.id,
            perfil: f.barbero.barberoPerfil,
          },
        })),
        // Mapeo de reservas como cliente
        reservas: usuario.reservasCliente.map(r => ({
          id: r.id,
          fecha: r.fecha,
          hora: r.hora,
          barbero: {
            id: r.barbero.id,
            perfil: r.barbero.barberoPerfil,
          },
          servicio: r.servicio,
        })),
      },
    })
  }

  if (role === 'BARBERO') {
    const perfil = usuario.barberoPerfil
    if (!perfil) {
      return res.status(404).json({ error: 'Perfil de barbero no existe' })
    }
    return res.status(200).json({
      role,
      perfil: {
        id: perfil.id,
        avatarUrl: perfil.avatarUrl,
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        telefono: perfil.telefono,
        nacimiento: perfil.nacimiento,
        nombreBarberia: perfil.nombreBarberia,
        descripcion: perfil.descripcion,
        experiencia: perfil.experiencia,
        region: perfil.region,
        comuna: perfil.comuna,
        ciudad: perfil.ciudad,
        direccion: perfil.direccion,
        redesSociales: perfil.redesSociales,
        especialidades: perfil.especialidades,
        certificaciones: perfil.certificaciones,
        idiomas: perfil.idiomas,
        metodosPago: perfil.metodosPago,
        politicasCancel: perfil.politicasCancel,
        mostrarConteo: perfil.mostrarConteo,
        galeria: perfil.galeria,
        horarios: perfil.horarios,
        servicios: perfil.servicios,
        // Opcional: si quieres ver tus reservas como barbero
        reservas: usuario.reservasBarbero.map(r => ({
          id: r.id,
          fecha: r.fecha,
          hora: r.hora,
          cliente: {
            id: r.cliente.id,
            perfil: r.cliente.clientePerfil,
          },
          servicio: r.servicio,
        })),
      },
    })
  }

  return res.status(400).json({ error: 'Rol inválido' })
}
