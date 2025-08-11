// src/pages/barbero/[id].tsx
import React, { useEffect, useMemo, useState } from 'react'
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
} from '@mui/material'
import prisma from '@/lib/prisma'
import PublicLayout from '@/components/PublicLayout'
import ReserveModal from '@/components/Reservation/ReserveModal'
import ServiceCard from '@/components/ServiceCard'
import { ROUTES } from '@/routes'
import { useFavoritos } from '@/hooks/useFavoritos'

type Servicio = { id: number; nombre: string; precio: number; duracion: number; descripcion?: string }
type Horario  = { id: number; dia: string; inicio: string; fin: string }

interface PublicProfileProps {
  barberoId: number          // <-- id de PERFIL (no usuario)
  barberoName: string
  city: string
  servicios: Servicio[]
  horarios: Horario[]
  phone?: string             // <-- NUEVO
}

const BarberoPublicPage: NextPage<PublicProfileProps> = ({
  barberoId,
  barberoName,
  city,
  servicios: serviciosSSR,
  horarios,
  phone, // <-- NUEVO
}) => {
  const theme = useTheme()
  const router = useRouter()

  // ¿Es mi propio perfil?
  const [isMine, setIsMine] = useState(false)
  // userId de cliente (para reservar)
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

  // Favoritos (usa ids de PERFIL)
  const { isFavorite, toggleFavorite, isToggling } = useFavoritos(barberoId)

  // Abrir modal de reserva por query (?reserve=true)
  const [reserveOpen, setReserveOpen] = useState(false)
  useEffect(() => {
    if (!isMine && router.query.reserve === 'true') setReserveOpen(true)
  }, [router.query.reserve, isMine])

  // Servicios en estado para refrescar sin recargar
  const [servicios, setServicios] = useState<Servicio[]>(serviciosSSR)

  // Modal “Agregar servicio” (barbero dueño)
  const [svcOpen, setSvcOpen] = useState(false)
  const [svcNombre, setSvcNombre] = useState('')
  const [svcDescripcion, setSvcDescripcion] = useState('')
  const [svcPrecio, setSvcPrecio] = useState<number | ''>('')
  const [svcDuracion, setSvcDuracion] = useState<number | ''>('')
  const [svcSaving, setSvcSaving] = useState(false)

  const resetSvcForm = () => {
    setSvcNombre('')
    setSvcDescripcion('')
    setSvcPrecio('')
    setSvcDuracion('')
  }

  const handleCreateService = async () => {
    if (!svcNombre || !svcPrecio || !svcDuracion) return
    setSvcSaving(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/api/barbero/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          barberoId, // id de PERFIL
          nombre: svcNombre,
          precio: Number(svcPrecio),
          duracion: Number(svcDuracion),
          // descripcion: svcDescripcion, // descomenta cuando el backend la soporte
        }),
      })
      if (!res.ok) throw new Error('No se pudo crear el servicio')
      const nuevo = await res.json()
      setServicios((prev) => [
        { id: nuevo.id, nombre: nuevo.nombre, precio: nuevo.precio, duracion: nuevo.duracion, descripcion: svcDescripcion },
        ...prev,
      ])
      setSvcOpen(false)
      resetSvcForm()
    } catch {
      alert('Error al crear servicio.')
    } finally {
      setSvcSaving(false)
    }
  }

  return (
    <PublicLayout>
      <Box sx={{ textAlign: 'center', px: 2, pt: 4, pb: 6 }}>
        <Avatar
          sx={{
            width: 100,
            height: 100,
            mx: 'auto',
            mb: 2,
            fontSize: 40,
            bgcolor: theme.palette.primary.main,
          }}
        >
          {barberoName.charAt(0)}
        </Avatar>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          {barberoName}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary', mb: 2 }}>
          {city}
        </Typography>

        {/* Teléfono público del barbero */}
        {phone ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              href={`tel:${phone.replace(/\s+/g, '')}`}
              variant="outlined"
              sx={{ textTransform: 'none', borderRadius: 8 }}
            >
              Llamar {phone}
            </Button>
          </Box>
        ) : null}

        {/* Acciones: Cliente vs Barbero */}
        {isMine ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              onClick={() => router.push(ROUTES.BARBER.PROFILE_EDIT)}
              sx={{ textTransform: 'none', borderRadius: 8, px: 3 }}
            >
              Configurar cuenta
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard/barbero/horario')}
              sx={{ textTransform: 'none', borderRadius: 8, px: 3, borderColor: theme.palette.primary.main, color: '#fff' }}
            >
              Configurar horario
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Button
              onClick={() => toggleFavorite()}
              disabled={isToggling}
              sx={{
                textTransform: 'none',
                borderRadius: 8,
                px: 3,
                background: isFavorite ? theme.palette.primary.main : 'transparent',
                color: isFavorite ? '#fff' : theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}`,
              }}
            >
              {isFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}
            </Button>

            <Button
              onClick={() => setReserveOpen(true)}
              disabled={!clienteUserId}
              sx={{ textTransform: 'none', borderRadius: 8, px: 3 }}
              variant="contained"
            >
              Reservar
            </Button>
          </Box>
        )}

        {/* Horario (compacto) */}
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Horario de atención
          </Typography>
          {horarios.length === 0 ? (
            <Typography sx={{ color: '#9aa0a6' }}>Horario no configurado.</Typography>
          ) : (
            <Box sx={{ display: 'inline-flex', flexDirection: 'column', gap: 0.25 }}>
              {horarios.map((h) => (
                <Typography key={h.id} sx={{ color: '#ddd', fontSize: 14 }}>
                  {h.dia}: {h.inicio} – {h.fin}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />

        {/* Servicios */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 1.5,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Servicios
          </Typography>
          {isMine && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => setSvcOpen(true)}
              sx={{
                textTransform: 'none',
                borderColor: theme.palette.primary.main,
                color: '#fff',
                borderRadius: 2,
                px: 1.5,
                py: 0.3,
              }}
            >
              + Agregar
            </Button>
          )}
        </Box>

        {servicios.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 12 / 8,
              maxWidth: 700,
              mx: 'auto',
            }}
          >
            {servicios.map((s) => (
              <ServiceCard
                key={s.id}
                nombre={s.nombre}
                precio={s.precio}
                duracion={s.duracion}
                descripcion={s.descripcion}
              />
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: '#888' }}>No hay servicios definidos.</Typography>
        )}
      </Box>

      {/* Modal reserva (solo clientes) */}
      {!isMine && (
        <ReserveModal
          open={reserveOpen}
          onClose={() => setReserveOpen(false)}
          barberoId={barberoId}        // id de PERFIL
          userId={clienteUserId ?? 0}
          servicios={servicios}
        />
      )}

      {/* Modal agregar servicio */}
      <Dialog open={svcOpen} onClose={() => !svcSaving && setSvcOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar servicio</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nombre del servicio"
            value={svcNombre}
            onChange={(e) => setSvcNombre(e.target.value)}
            autoFocus
            required
          />
          <TextField
            label="Descripción (opcional)"
            value={svcDescripcion}
            onChange={(e) => setSvcDescripcion(e.target.value)}
            multiline
            minRows={3}
          />
          <TextField
            label="Precio"
            type="number"
            value={svcPrecio}
            onChange={(e) => setSvcPrecio(e.target.value === '' ? '' : Number(e.target.value))}
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          <TextField
            select
            label="Duración"
            value={svcDuracion}
            onChange={(e) => setSvcDuracion(Number(e.target.value))}
            required
            helperText="Selecciona la duración del servicio"
          >
            <MenuItem value={30}>30 min</MenuItem>
            <MenuItem value={60}>60 min</MenuItem>
            <MenuItem value={90}>90 min</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button disabled={svcSaving} onClick={() => setSvcOpen(false)}>Cancelar</Button>
          <Button
            disabled={svcSaving || !svcNombre || !svcPrecio || !svcDuracion}
            onClick={handleCreateService}
            variant="contained"
          >
            {svcSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </PublicLayout>
  )
}

export const getServerSideProps: GetServerSideProps<PublicProfileProps> = async ({ params }) => {
  // El parámetro puede llegar como PerfilBarbero.id o como usuarioId
  const param = Number(params?.id)

  // 1) intenta por PerfilBarbero.id
  let perfil = await prisma.perfilBarbero.findUnique({
    where: { id: param },
    select: { id: true, usuarioId: true, nombres: true, apellidos: true, ciudad: true, telefono: true }, // <-- tel
  })

  // 2) si no existe, intenta por usuarioId
  if (!perfil) {
    perfil = await prisma.perfilBarbero.findUnique({
      where: { usuarioId: param },
      select: { id: true, usuarioId: true, nombres: true, apellidos: true, ciudad: true, telefono: true }, // <-- tel
    })
  }

  if (!perfil) {
    return {
      props: {
        barberoId: 0,
        barberoName: 'Barbero Desconocido',
        city: 'Ciudad',
        servicios: [],
        horarios: [],
      },
    }
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

  return {
    props: {
      barberoId: perfilId,
      barberoName: `${perfil.nombres} ${perfil.apellidos}`.trim() || 'Barbero',
      city: perfil.ciudad || 'Ciudad',
      servicios,
      horarios,
      phone: perfil.telefono || '', // <-- NUEVO
    },
  }
}

export default BarberoPublicPage
