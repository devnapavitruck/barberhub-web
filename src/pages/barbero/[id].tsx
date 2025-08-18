// src/pages/barbero/[id].tsx
import React, { useEffect, useState } from 'react'
import { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  Avatar,
  Typography,
  Button,
  useTheme,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  Rating,
  Tabs,
  Tab,
  IconButton,
  Stack,
  Chip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ShareIcon from '@mui/icons-material/Share'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import prisma from '@/lib/prisma'
import PublicLayout from '@/components/PublicLayout'
import ReserveModal from '@/components/Reservation/ReserveModal'
import ServiceCard from '@/components/ServiceCard'
import { ROUTES } from '@/routes'
import { useFavoritos } from '@/hooks/useFavoritos'

type Servicio = { id: number; nombre: string; precio: number; duracion: number; descripcion?: string }
type Horario  = { id: number; dia: string; inicio: string; fin: string }
type RatingInfo = { avg: number; count: number }

interface PublicProfileProps {
  barberoId: number
  barberoUserId: number
  barberoName: string
  city: string
  servicios: Servicio[]
  horarios: Horario[]
  phone?: string
  rating?: RatingInfo
}

const BarberoPublicPage: NextPage<PublicProfileProps> = ({
  barberoId,
  barberoUserId,
  barberoName,
  city,
  servicios: serviciosSSR,
  horarios,
  phone,
  rating,
}) => {
  const theme = useTheme()
  const router = useRouter()

  // ¿Es mi propio perfil?
  const [isMine, setIsMine] = useState(false)
  const [clienteUserId, setClienteUserId] = useState<number | null>(null)
  useEffect(() => {
    try {
      const role = localStorage.getItem('barberHub:rol')
      const localUserId = Number(localStorage.getItem('barberHub:userId') || '0')
      setIsMine(role === 'BARBERO')
      setClienteUserId(role === 'CLIENTE' ? (localUserId || null) : null)
    } catch {
      setIsMine(false)
      setClienteUserId(null)
    }
  }, [barberoId])

  // Favoritos (usa id de PERFIL)
  const { isFavorite, toggleFavorite, isToggling } = useFavoritos(barberoId)

  // Modal de reserva
  const [reserveOpen, setReserveOpen] = useState(false)
  useEffect(() => {
    if (!isMine && router.query.reserve === 'true') setReserveOpen(true)
  }, [router.query.reserve, isMine])

  // Servicios en estado
  const [servicios, setServicios] = useState<Servicio[]>(serviciosSSR)

  // “Agregar servicio” (solo dueño)
  const [svcOpen, setSvcOpen] = useState(false)
  const [svcNombre, setSvcNombre] = useState('')
  const [svcDescripcion, setSvcDescripcion] = useState('')
  const [svcPrecio, setSvcPrecio] = useState<number | ''>('')
  const [svcDuracion, setSvcDuracion] = useState<number | ''>('')
  const [svcSaving, setSvcSaving] = useState(false)
  const resetSvcForm = () => { setSvcNombre(''); setSvcDescripcion(''); setSvcPrecio(''); setSvcDuracion('') }
  const handleCreateService = async () => {
    if (!svcNombre || !svcPrecio || !svcDuracion) return
    setSvcSaving(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/api/barbero/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ barberoId, nombre: svcNombre, precio: Number(svcPrecio), duracion: Number(svcDuracion) }),
      })
      if (!res.ok) throw new Error('No se pudo crear el servicio')
      const nuevo = await res.json()
      setServicios(prev => [{ id: nuevo.id, nombre: nuevo.nombre, precio: nuevo.precio, duracion: nuevo.duracion, descripcion: svcDescripcion }, ...prev])
      setSvcOpen(false); resetSvcForm()
    } catch { alert('Error al crear servicio.') } finally { setSvcSaving(false) }
  }

  // ---------- Rating (promedio + mío) ----------
  const [avg, setAvg] = useState<number>(rating?.avg ?? 0)
  const [count, setCount] = useState<number>(rating?.count ?? 0)
  const [myRating, setMyRating] = useState<number | null>(null)
  const [savingRate, setSavingRate] = useState(false)

  useEffect(() => {
    if (!clienteUserId) return
    const url = `/api/ratings?barberoUserId=${barberoUserId}&clienteUserId=${clienteUserId}`
    fetch(url).then(r => r.ok ? r.json() : null).then((data) => {
      if (!data) return
      if (typeof data.mine === 'number') setMyRating(data.mine)
      if (typeof data.avg === 'number') setAvg(data.avg)
      if (typeof data.count === 'number') setCount(data.count)
    }).catch(() => {})
  }, [clienteUserId, barberoUserId])

  const handleChangeRating = async (_: any, value: number | null) => {
    if (!clienteUserId || !value) return
    setSavingRate(true)
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberoUserId, clienteUserId, estrellas: value }),
      })
      if (res.ok) {
        setMyRating(value)
        const r = await fetch(`/api/ratings?barberoUserId=${barberoUserId}`)
        const agg = await r.json()
        setAvg(agg.avg ?? value)
        setCount(agg.count ?? count)
      }
    } catch {} finally { setSavingRate(false) }
  }
  // ---------------------------------------------

  // UI state (reordenado: HORARIO en 2º lugar)
  type TabKey = 'SERVICIOS' | 'HORARIO' | 'RESEÑAS' | 'GALERIA'
  const [tab, setTab] = useState<TabKey>('SERVICIOS')

  return (
    <PublicLayout>
      {/* HEADER: centrado real con grid 1fr auto 1fr */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2, backdropFilter: 'blur(6px)', bgcolor: 'rgba(0,0,0,0.55)' }}>
        <Box
          sx={{
            px: 1, py: 1,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
          }}
        >
          <Box sx={{ justifySelf: 'start' }}>
            <IconButton onClick={() => router.back()} aria-label="Volver" size="small">
              <ArrowBackIcon />
            </IconButton>
          </Box>

          <Typography
            variant="subtitle2"
            sx={{ justifySelf: 'center', fontWeight: 900, textTransform: 'uppercase', letterSpacing: .4 }}
          >
            Perfil de Barbero
          </Typography>

          <Box sx={{ justifySelf: 'end' }}>
            <IconButton aria-label="Compartir" size="small" onClick={() => {
              if (navigator.share) navigator.share({ title: barberoName, url: window.location.href }).catch(() => {})
            }}>
              <ShareIcon />
            </IconButton>
            <IconButton aria-label="Favorito" size="small" onClick={() => toggleFavorite()} disabled={isToggling}>
              {isFavorite ? <FavoriteIcon color="primary" /> : <FavoriteBorderIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* HERO */}
      <Box sx={{ textAlign: 'center', px: 2, pt: 3, pb: 3 }}>
        <Avatar sx={{ width: 96, height: 96, mx: 'auto', mb: 1.5, fontSize: 36, bgcolor: theme.palette.primary.main }}>
          {barberoName.charAt(0)}
        </Avatar>

        <Typography variant="h6" sx={{ fontWeight: 800 }}>{barberoName}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>{city}</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <Rating
            value={clienteUserId ? (myRating ?? 0) : Number(avg)}
            precision={0.5}
            readOnly={!clienteUserId || savingRate}
            onChange={handleChangeRating}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {count > 0 ? `(${count})` : '(sé el primero)'}
          </Typography>
        </Box>

        {/* Acciones (dueño vs público) */}
        {isMine ? (
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 1 }}>
            <Button size="small" variant="contained" onClick={() => router.push(ROUTES.BARBER.PROFILE_EDIT)}>Configurar cuenta</Button>
            <Button size="small" variant="outlined" onClick={() => router.push('/dashboard/barbero/horario')} sx={{ color: '#fff', borderColor: theme.palette.primary.main }}>Configurar horario</Button>
          </Stack>
        ) : phone ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Button href={`tel:${phone.replace(/\s+/g, '')}`} size="small" variant="outlined" sx={{ textTransform: 'none' }}>
              Llamar {phone}
            </Button>
          </Box>
        ) : null}

        {/* CTA protagonista: justo antes de las pestañas */}
        {!isMine && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
            <Button
              onClick={() => setReserveOpen(true)}
              disabled={!clienteUserId}
              variant="contained"
              disableElevation
              sx={{
                textTransform: 'none',
                borderRadius: 999,
                px: 3.5,
                py: 1.1,
                fontWeight: 900,
                backgroundColor: '#EEDB7C !important',
                color: '#111 !important',
                boxShadow: '0 10px 26px rgba(238,219,124,.35)',
                '&:hover': { backgroundColor: '#e5cf62 !important' },
                width: 'min(420px, 100%)',
              }}
            >
              Reservar ahora
            </Button>
          </Box>
        )}
      </Box>

      {/* TABS (Horario en 2º lugar) */}
      <Box sx={{ px: 2, pb: 10 }}>
        <Tabs
          value={tab}
          onChange={(_: any, v: TabKey) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mt: 1, '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, minHeight: 42 } }}
        >
          <Tab value="SERVICIOS" label="Servicios" />
          <Tab value="HORARIO" label="Horario" />
          <Tab value="RESEÑAS" label="Reseñas" />
          <Tab value="GALERIA" label="Galería" />
        </Tabs>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* CONTENIDOS */}
        {tab === 'SERVICIOS' && (
          <Box sx={{ mt: 2 }}>
            {servicios.length > 0 ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 1.5, maxWidth: 760, mx: 'auto' }}>
                {servicios.map((s) => (
                  <Box key={s.id} onClick={() => setReserveOpen(true)} sx={{ cursor: 'pointer' }}>
                    <ServiceCard nombre={s.nombre} precio={s.precio} duracion={s.duracion} descripcion={s.descripcion} />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography sx={{ color: '#888', mt: 1 }}>No hay servicios definidos.</Typography>
            )}
          </Box>
        )}

        {tab === 'HORARIO' && (
          <Box sx={{ mt: 2, textAlign: 'left', maxWidth: 520, mx: 'auto' }}>
            {horarios.length === 0 ? (
              <Typography sx={{ color: '#9aa0a6', mt: 1 }}>Horario no configurado.</Typography>
            ) : (
              <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                {horarios.map((h, i) => (
                  <Box
                    key={h.id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 2, py: 1.25,
                      borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Typography sx={{ fontWeight: 800 }}>{h.dia}</Typography>
                    <Chip
                      label={`${h.inicio} — ${h.fin}`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(238,219,124,0.14)',
                        color: '#EEDB7C',
                        border: '1px solid rgba(238,219,124,0.35)',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {tab === 'RESEÑAS' && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>Valoraciones</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip label={`${avg.toFixed(1)}★`} color="primary" />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{count} en total</Typography>
            </Stack>
            <Typography sx={{ color: '#888' }}>Las reseñas con comentarios llegarán pronto.</Typography>
          </Box>
        )}

        {tab === 'GALERIA' && (
          <Box sx={{ mt: 2 }}>
            <Typography sx={{ color: '#888' }}>La galería llegará pronto.</Typography>
          </Box>
        )}
      </Box>

      {/* Modal reserva (solo clientes) */}
      {!isMine && (
        <ReserveModal
          open={reserveOpen}
          onClose={() => setReserveOpen(false)}
          barberoId={barberoId}
          userId={clienteUserId ?? 0}
          servicios={servicios}
        />
      )}

      {/* Modal agregar servicio (dueño) */}
      <Dialog open={svcOpen} onClose={() => !svcSaving && setSvcOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar servicio</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nombre del servicio" value={svcNombre} onChange={(e) => setSvcNombre(e.target.value)} autoFocus required />
          <TextField label="Descripción (opcional)" value={svcDescripcion} onChange={(e) => setSvcDescripcion(e.target.value)} multiline minRows={3} />
          <TextField
            label="Precio" type="number" value={svcPrecio}
            onChange={(e) => setSvcPrecio(e.target.value === '' ? '' : Number(e.target.value))}
            required InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
          <TextField select label="Duración" value={svcDuracion} onChange={(e) => setSvcDuracion(Number(e.target.value))} required helperText="Selecciona la duración del servicio">
            <MenuItem value={30}>30 min</MenuItem>
            <MenuItem value={60}>60 min</MenuItem>
            <MenuItem value={90}>90 min</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button disabled={svcSaving} onClick={() => setSvcOpen(false)}>Cancelar</Button>
          <Button disabled={svcSaving || !svcNombre || !svcPrecio || !svcDuracion} onClick={handleCreateService} variant="contained">
            {svcSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PublicLayout>
  )
}

export const getServerSideProps: GetServerSideProps<PublicProfileProps> = async ({ params }) => {
  const param = Number(params?.id)

  // Perfil por id de perfil o por usuarioId
  let perfil = await prisma.perfilBarbero.findUnique({
    where: { id: param },
    select: { id: true, usuarioId: true, nombres: true, apellidos: true, ciudad: true, telefono: true },
  })
  if (!perfil) {
    perfil = await prisma.perfilBarbero.findUnique({
      where: { usuarioId: param },
      select: { id: true, usuarioId: true, nombres: true, apellidos: true, ciudad: true, telefono: true },
    })
  }
  if (!perfil) {
    return { props: { barberoId: 0, barberoUserId: 0, barberoName: 'Barbero Desconocido', city: 'Ciudad', servicios: [], horarios: [] } }
  }
  const perfilId = perfil.id

  const servicios = await prisma.servicio.findMany({
    where: { barberoId: perfilId },
    select: { id: true, nombre: true, precio: true, duracion: true },
    orderBy: [{ id: 'desc' }],
    take: 20,
  })

  const horarios = await prisma.horario.findMany({
    where: { barberoId: perfilId },
    select: { id: true, dia: true, inicio: true, fin: true },
    orderBy: [{ id: 'asc' }],
    take: 30,
  })

  // promedio y cantidad desde tabla auxiliar ratings_barbero
  const agg = await prisma.$queryRaw<{ avg: number | null; count: bigint }[]>`
    SELECT AVG(estrellas) AS avg, COUNT(*) AS count
    FROM ratings_barbero
    WHERE barbero_usuario_id = ${perfil.usuarioId}
  `
  const row = agg?.[0]
  const rating: RatingInfo = { avg: Number(row?.avg ?? 0), count: Number(row?.count ?? 0) }

  return {
    props: {
      barberoId: perfilId,
      barberoUserId: perfil.usuarioId,
      barberoName: `${perfil.nombres} ${perfil.apellidos}`.trim() || 'Barbero',
      city: perfil.ciudad || 'Ciudad',
      servicios,
      horarios,
      phone: perfil.telefono || '',
      rating,
    },
  }
}

export default BarberoPublicPage
