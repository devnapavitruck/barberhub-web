// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // No frenar el build por ESLint en Vercel/CI (Preview)
  eslint: { ignoreDuringBuilds: true },

  // (opcional) Si hubiera errores de tipos, tampoco frenes el build
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
