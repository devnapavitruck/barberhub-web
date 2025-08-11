// src/pages/dashboard/barbero/horario.tsx
import * as React from 'react'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DashboardLayout from '@/components/DashboardLayout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useMiPerfil } from '@/hooks/useMiPerfil'

type Dia = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom'
type Row = { dia: Dia; activo: boolean; inicio: string | null; fin: string | null }

function buildTimes(from = '06:00', to = '22:00', stepMin = 30) {
  const [fh, fm] = from.split(':').map(Number)
  const [th, tm] = to.split(':').map(Number)
  let cur = fh * 60 + fm
  const end = th * 60 + tm
  const out: string[] = []
  while (cur <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    out.push(`${h}:${m}`)
    cur += stepMin
  }
  return out
}
const TIME_OPTIONS = buildTimes()
const DEFAULT_INICIO = '09:00'
const DEFAULT_FIN = '19:00'

const minutes = (hhmm: string | null | undefined) => {
  if (!hhmm) return NaN
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const authHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return { Authorization: `Bearer ${token ?? ''}` }
}

async function apiGet(): Promise<Row[]> {
  const res = await fetch('/api/barbero/horarios', { headers: authHeaders() })
  if (!res.ok) throw new Error('No se pudo cargar el horario')
  const json = await res.json()
  const items = (json.items ?? []) as any[]
  return items.map((r) => ({
    dia: r.dia as Dia,
    activo: Boolean(r.inicio && r.fin),
    inicio: r.inicio ?? null,
    fin: r.fin ?? null,
  }))
}

async function apiPatch(items: Row[]): Promise<void> {
  const res = await fetch('/api/barbero/horarios', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ items }),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j?.error || 'No se pudo guardar el horario')
  }
}

export default function HorarioBarberoPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { data: me } = useMiPerfil()
  const perfilId = me?.perfil?.id

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['barbero', 'horarios'],
    queryFn: apiGet,
    staleTime: 60_000,
  })

  const [rows, setRows] = React.useState<Row[] | null>(null)
  const [snack, setSnack] = React.useState<{open:boolean; msg:string; sev:'success'|'error'}>({
    open:false, msg:'', sev:'success'
  })

  React.useEffect(() => { if (data) setRows(data) }, [data])

  const mutation = useMutation({
    mutationFn: (items: Row[]) => apiPatch(items),
    onSuccess: async () => {
      setSnack({ open:true, msg:'Horario guardado. Redirigiendo…', sev:'success' })
      await qc.invalidateQueries({ queryKey: ['barbero','horarios'] })

      // Redirección robusta a /barbero/[id]:
      const localUserId =
        typeof window !== 'undefined'
          ? Number(localStorage.getItem('barberHub:userId') || '0')
          : 0
      const targetId = perfilId ?? (localUserId || null)

      if (targetId) {
        router.replace(`/barbero/${targetId}`)
      }
    },
    onError: (e:any) => setSnack({ open:true, msg: e?.message || 'Error al guardar', sev:'error' }),
  })

  const setRow = (idx: number, patch: Partial<Row>) =>
    setRows(prev => {
      if (!prev) return prev
      const copy = [...prev]
      copy[idx] = { ...copy[idx], ...patch }
      return copy
    })

  const validateRow = (r: Row): string | null => {
    if (!r.activo) return null
    if (!r.inicio || !r.fin) return 'Debes definir inicio y fin'
    const i = minutes(r.inicio), f = minutes(r.fin)
    if (!Number.isFinite(i) || !Number.isFinite(f)) return 'Horas inválidas'
    if (i >= f) return 'El inicio debe ser menor al fin'
    return null
  }

  const hasErrors = React.useMemo(() => {
    if (!rows) return true
    return rows.some(r => validateRow(r) !== null)
  }, [rows])

  const isDirty = React.useMemo(() => {
    if (!rows || !data) return false
    return JSON.stringify(rows) !== JSON.stringify(data)
  }, [rows, data])

  const onSave = () => { if (rows) mutation.mutate(rows) }

  return (
    <DashboardLayout role="BARBERO">
      <Container sx={{ py: 2, pb: 10 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Horario de atención
          </Typography>
          <IconButton onClick={() => refetch()} disabled={isFetching} aria-label="refrescar" size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" sx={{ opacity: .9, mb: 1.5 }}>
          Activa un día y define tu horario de inicio y fin. ¡Listo!
        </Typography>

        {isLoading && (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={22} /></Box>
        )}
        {!isLoading && error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {(error as any)?.message || 'No se pudo cargar el horario.'}
          </Alert>
        )}

        {rows && (
          <Card sx={{
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 10px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.05)',
            borderRadius: 3,
          }}>
            <CardContent sx={{ p: 1 }}>
              {rows.map((r, idx) => {
                const disabled = !r.activo
                const err = validateRow(r)
                return (
                  <Box key={r.dia} sx={{ px: 1, py: 1 }}>
                    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb: .75 }}>
                      <Typography sx={{ fontWeight: 800 }}>{r.dia}</Typography>
                      <Switch
                        size="small"
                        checked={r.activo}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setRow(idx, {
                            activo: checked,
                            inicio: checked ? (r.inicio ?? DEFAULT_INICIO) : r.inicio,
                            fin: checked ? (r.fin ?? DEFAULT_FIN) : r.fin,
                          })
                        }}
                      />
                    </Box>

                    <Box sx={{ display:'flex', gap: 1, mb: err ? .25 : 0 }}>
                      <FormControl fullWidth size="small" disabled={disabled}>
                        <Select
                          value={r.inicio ?? ''}
                          displayEmpty
                          onChange={(e) => setRow(idx, { inicio: (e.target.value as string) || null })}
                        >
                          <MenuItem value=""><em>Inicio —</em></MenuItem>
                          {TIME_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small" disabled={disabled}>
                        <Select
                          value={r.fin ?? ''}
                          displayEmpty
                          onChange={(e) => setRow(idx, { fin: (e.target.value as string) || null })}
                        >
                          <MenuItem value=""><em>Fin —</em></MenuItem>
                          {TIME_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>

                    {err && (
                      <FormHelperText error sx={{ ml: .5, mt: .25 }}>{err}</FormHelperText>
                    )}
                    {idx < rows.length - 1 && (
                      <Divider sx={{ mt: 1.0, opacity: .12 }} />
                    )}
                  </Box>
                )
              })}
            </CardContent>
          </Card>
        )}

        <Box display="flex" gap={1} justifyContent="flex-end" mt={2}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => refetch()}
            disabled={isFetching || mutation.isPending}
          >
            Descartar
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={onSave}
            disabled={!rows || hasErrors || !isDirty || mutation.isPending}
          >
            {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </Box>

        <Snackbar
          open={snack.open}
          autoHideDuration={2200}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.sev} sx={{ width: '100%' }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Container>
    </DashboardLayout>
  )
}
