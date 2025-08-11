// src/pages/api/auth/login.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import prisma from '@/lib/prisma'  // asume que ya tienes un cliente prisma exportado

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_PORT === '465',
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
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Sólo POST permitido' })
  }

  const { email, password } = req.body as { email: string; password: string }
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan email o password' })
  }

  try {
    // 1) Busca usuario
    const user = await prisma.usuario.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // 2) Verifica contraseña
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    // 3) Genera JWT
    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    )

    // 4) Setea cookie HTTP-only con el token
    const maxAge = 60 * 60 * 24 * 7 // 7 días
    const cookie = [
      `token=${token}`,
      `HttpOnly`,
      `Path=/`,
      `Max-Age=${maxAge}`,
      `SameSite=Lax`,
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ')
    res.setHeader('Set-Cookie', cookie)

    // 5) Devuelve el token en el body para que tu cliente lo guarde en localStorage
    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, rol: user.rol },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
