// src/components/ServiceCard.tsx
import * as React from 'react'
import { Card, CardContent, Box, Typography, Chip, useTheme } from '@mui/material'

type Props = {
  nombre: string
  precio: number
  duracion: number
  descripcion?: string | null
  actions?: React.ReactNode // editar/eliminar o reservar
}

const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n)

export default function ServiceCard({ nombre, precio, duracion, descripcion, actions }: Props) {
  const theme = useTheme()
  return (
    <Card
      sx={{
        p: 0,
        borderRadius: 3,
        background: 'linear-gradient(180deg, #1f1f1f 0%, #151515 100%)',
        border: `1px solid ${theme.palette.primary.main}40`,
        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
      }}
    >
      <CardContent>
        {/* Título + precio (pill EXACTA del dashboard) */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography sx={{ color: '#FFF', fontWeight: 700 }}>{nombre}</Typography>
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: `1px solid ${theme.palette.primary.main}40`,
              background: '#2a2a2a',
              color: '#EEDB7C',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            ${fmtCLP(precio)}
          </Box>
        </Box>

        {/* Descripción opcional (no altera layout si no existe) */}
        {descripcion && (
          <Typography
            variant="body2"
            sx={{
              color: '#bdbdbd',
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {descripcion}
          </Typography>
        )}

        {/* Duración + acciones (alineación idéntica) */}
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            size="small"
            label={`${duracion} min`}
            sx={{
              bgcolor: '#262626',
              color: '#ddd',
              border: `1px solid ${theme.palette.primary.main}30`,
            }}
          />
          <Box sx={{ flex: 1 }} />
          <Box display="flex" alignItems="center" gap={1}>
            {actions}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
