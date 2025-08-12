// src/pages/dashboard/cliente/index.tsx
import React, { useEffect, useMemo, useState } from 'react'
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
  count?: number
  action: 'reservar' | 'perfil'
  onClick: (id: number) => void
  debugInfo?: string
  debug?: boolean
}

function BarberCard({
  id, nombre, rating = 0, count = 0, action, onClick, debugInfo, debug,
}: BarberCardProps) {
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

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1.25 }}>
        <Rating
          value={rating}
          precision={0.5}
          readOnly
          size="small"
          sx={{ display: 'inline-flex', color: theme.palette.primary.main, fontSize: 18 }}
        />
        <Typography variant="caption" sx={{ color: '#bbb' }}>
          ({count})
        </Typography>
      </Box>

      {debug && (
        <Typography variant="caption" sx={{ color: '#777', display: 'block', mb: 1 }}>
          {debugInfo}
        </Typography>
      )}

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
  const debug = typeof router.query.debug !== 'undefined'

  // --- Mis Favoritos ---
  const { favoritos: favCards = [], isLoading: favLoading } = useFavoritosFull()

  // Mapas ratings (favoritos y disponibles)
  const [ratingsFav, setRatingsFav] = useState<Record<number, { avg: number; count: number }>>({})
  const [ratingsAvailByPerfil, setRatingsAvailByPerfil] = useState<Record<number, { avg: number; count: number }>>({})
  const [ratingsAvailByUser, setRatingsAvailByUser] = useState<Record<number, { avg: number; count: number }>>({})
  // Fallback per-card (por userId) para visibles
  const [ratingsPerCard, setRatingsPerCard] = useState<Record<number, { avg: number; count: number }>>({})

  // Ratings Favoritos por perfilId (lote)
  useEffect(() => {
    if (!favCards?.length) {
      setRatingsFav({})
      return
    }
    const perfilIds = favCards.map(f => f.id).filter(Boolean)
    if (!perfilIds.length) return

    const qs = encodeURI(perfilIds.join(','))
    fetch(`/api/ratings/bulk?perfilIds=${qs}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        const byPerfil: Record<number, { avg: number; count: number }> = {}
        const mapPU: Record<number, number> = data.mapPerfilToUser || {}
        const items: Array<{ barberoUserId: number; avg: number; count: number }> = data.items || []
        const byUser: Record<number, { avg: number; count: number }> = {}
        for (const it of items) byUser[it.barberoUserId] = { avg: Number(it.avg || 0), count: Number(it.count || 0) }
        for (const [perfilIdStr, userId] of Object.entries(mapPU)) {
          const perfilId = Number(perfilIdStr)
          if (byUser[userId]) byPerfil[perfilId] = byUser[userId]
        }
        setRatingsFav(byPerfil)
      })
      .catch(() => {})
  }, [favCards])

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

  // Lote por perfilId y por userId
  useEffect(() => {
    if (!barberos?.length) {
      setRatingsAvailByPerfil({})
      setRatingsAvailByUser({})
      return
    }

    const perfilIds = Array.from(new Set(
      barberos
        .map((b: any) =>
          b.perfilId ?? b.perfil_id ?? b.id_perfil ?? b.barberoId ?? b.id
        )
        .filter((x: any) => Number.isFinite(Number(x)))
        .map(Number)
    ))

    const userIds = Array.from(new Set(
      barberos
        .map((b: any) =>
          b.usuarioId ??
          b.userId ??
          b.barberoUserId ??
          b.user_id ??
          b.barbero_id ??
          b.barbero?.usuarioId ??
          b.barbero?.id ??
          b.ownerId ??
          b.id
        )
        .filter((x: any) => Number.isFinite(Number(x)))
        .map(Number)
    ))

    const fetchPerfil = perfilIds.length
      ? fetch(`/api/ratings/bulk?perfilIds=${encodeURI(perfilIds.join(','))}`).then(r => (r.ok ? r.json() : null))
      : Promise.resolve(null)

    const fetchUser = userIds.length
      ? fetch(`/api/ratings/bulk?barberoUserIds=${encodeURI(userIds.join(','))}`).then(r => (r.ok ? r.json() : null))
      : Promise.resolve(null)

    Promise.all([fetchPerfil, fetchUser])
      .then(([dataPerfil, dataUser]) => {
        if (dataPerfil) {
          const byPerfil: Record<number, { avg: number; count: number }> = {}
          const mapPU: Record<number, number> = dataPerfil.mapPerfilToUser || {}
          const items: Array<{ barberoUserId: number; avg: number; count: number }> = dataPerfil.items || []
          const byUserTmp: Record<number, { avg: number; count: number }> = {}
          for (const it of items) byUserTmp[it.barberoUserId] = { avg: Number(it.avg || 0), count: Number(it.count || 0) }
          for (const [perfilIdStr, userId] of Object.entries(mapPU)) {
            const perfilId = Number(perfilIdStr)
            if (byUserTmp[userId]) byPerfil[perfilId] = byUserTmp[userId]
          }
          setRatingsAvailByPerfil(byPerfil)
        } else {
          setRatingsAvailByPerfil({})
        }

        if (dataUser) {
          const itemsU: Array<{ barberoUserId: number; avg: number; count: number }> = dataUser.items || []
          const byUser: Record<number, { avg: number; count: number }> = {}
          for (const it of itemsU) byUser[it.barberoUserId] = { avg: Number(it.avg || 0), count: Number(it.count || 0) }
          setRatingsAvailByUser(byUser)
        } else {
          setRatingsAvailByUser({})
        }
      })
      .catch(() => {
        setRatingsAvailByPerfil({})
        setRatingsAvailByUser({})
      })
  }, [barberos])

  // Paginación
  const [visible, setVisible] = useState(10)
  const list = useMemo(() => barberos.slice(0, visible), [barberos, visible])
  const canLoadMore = barberos.length > visible

  // Fallback por-card (garantizado): obtenemos avg/count por userId de los visibles
  useEffect(() => {
    if (!list?.length) {
      setRatingsPerCard({})
      return
    }
    const userIdsVisible = Array.from(new Set(
      list
        .map((b: any) =>
          b.usuarioId ??
          b.userId ??
          b.barberoUserId ??
          b.user_id ??
          b.barbero_id ??
          b.barbero?.usuarioId ??
          b.barbero?.id ??
          b.ownerId ??
          b.id
        )
        .filter((x: any) => Number.isFinite(Number(x)))
        .map(Number)
    ))

    if (!userIdsVisible.length) {
      setRatingsPerCard({})
      return
    }

    // multipetición simple (1 por barbero visible)
    Promise.all(
      userIdsVisible.map(async (uid) => {
        const r = await fetch(`/api/ratings?barberoUserId=${uid}`)
        if (!r.ok) return [uid, null] as const
        const j = await r.json()
        // esperamos { avg: number, count?: number }
        const avg = Number(j?.avg ?? 0)
        const count = Number(j?.count ?? j?._count ?? 0)
        return [uid, { avg, count }] as const
      })
    ).then((pairs) => {
      const map: Record<number, { avg: number; count: number }> = {}
      for (const [uid, obj] of pairs) {
        if (obj) map[uid] = obj
      }
      setRatingsPerCard(map)
    }).catch(() => setRatingsPerCard({}))
  }, [list])

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

  const goPerfil = (id: number) => router.push(`/barbero/${id}`)
  const goReservar = (id: number) => router.push(`/barbero/${id}?reserve=true`)

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
            const r = ratingsFav[f.id]?.avg ?? 0
            const c = ratingsFav[f.id]?.count ?? 0
            return (
              <BarberCard
                key={f.id}
                id={f.id}
                nombre={nombre}
                rating={r}
                count={c}
                action="reservar"
                onClick={goReservar}
                debug={debug}
                debugInfo={`perfil:${f.id}`}
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

              const perfilId =
                b.perfilId ?? b.perfil_id ?? b.id_perfil ?? b.barberoId ?? b.id

              const userId =
                b.usuarioId ??
                b.userId ??
                b.barberoUserId ??
                b.user_id ??
                b.barbero_id ??
                b.barbero?.usuarioId ??
                b.barbero?.id ??
                b.ownerId ??
                b.id

              // prioridad: lote por perfilId -> lote por userId -> fallback por-card (userId) -> lo que venga del endpoint
              const rPerfil = ratingsAvailByPerfil[Number(perfilId)]
              const rUser   = ratingsAvailByUser[Number(userId)]
              const rCard   = ratingsPerCard[Number(userId)]
              const rating  = (rPerfil?.avg ?? rUser?.avg ?? rCard?.avg ?? b.avgRating ?? 0)
              const count   = (rPerfil?.count ?? rUser?.count ?? rCard?.count ?? b.ratingCount ?? 0)

              return (
                <BarberCard
                  key={`${perfilId}-${userId}`}
                  id={Number(perfilId)}
                  nombre={nombre}
                  rating={Number(rating) || 0}
                  count={Number(count) || 0}
                  action="perfil"
                  onClick={goPerfil}
                  debug={debug}
                  debugInfo={`perfil:${perfilId} · user:${userId}`}
                />
              )
            })}
          </Box>

          {canLoadMore && (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                onClick={() => setVisible((v) => v + 10)}
                sx={{ textTransform: 'none', borderColor: theme.palette.primary.main, color: '#fff' }}
                variant="outlined"
              >
                Ver más
              </Button>
            </Box>
          )}
        </>
      )}

      {/* PRÓXIMAS CITAS */}
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
