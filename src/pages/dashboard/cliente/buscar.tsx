// src/pages/dashboard/cliente/buscar.tsx

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  TextField,
  CircularProgress,
  Card,
  Avatar,
  Typography,
  Button,
  Rating,
  useTheme,
  IconButton,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DashboardLayout from '@/components/DashboardLayout'
import { useQuery } from '@tanstack/react-query'
import { ROUTES } from '@/routes'

interface Servicio { id: number; nombre: string; precio: number }
interface Barbero {
  barberoId: number
  nombre: string
  avgRating: number
  servicios: Servicio[]
}

export default function ClienteBuscar() {
  const theme = useTheme()
  const router = useRouter()
  const [filter, setFilter] = useState('')

  const { data, isLoading } = useQuery<Barbero[], Error>({
    queryKey: ['buscarBarberos'],
    queryFn: async () => {
      const res = await fetch('/api/cliente/barberos?disponibles=true')
      if (!res.ok) throw new Error('Error cargando barberos')
      return res.json()
    },
  })

  const barberos = data ?? []
  const filtrados = useMemo(() => {
    const term = filter.trim().toLowerCase()
    return term
      ? barberos.filter((b) => b.nombre.toLowerCase().includes(term))
      : barberos
  }, [barberos, filter])

  return (
    <DashboardLayout>
      {/* Buscador */}
      <Box sx={{ px: 2, pt: 4, pb: 2 }}>
        <TextField
          fullWidth
          placeholder="Buscar barbero por nombre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          variant="filled"
          InputProps={{
            sx: {
              bgcolor: '#222',
              borderRadius: 1,
              color: '#FFF',
            },
          }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : (
        <Box sx={{ px: 2, mb: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#FFF', flexGrow: 1 }}>
              Resultados ({filtrados.length})
            </Typography>
            {/* Botón + para nueva búsqueda */}
            <IconButton
              onClick={() => setFilter('')}
              sx={{ color: theme.palette.primary.main }}
            >
              <AddIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'center',
            }}
          >
            {filtrados.slice(0, 10).map((b) => (
              <Card
                key={b.barberoId}
                sx={{
                  width: 160,
                  bgcolor: '#1c1c1c',
                  borderRadius: 2,
                  p: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: 240,
                  justifyContent: 'space-between',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                    mb: 1,
                    fontSize: 24,
                  }}
                >
                  {b.nombre.charAt(0)}
                </Avatar>

                <Typography
                  sx={{
                    color: '#FFF',
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: 15,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textAlign: 'center',
                  }}
                >
                  {b.nombre}
                </Typography>

                <Rating
                  value={b.avgRating}
                  precision={0.5}
                  readOnly
                  size="small"
                  sx={{
                    color: theme.palette.primary.main,
                    mb: 1,
                  }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => router.push(`/barbero/${b.barberoId}`)}
                  sx={{
                    color: '#FFF',
                    borderColor: theme.palette.primary.main,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Ver Perfil
                </Button>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </DashboardLayout>
  )
}