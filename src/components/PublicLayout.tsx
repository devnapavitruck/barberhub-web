// src/components/PublicLayout.tsx
import React, { PropsWithChildren } from 'react'
import { Box } from '@mui/material'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'

export default function PublicLayout({ children }: PropsWithChildren<{}>) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#FFF', pb: 8 }}>
      <AppHeader />

      <Box sx={{ maxWidth: 600, mx: 'auto', px: 2, pt: 4 }}>
        {children}
      </Box>

      <BottomNav />
    </Box>
  )
}
