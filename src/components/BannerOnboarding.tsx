// src/components/BannerOnboarding.tsx

import React from 'react'
import { Box, Typography, Button, useTheme } from '@mui/material'

interface BannerOnboardingProps {
  title: string
  description: string
  buttonText: string
  onButtonClick: () => void | Promise<any>
}

export default function BannerOnboarding({
  title,
  description,
  buttonText,
  onButtonClick,
}: BannerOnboardingProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        bgcolor: '#111',
        border: `1px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        mb: 4,
      }}
    >
      <Typography variant="h5" sx={{ color: '#FFF', fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
        {description}
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={onButtonClick}
        sx={{ bgcolor: theme.palette.primary.main }}
      >
        {buttonText}
      </Button>
    </Box>
  )
}
