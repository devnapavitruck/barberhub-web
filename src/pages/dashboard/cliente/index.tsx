// src/pages/dashboard/cliente/index.tsx
import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  Typography,
  Card,
  Avatar,
  Button,
  CircularProgress,
  Rating,
  useTheme,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '@/components/DashboardLayout'
import { useFavoritosFull } from '@/hooks/useFavoritos'

type BarberCardProps = {
  id: number
  nombre: string
  rating?: number
  action: 'reservar' | 'perfil'
  onClick: (id: number) => void
}

function BarberCard({ id, nombre, rating = 0, action, onClick }: BarberCardProps) {
  const theme = useTheme()
  return (
    <Card
      sx={{
        p: 2,
        textAlign: 'center',
        bgcolor: '#151515',
        borderRadius: 3,
        border: `1px solid ${theme.palette.primary.main}30`,
        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
        maxWidth: 320,
        mx: 'auto',
      }}
    >
      {/* AVATAR */}
      <Avatar
        sx={{
          bgcolor: theme.palette.primary.main,
          width: 56,
          height: 56,
          mx: 'auto',
          mb: 1.25,
          fontWeight: 800,
        }}
      >
        {nombre.charAt(0)}
      </Avatar>

      {/* NOMBRE */}
      <Typography
        sx={{
          color: '#FFF',
          fontSize: 14,
          fontWeight: 800,
          mb: 0.75,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 36,
        }}
      >
        {nombre}
      </Typography>

      {/* ESTRELLAS — mantén inline-flex para que queden en UNA línea */}
      <Rating
        value={rating}
        precision={0.5}
        readOnly
        size="small"
        sx={{
          display: 'inline-flex',
          color: theme.palette.primary.main,
          fontSize: 18,
          mb: 1.25,
        }}
      />

      {/* ACCIÓN ABAJO como BLOQUE */}
      {action === 'perfil' ? (
        <Button
          variant="outlined"
          size="small"
          onClick={() => onClick(id)}
          sx={{
            display: 'block',
            mt: 0.25,
            mx: 'auto',
            textTransform: 'none',
            borderColor: theme.palette.primary.main,
            color: '#fff',
          }}
        >
          Ver perfil
        </Button>
      ) : (
        <Typography
          role="button"
          onClick={() => onClick(id)}
          sx={{
            display: 'block',
            mt: 0.25,
            color: '#EEDB7C',
            fontWeight: 700,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          Reservar
        </Typography>
      )}
    </Card>
  )
}


export default function ClienteDashboard() {
  const theme = useTheme()
  const router = useRouter()

  // --- Mis Favoritos (datos completos) ---
  const { favoritos: favCards = [], isLoading: favLoading } = useFavoritosFull()

  // --- Barberos Disponibles ---
  const { data: barberos = [], isLoading: barLoading } = useQuery<any[], Error>({
    queryKey: ['barberosDisponibles'],
    queryFn: async () => {
      const res = await fetch('/api/cliente/barberos?disponibles=true')
      if (!res.ok) throw new Error('Error cargando barberos')
      return res.json()
    },
    staleTime: 60_000,
  })

  // Paginación/progresivo (10 por tanda)
  const [visible, setVisible] = useState(10)
  const list = useMemo(() => barberos.slice(0, visible), [barberos, visible])
  const canLoadMore = barberos.length > visible

  // --- Próxima Cita ---
  const { data: proximas = [], isLoading: proxLoading } = useQuery<any[], Error>({
    queryKey: ['proximaCita'],
    queryFn: async () => {
      const res = await fetch('/api/cliente/reservas?status=PENDING&limit=1')
      if (!res.ok) throw new Error('Error cargando próxima cita')
      return res.json()
    },
    staleTime: 30_000,
  })
  const proxima = proximas[0] || null

  // Helpers navegación
  const goPerfil = (id: number) => router.push(`/barbero/${id}`)
  const goReservar = (id: number) => router.push(`/barbero/${id}?reserve=true`)

  // Grilla contenida (no muy ancha)
  const sectionGridSx = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 1.5,
    mb: 4,
    maxWidth: 720,
    mx: 'auto',
  } as const

  const sectionTitleSx = {
    color: '#FFF',
    mb: 2,
    textTransform: 'uppercase',
    fontWeight: 900,
    letterSpacing: 0.2,
  } as const

  return (
    <DashboardLayout>
      {/* MIS FAVORITOS */}
      <Typography variant="h6" sx={sectionTitleSx}>
        Mis Favoritos
      </Typography>

      {favLoading ? (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : favCards.length === 0 ? (
        <Typography sx={{ color: '#888', mb: 4, maxWidth: 720, mx: 'auto' }}>
          Aún no tienes favoritos.
        </Typography>
      ) : (
        <Box sx={sectionGridSx}>
          {favCards.map((f) => {
            const nombre = `${f.nombres} ${f.apellidos}`.trim()
            return (
              <BarberCard
                key={f.id}
                id={f.id}
                nombre={nombre}
                rating={0}
                action="reservar"
                onClick={goReservar}
              />
            )
          })}
        </Box>
      )}

      {/* BARBEROS DISPONIBLES */}
      <Typography variant="h6" sx={sectionTitleSx}>
        Barberos Disponibles
      </Typography>

      {barLoading ? (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : barberos.length === 0 ? (
        <Typography sx={{ color: '#888', mb: 4, maxWidth: 720, mx: 'auto' }}>
          No hay barberos disponibles.
        </Typography>
      ) : (
        <>
          <Box sx={sectionGridSx}>
            {list.map((b: any) => {
              const nombre =
                b.nombre ||
                `${b.nombres ?? ''} ${b.apellidos ?? ''}`.trim() ||
                'Barbero'
              return (
                <BarberCard
                  key={b.barberoId || b.id}
                  id={b.barberoId || b.id}
                  nombre={nombre}
                  rating={b.avgRating ?? 0}
                  action="perfil"
                  onClick={goPerfil}
                />
              )
            })}
          </Box>

          {canLoadMore && (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                onClick={() => setVisible((v) => v + 10)}
                sx={{
                  textTransform: 'none',
                  borderColor: theme.palette.primary.main,
                  color: '#fff',
                }}
                variant="outlined"
              >
                Ver más
              </Button>
            </Box>
          )}
        </>
      )}

      {/* PRÓXIMAS CITAS (1 próxima) */}
      <Typography variant="h6" sx={sectionTitleSx}>
        Próximas Citas
      </Typography>

      {proxLoading ? (
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <CircularProgress color="inherit" />
        </Box>
      ) : proxima ? (
        <Card
          sx={{
            p: 2,
            bgcolor: '#151515',
            mb: 10,
            borderRadius: 3,
            border: `1px solid ${theme.palette.primary.main}30`,
            boxShadow: '0 8px 24px rgba(0,0,0,.5)',
            maxWidth: 720,
            mx: 'auto',
          }}
        >
          <Typography sx={{ color: '#FFF', fontWeight: 900 }}>
            {new Date(proxima.fecha).toLocaleDateString('es-CL')} · {proxima.hora}
          </Typography>

          <Typography sx={{ color: '#FFF', mt: 0.75 }}>
            Servicio: {proxima.servicio?.nombre ?? '—'}
          </Typography>

          <Typography sx={{ color: '#FFF', mt: 0.25 }}>
            Barbero:{' '}
            {(() => {
              const perfil = proxima.barbero?.barberoPerfil
              if (perfil) {
                const nombre = `${perfil.nombres ?? ''} ${perfil.apellidos ?? ''}`.trim()
                return nombre || perfil.nombreBarberia || '—'
              }
              return (
                proxima.barbero?.nombreBarberia ||
                proxima.barbero?.nombre ||
                '—'
              )
            })()}
          </Typography>
        </Card>
      ) : (
        <Typography sx={{ color: '#888', mb: 10, maxWidth: 720, mx: 'auto' }}>
          No tienes próximas citas.
        </Typography>
      )}
    </DashboardLayout>
  )
}
