// src/components/AppHeader.tsx
import React from 'react'
import { Box } from '@mui/material'

export default function AppHeader() {
  return (
    <Box
      sx={{
        py: 2,
        background: 'linear-gradient(45deg, #f09433, #bc1888)',
        textAlign: 'center',
      }}
    >
      <Box
        component="img"
        src="/images/logo-transparente.png"
        alt="BarberHub"
        sx={{ height: 40, mx: 'auto' }}
      />
    </Box>
  )
}
