// src/pages/_app.tsx
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import '@fontsource/montserrat/900.css'

import * as React from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Instanciamos el cliente de React Query
const queryClient = new QueryClient()

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#D4AF37' },
    background: { default: '#000000', paper: '#111111' },
    text: { primary: '#FFFFFF' },
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          background: 'transparent !important',
          color: 'inherit',
          boxShadow: 'none',
          '&:hover': {
            background: 'transparent !important',
            boxShadow: 'none',
          },
        },
      },
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
