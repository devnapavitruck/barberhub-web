// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // para evitar múltiples instancias en desarrollo
  // eslint-disable-next-line vars-on-top
  var __db: PrismaClient | undefined
}

const prisma = global.__db || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.__db = prisma

export default prisma
