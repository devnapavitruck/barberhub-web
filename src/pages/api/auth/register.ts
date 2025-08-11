// pages/api/auth/register.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// RegEx de validación
const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/

// Configura el transporter de correo usando SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER as string,
    pass: process.env.EMAIL_PASS as string,
  },
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sólo POST permitido' })
  }

  const {
    email,
    password,
    rol,
    nombres,
    apellidos,
    telefono,
    nacimiento,
    region,
    comuna,
    ciudad,
  } = req.body as {
    email:      string
    password:   string
    rol:        'CLIENTE' | 'BARBERO'
    nombres?:   string
    apellidos?: string
    telefono?:  string
    nacimiento?: string
    region?:    string
    comuna?:    string
    ciudad?:    string
  }

  // 1) Validaciones básicas
  if (!email || !password || !rol) {
    return res.status(400).json({ error: 'Faltan datos básicos' })
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        'Contraseña debe tener 8+ caracteres, incluir mayúscula, minúscula y número',
    })
  }
  if (!['CLIENTE', 'BARBERO'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' })
  }

  try {
    // 2) Evitar duplicados
    const exists = await prisma.usuario.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ error: 'Correo ya registrado' })

    // 3) Crear usuario
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.usuario.create({
      data: { email, password: hashed, rol },
    })

    // 4a) Si es CLIENTE, crear su perfil
    if (rol === 'CLIENTE') {
      await prisma.perfilCliente.create({
        data: {
          usuarioId:  user.id,
          nombres:    nombres   || '',
          apellidos:  apellidos || '',
          telefono:   telefono  || '',
          ciudad:     ciudad    || '',
          region:     region    || '',
          comuna:     comuna    || '',
          nacimiento: nacimiento ? new Date(nacimiento) : new Date(),
        },
      })
    }

    // 4b) Si es BARBERO, crear perfil + servicio inicial
    if (rol === 'BARBERO') {
      const perfilData = {
        usuarioId:      user.id,
        nombres:        nombres      || '',
        apellidos:      apellidos    || '',
        telefono:       telefono     || '',
        nacimiento:     nacimiento   ? new Date(nacimiento) : new Date(),
        nombreBarberia: '',
        descripcion:    '',
        experiencia:    0,
        region:         region       || '',
        comuna:         comuna       || '',
        ciudad:         ciudad       || '',
        direccion:      '',
        especialidades: '',
        idiomas:        '',
        mostrarConteo:  true,
      } as any

      const perfil = await prisma.perfilBarbero.create({
        data: perfilData,
      })

      await prisma.servicio.create({
        data: {
          barberoId: perfil.id,
          nombre:    'Corte de Cabello',
          precio:     10000,
          duracion:    60,
        },
      })
    }

    // 5) Generar JWT y enviar correo
    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )
    await transporter.sendMail({
      from: `"BarberHub" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: '¡Bienvenido a BarberHub!',
      html: `
        <p>Hola <strong>${email}</strong>,</p>
        <p>Tu cuenta como <em>${rol}</em> ha sido creada.</p>
        <p>Puedes iniciar sesión <a href="${process.env.NEXTAUTH_URL}/login">aquí</a>.</p>
      `,
    })

    return res.status(201).json({
      user:  { id: user.id, email: user.email, rol: user.rol },
      token,
    })
  } catch (err: any) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
