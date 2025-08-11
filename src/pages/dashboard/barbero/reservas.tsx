// src/pages/dashboard/barbero/reservas.tsx
import * as React from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import DashboardLayout from '@/components/DashboardLayout'
import RefreshIcon from '@mui/icons-material/Refresh'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import PersonIcon from '@mui/icons-material/Person'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// ————————————————————————————————————————————————
// Estilo “glass” unificado
const glassCardSx = {
  bgcolor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
  borderRadius: 2,
}

// Tipos
type EstadoReserva = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
type Periodo = 'DAY' | 'WEEK' | 'MONTH' | 'ALL'
type ReservaItem = {
  id: number
  estado: EstadoReserva
  fecha: string            // ISO o YYYY-MM-DD
  hora: string             // HH:mm (si no existe, se deriva desde fecha)
  completadaAt?: string | null
  servicio: { id: number; nombre: string; duracion: number; precio: number }
  cliente?: { id: number | null; nombres: string; apellidos: string }
}

// Helpers
const CLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
const prettyDate = (isoOrYmd: string) =>
  new Date(isoOrYmd).toLocaleDateString('es-CL', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).replace('.', '')
const estadoToChip = (v: EstadoReserva) => {
  const map: Record<EstadoReserva, { label: string; color: 'warning' | 'success' | 'error' }> = {
    PENDING: { label: 'Pendiente', color: 'warning' },
    CONFIRMED: { label: 'Confirmada', color: 'success' },
    CANCELLED: { label: 'Cancelada', color: 'error' },
  }
  return map[v]
}
const ymd = (d: Date) => d.toISOString().slice(0, 10)
const parseHHMM = (hhmm?: string) => {
  const [h, m] = (hhmm || '').split(':').map((n) => Number(n))
  return (isFinite(h) ? h : 0) * 60 + (isFinite(m) ? m : 0)
}
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
const endOfToday   = () => { const d = new Date(); d.setHours(23,59,59,999); return d }
const startOfWeek = () => { const d = startOfToday(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d } // Lunes
const endOfWeek   = () => { const d = startOfWeek(); d.setDate(d.getDate() + 6); d.setHours(23,59,59,999); return d }
const startOfMonth = () => { const d = startOfToday(); d.setDate(1); return d }
const endOfMonth   = () => { const d = startOfMonth(); d.setMonth(d.getMonth()+1); d.setDate(0); d.setHours(23,59,59,999); return d }

// ————————————————————————————————————————————————
// API client (token desde localStorage)
function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return { Authorization: `Bearer ${token ?? ''}` }
}

async function getReservasBarbero(estado?: EstadoReserva): Promise<ReservaItem[]> {
  const qs = estado ? `?estado=${estado}` : ''
  const res = await fetch(`/api/barbero/reservas${qs}`, { headers: authHeaders() })
  if (res.status === 400 || res.status === 404) return []
  if (!res.ok) throw new Error('No se pudieron cargar las reservas')
  const json = await res.json()
  return (json.items ?? []) as ReservaItem[]
}

async function patchReservaEstado(id: number, estado: EstadoReserva): Promise<void> {
  const res = await fetch(`/api/barbero/reservas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ estado }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j?.error || 'No se pudo actualizar la reserva')
  }
}

// ————————————————————————————————————————————————
// Página
export default function ReservasBarberoPage() {
  const qc = useQueryClient()

  // Filtros
  const [tab, setTab] = React.useState<'ALL' | EstadoReserva>('ALL')
  const [periodo, setPeriodo] = React.useState<Periodo>('ALL')

  // Paginación suave (10 en 10)
  const [visible, setVisible] = React.useState(10)
  React.useEffect(() => { setVisible(10) }, [tab, periodo]) // reset al cambiar filtros

  // Snackbar / confirm
  const [snack, setSnack] = React.useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false, msg: '', sev: 'success',
  })
  const [confirm, setConfirm] = React.useState<{ open: boolean; id: number | null; next: EstadoReserva | null }>({
    open: false, id: null, next: null,
  })

  // Data
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['reservas', 'barbero', tab],
    queryFn: () => (tab === 'ALL' ? getReservasBarbero() : getReservasBarbero(tab)),
    staleTime: 60_000,
  })

  const mutation = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoReserva }) => patchReservaEstado(id, estado),
    onSuccess: async () => {
      setSnack({ open: true, msg: 'Reserva actualizada', sev: 'success' })
      await qc.invalidateQueries({ queryKey: ['reservas', 'barbero'] })
    },
    onError: (e: any) => setSnack({ open: true, msg: e?.message || 'Error al actualizar', sev: 'error' }),
  })

  // Filtrado por período + ordenación + paginación
  const prepared = React.useMemo(() => {
    const items = (data ?? []).filter((r) => {
      if (periodo === 'ALL') return true
      const d = new Date(r.fecha)
      if (periodo === 'DAY')   return d >= startOfToday() && d <= endOfToday()
      if (periodo === 'WEEK')  return d >= startOfWeek()  && d <= endOfWeek()
      if (periodo === 'MONTH') return d >= startOfMonth() && d <= endOfMonth()
      return true
    })

    // Ordena por fecha y hora asc
    items.sort((a, b) => {
      const da = new Date(a.fecha).getTime()
      const db = new Date(b.fecha).getTime()
      if (da !== db) return da - db
      return parseHHMM(a.hora) - parseHHMM(b.hora)
    })

    // Paginación suave: 10,20,30...
    const total = items.length
    const limited = items.slice(0, visible)

    // Reagrupar por fecha
    const groups = limited.reduce<Record<string, ReservaItem[]>>((acc, r) => {
      const key = r.fecha.slice(0, 10)
      ;(acc[key] ||= []).push(r)
      return acc
    }, {})
    const orderedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b))

    return { groups, orderedKeys, total }
  }, [data, periodo, visible])

  const ask = (id: number, next: EstadoReserva) => setConfirm({ open: true, id, next })
  const doConfirm = () => {
    if (confirm.id && confirm.next) mutation.mutate({ id: confirm.id, estado: confirm.next })
    setConfirm({ open: false, id: null, next: null })
  }

  return (
    <DashboardLayout title="Reservas" role="BARBERO">
      <Container sx={{ py: 2 }}>
        {/* Encabezado */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Reservas
          </Typography>
          <IconButton onClick={() => refetch()} aria-label="Refrescar" disabled={isFetching}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Filtros: Estado + Período */}
        <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap">
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 42,
              '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontWeight: 700 },
            }}
          >
            <Tab value="ALL" label="Todas" />
            <Tab value="PENDING" label="Pendientes" />
            <Tab value="CONFIRMED" label="Confirmadas" />
            <Tab value="CANCELLED" label="Canceladas" />
          </Tabs>

          <Box flex={1} />

          <ToggleButtonGroup
            exclusive
            size="small"
            value={periodo}
            onChange={(_, v) => v && setPeriodo(v)}
          >
            <ToggleButton value="DAY">Hoy</ToggleButton>
            <ToggleButton value="WEEK">Semana</ToggleButton>
            <ToggleButton value="MONTH">Mes</ToggleButton>
            <ToggleButton value="ALL">Todo</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Loading / error */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        )}
        {!isLoading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(error as any)?.message || 'No se pudieron cargar las reservas.'}
          </Alert>
        )}

        {/* Listado agrupado por fecha */}
        {!isLoading && !error && (
          <Stack spacing={2}>
            {prepared.orderedKeys.length === 0 ? (
              <Card sx={{ ...glassCardSx, p: 2 }}>
                <CardContent>
                  <Typography sx={{ opacity: 0.9 }}>
                    No hay reservas para los filtros seleccionados.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              prepared.orderedKeys.map((day) => (
                <Box key={day}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CalendarMonthIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
                      {prettyDate(day)}
                    </Typography>
                  </Box>

                  <Stack spacing={1.2}>
                    {prepared.groups[day].map((r) => {
                      const chip = estadoToChip(r.estado)
                      return (
                        <Card key={r.id} sx={glassCardSx}>
                          <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {r.servicio.nombre}
                              </Typography>
                              <Chip size="small" color={chip.color} label={chip.label} />
                            </Box>

                            <Stack direction="row" spacing={2} alignItems="center" sx={{ opacity: 0.95, mb: 1 }}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <AccessTimeIcon fontSize="small" />
                                <Typography variant="body2">{r.hora} • {r.servicio.duracion} min</Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <MonetizationOnIcon fontSize="small" />
                                <Typography variant="body2">{CLP.format(r.servicio.precio)}</Typography>
                              </Box>
                            </Stack>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1 }} />

                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <Box display="flex" alignItems="center" gap={1.2} sx={{ opacity: 0.95 }}>
                                <PersonIcon fontSize="small" />
                                <Typography variant="body2">
                                  {r.cliente?.nombres} {r.cliente?.apellidos}
                                </Typography>
                              </Box>

                              {/* Acciones */}
                              <Stack direction="row" spacing={1}>
                                {r.estado === 'PENDING' && (
                                  <>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      startIcon={<CheckCircleOutlineIcon />}
                                      onClick={() => setConfirm({ open: true, id: r.id, next: 'CONFIRMED' })}
                                    >
                                      Aceptar
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="error"
                                      startIcon={<CancelOutlinedIcon />}
                                      onClick={() => setConfirm({ open: true, id: r.id, next: 'CANCELLED' })}
                                    >
                                      Rechazar
                                    </Button>
                                  </>
                                )}

                                {r.estado === 'CONFIRMED' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelOutlinedIcon />}
                                    onClick={() => setConfirm({ open: true, id: r.id, next: 'CANCELLED' })}
                                  >
                                    Cancelar
                                  </Button>
                                )}

                                {r.estado === 'CANCELLED' && (
                                  <Button size="small" variant="outlined" disabled>
                                    Sin acciones
                                  </Button>
                                )}
                              </Stack>
                            </Box>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </Stack>
                </Box>
              ))
            )}

            {/* Ver más */}
            {prepared.total > visible && (
              <Box display="flex" justifyContent="center" mt={1}>
                <Button
                  variant="outlined"
                  onClick={() => setVisible((v) => Math.min(v + 10, prepared.total))}
                >
                  Ver más
                </Button>
              </Box>
            )}
          </Stack>
        )}

        {/* Diálogo confirmar */}
        <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null, next: null })}>
          <DialogTitle>Confirmar acción</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Typography>
              ¿Seguro que deseas {confirm.next === 'CONFIRMED' ? 'aceptar' : 'cancelar'} esta reserva?
            </Typography>
          </DialogContent>
        <DialogActions>
            <Button onClick={() => setConfirm({ open: false, id: null, next: null })}>Volver</Button>
            <Button
              variant="contained"
              color={confirm.next === 'CONFIRMED' ? 'success' : 'error'}
              onClick={() => {
                if (confirm.id && confirm.next) {
                  mutation.mutate({ id: confirm.id, estado: confirm.next })
                }
                setConfirm({ open: false, id: null, next: null })
              }}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Guardando…' : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.sev} sx={{ width: '100%' }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </DashboardLayout>
  )
}
