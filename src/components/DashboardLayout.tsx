// src/components/DashboardLayout.tsx
import React, { PropsWithChildren } from 'react'
import { Box, Typography } from '@mui/material'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'

type Role = 'CLIENTE' | 'BARBERO'

interface DashboardLayoutProps extends PropsWithChildren {
  /** Fuerza el rol para el BottomNav (útil en páginas protegidas) */
  role?: Role
  /** Título opcional que se muestra bajo el header */
  title?: string
}

export default function DashboardLayout({ children, role, title }: DashboardLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#000',
        color: '#FFF',
        pb: 8, // espacio para el BottomNav
      }}
    >
      {/* Header unificado */}
      <AppHeader />

      {/* Contenido principal */}
      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 4 }}>
        {title && (
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            {title}
          </Typography>
        )}
        {children}
      </Box>

      {/* Navegación inferior dinámica (respeta role si viene) */}
      <BottomNav forcedRole={role} />
    </Box>
  )
}
