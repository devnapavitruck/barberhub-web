// src/pages/dashboard/barbero/index.tsx
import React, { useMemo, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  useTheme,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import DashboardLayout from '@/components/DashboardLayout'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMiPerfil } from '@/hooks/useMiPerfil'

type Estado = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

interface ReservaHoy {
  id: number
  clienteNombre?: string
  hora: string
  servicioNombre: string
  estado: Estado
}

interface Servicio {
  id: number
  nombre: string
  descripcion?: string | null
  precio: number
  duracion: number
}

interface MetricsResp {
  reservasMes?: number
  ocupacion?: number
  ingresosMes?: number
}

// ---------- helpers ----------
const fmtCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(n)

const estadoLabel: Record<Estado, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
}

const durOptions = [30, 60, 90]

// ---------- Modal Crear/Editar ----------
type ModalMode = 'create' | 'edit'
interface SvcModalState {
  open: boolean
  mode: ModalMode
  svc?: Servicio
}

const ServiceModal = ({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean
  mode: ModalMode
  initial?: Partial<Servicio>
  onClose: () => void
  onSaved: () => void
}) => {
  const theme = useTheme()
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [duracion, setDuracion] = useState<number>(initial?.duracion ?? 60)
  const [precioStr, setPrecioStr] = useState(
    initial?.precio != null ? fmtCLP(initial.precio) : ''
  )
  const [saving, setSaving] = useState(false)

  const precioNum = useMemo(() => {
    const n = Number(precioStr.replace(/\./g, '').replace(/\s/g, ''))
    return Number.isFinite(n) ? n : 0
  }, [precioStr])

  const onChangePrecio = (v: string) => {
    const raw = v.replace(/[^\d]/g, '')
    const n = raw ? Number(raw) : 0
    setPrecioStr(n ? fmtCLP(n) : '')
  }

  const canSave =
    nombre.trim().length > 0 &&
    nombre.trim().length <= 75 &&
    (descripcion || '').length <= 120 &&
    precioNum > 0 &&
    durOptions.includes(duracion)

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const token = localStorage.getItem('token') || ''
      const payload = {
        nombre: nombre.trim(),
        descripcion: (descripcion || '').trim(),
        precio: precioNum,
        duracion,
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      let res: Response
      if (mode === 'create') {
        res = await fetch('/api/barbero/servicios', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/barbero/servicios/${initial?.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) throw new Error('No se pudo guardar')
      onSaved()
      onClose()
    } catch {
      alert('Error al guardar el servicio.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: '#1a1a1a',
          borderRadius: 3,
          border: `1px solid ${theme.palette.primary.main}40`,
          boxShadow: '0 8px 24px rgba(0,0,0,.6)',
        },
      }}>
      <DialogTitle sx={{ color: '#FFF', fontWeight: 700 }}>
        {mode === 'create' ? 'Agregar servicio' : 'Editar servicio'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <TextField
          label="Nombre del servicio"
          variant="filled"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.slice(0, 75))}
          helperText={`${nombre.length}/75`}
          inputProps={{ maxLength: 75 }}
          fullWidth
        />
        <TextField
          label="Descripción (opcional)"
          variant="filled"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value.slice(0, 120))}
          helperText={`${(descripcion || '').length}/120`}
          inputProps={{ maxLength: 120 }}
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label="Precio"
          variant="filled"
          value={precioStr}
          onChange={(e) => onChangePrecio(e.target.value)}
          placeholder="$ 25.000"
          fullWidth
          InputProps={{ startAdornment: <Box sx={{ mr: .5 }}>$</Box> }}
        />
        <TextField
          label="Duración"
          variant="filled"
          select
          value={duracion}
          onChange={(e) => setDuracion(Number(e.target.value))}
          helperText="Selecciona la duración del servicio"
          fullWidth
        >
          {durOptions.map((m) => (
            <MenuItem key={m} value={m}>{m} min</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------- Card de Servicio ----------
const ServiceCard = ({
  svc,
  onEdit,
  onDelete,
}: {
  svc: Servicio
  onEdit: () => void
  onDelete: () => void
}) => {
  const theme = useTheme()
  return (
    <Box
      sx={{
        position: 'relative',
        p: 2,
        borderRadius: 3,
        background: 'linear-gradient(180deg, #1f1f1f 0%, #151515 100%)',
        border: `1px solid ${theme.palette.primary.main}40`,
        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ color: '#FFF', fontWeight: 700 }}>{svc.nombre}</Typography>
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
          ${fmtCLP(svc.precio)}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="small"
          label={`${svc.duracion} min`}
          sx={{
            bgcolor: '#262626',
            color: '#ddd',
            border: `1px solid ${theme.palette.primary.main}30`,
          }}
        />
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" onClick={onEdit} sx={{ color: '#EEDB7C' }}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onDelete} sx={{ color: '#ff6b6b' }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}

// ================================================

const BarberoDashboard: NextPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const qc = useQueryClient()

  const { data: me } = useMiPerfil()
  const barberName = useMemo(() => {
    const n = `${me?.perfil?.nombres ?? ''} ${me?.perfil?.apellidos ?? ''}`.trim()
    return n || ''
  }, [me])

  const {
    data: reservasHoy = [],
    isLoading: loadingReservas,
  } = useQuery<ReservaHoy[], Error>({
    queryKey: ['reservasHoy'],
    queryFn: async () => {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/api/barbero/reservas/hoy', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error cargando reservas')
      return res.json()
    },
  })

  const {
    data: servicios = [],
    isLoading: loadingServicios,
  } = useQuery<Servicio[], Error>({
    queryKey: ['serviciosBarbero'],
    queryFn: async () => {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/api/barbero/servicios', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error cargando servicios')
      return res.json()
    },
  })

  const { data: metrics } = useQuery<MetricsResp, Error>({
    queryKey: ['barberMetrics'],
    queryFn: async () => {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/api/barbero/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return {}
      return res.json()
    },
  })

  const reservasPreview = reservasHoy.slice(0, 3)
  const serviciosPreview = [...servicios].slice(0, 3)

  const ingresosMes = metrics?.ingresosMes ?? 0
  const ocupacion = metrics?.ocupacion ?? 0

  const [svcModal, setSvcModal] = useState<SvcModalState>({ open: false, mode: 'create' })
  const openCreate = () => setSvcModal({ open: true, mode: 'create' })
  const openEdit = (svc: Servicio) => setSvcModal({ open: true, mode: 'edit', svc })
  const closeModal = () => setSvcModal((s) => ({ ...s, open: false }))

  const afterSave = () => {
    qc.invalidateQueries({ queryKey: ['serviciosBarbero'] })
  }

  const eliminarServicio = async (id: number) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/barbero/servicios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      qc.invalidateQueries({ queryKey: ['serviciosBarbero'] })
    } catch {
      alert('No se pudo eliminar')
    }
  }

  const actualizarEstado = async (id: number, nuevo: Estado) => {
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch(`/api/barbero/reservas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevo }),
      })
      if (!res.ok) throw new Error()
      qc.invalidateQueries({ queryKey: ['reservasHoy'] })
    } catch {
      alert('No se pudo actualizar la reserva')
    }
  }

  return (
    <DashboardLayout>
      <Container sx={{ pt: 4, pb: 10 }}>
        {barberName && (
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: '#FFF' }}>
            ¡Bienvenido, {barberName}!
          </Typography>
        )}

        {/* Reservas para hoy */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ color: '#FFF', mb: 1 }}>
            Reservas para Hoy ({reservasHoy.length})
          </Typography>

          {loadingReservas ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : reservasPreview.length ? (
            <List sx={{ bgcolor: '#111', borderRadius: 2, border: `1px solid ${theme.palette.primary.main}30` }}>
              {reservasPreview.map((r) => {
                const nombre = (r.clienteNombre ?? '').toString().trim()
                const inicial = (nombre ? nombre[0] : 'C').toUpperCase()
                return (
                  <ListItem key={r.id} divider sx={{ borderColor: '#222' }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {inicial}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography sx={{ color: '#FFF' }}>{nombre || 'Cliente'}</Typography>
                          <Chip size="small" label={estadoLabel[r.estado]} sx={{ bgcolor: '#262626', color: '#ddd' }} />
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ color: '#aaa' }}>
                          {r.servicioNombre} · {r.hora}
                        </Typography>
                      }
                    />
                    {r.estado === 'PENDING' && (
                      <ListItemSecondaryAction>
                        <IconButton aria-label="aceptar" onClick={() => actualizarEstado(r.id, 'CONFIRMED')}>
                          <CheckIcon sx={{ color: 'lightgreen' }} />
                        </IconButton>
                        <IconButton aria-label="rechazar" onClick={() => actualizarEstado(r.id, 'CANCELLED')}>
                          <CloseIcon sx={{ color: '#ff6b6b' }} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                )
              })}
            </List>
          ) : (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.primary.main}30`,
                bgcolor: '#111',
                color: '#bbb',
              }}
            >
              No tienes reservas para hoy.
            </Box>
          )}

          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              onClick={() => router.push('/dashboard/barbero/reservas')}
              sx={{ textTransform: 'none', color: '#EEDB7C' }}
            >
              Ver reservas →
            </Button>
          </Box>
        </Box>

        {/* Mis servicios */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ color: '#FFF' }}>
              Mis Servicios
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={openCreate}
              sx={{
                textTransform: 'none',
                color: '#111',
                bgcolor: '#EEDB7C',
                '&:hover': { bgcolor: '#e5cf72' },
                borderRadius: 2,
                px: 1.5,
              }}
            >
              Agregar
            </Button>
          </Box>

          {loadingServicios ? (
            <CircularProgress color="inherit" />
          ) : serviciosPreview.length ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {serviciosPreview.map((s) => (
                <ServiceCard
                  key={s.id}
                  svc={s}
                  onEdit={() => openEdit(s)}
                  onDelete={() => eliminarServicio(s.id)}
                />
              ))}
            </Box>
          ) : (
            <Typography sx={{ color: '#aaa' }}>No tienes servicios definidos.</Typography>
          )}

          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              onClick={() => router.push('/dashboard/barbero/mi-perfil#servicios')}
              sx={{ textTransform: 'none', color: '#EEDB7C' }}
            >
              Ver todos →
            </Button>
          </Box>
        </Box>

        {/* Estadísticas */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#FFF', mb: 1 }}>
            Estadísticas
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(180deg, #1f1f1f 0%, #151515 100%)',
                border: `1px solid ${theme.palette.primary.main}40`,
                boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                minHeight: 104,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: '#bbb', mb: 0.5, fontWeight: 600, textAlign: 'center' }}>
                Reservas Hoy
              </Typography>
              <Typography sx={{ color: '#FFF', fontWeight: 900, fontSize: 28, textAlign: 'center' }}>
                {reservasHoy.length}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(180deg, #1f1f1f 0%, #151515 100%)',
                border: `1px solid ${theme.palette.primary.main}40`,
                boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                minHeight: 104,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: '#bbb', mb: 0.5, fontWeight: 600, textAlign: 'center' }}>
                Ingresos del mes
              </Typography>
              <Typography sx={{ color: '#FFF', fontWeight: 900, fontSize: 28, textAlign: 'center' }}>
                ${fmtCLP(ingresosMes)}
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(180deg, #1f1f1f 0%, #151515 100%)',
                border: `1px solid ${theme.palette.primary.main}40`,
                boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                minHeight: 104,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: '#bbb', mb: 0.5, fontWeight: 600, textAlign: 'center' }}>
                Ocupación
              </Typography>
              <Typography sx={{ color: '#FFF', fontWeight: 900, fontSize: 28, textAlign: 'center' }}>
                {ocupacion}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>

      <ServiceModal
        open={svcModal.open}
        mode={svcModal.mode}
        initial={svcModal.svc}
        onClose={closeModal}
        onSaved={afterSave}
      />
    </DashboardLayout>
  )
}

export default BarberoDashboard
