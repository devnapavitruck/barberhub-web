import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Box,
  Typography,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  useTheme,
  IconButton,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'

type Perfil = {
  nombres: string
  apellidos: string
  ciudad: string
}

type Servicio = {
  id: number
  nombre: string
  precio: number
  duracion: number
}

const DURACIONES = [30, 60, 90] as const

function formatMiles(n: string | number) {
  const s = String(n).replace(/\D/g, '')
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
function toNumberFromMiles(s: string) {
  const digits = s.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

export default function BarberMyProfilePage() {
  const theme = useTheme()
  const router = useRouter()

  const [cargandoPerfil, setCargandoPerfil] = useState(true)
  const [perfil, setPerfil] = useState<Perfil | null>(null)

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargandoServicios, setCargandoServicios] = useState(true)

  // Modal: crear servicio
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('') // opcional (hoy no se persiste en DB)
  const [duracion, setDuracion] = useState<number>(60)
  const [precioUI, setPrecioUI] = useState('') // formateado con miles
  const precioNumber = useMemo(() => toNumberFromMiles(precioUI), [precioUI])

  const nombreMax = 75
  const descMax = 120

  const nombreLen = nombre.length
  const descLen = descripcion.length

  const nombreError = nombreLen === 0 || nombreLen > nombreMax
  const precioError = precioNumber <= 0
  const formValido = !nombreError && !precioError

  // --------- Cargar perfil ---------
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = localStorage.getItem('token') ?? ''
        const res = await fetch('/api/barbero/perfil', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (!mounted) return
        if (res.ok) {
          setPerfil({
            nombres: data.nombres || '',
            apellidos: data.apellidos || '',
            ciudad: data.ciudad || '',
          })
        } else {
          setPerfil(null)
        }
      } catch {
        setPerfil(null)
      } finally {
        if (mounted) setCargandoPerfil(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // --------- Cargar servicios ---------
  const fetchServicios = async () => {
    try {
      setCargandoServicios(true)
      const token = localStorage.getItem('token') ?? ''
      const res = await fetch('/api/barbero/servicios', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setServicios(data)
    } finally {
      setCargandoServicios(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [])

  // --------- Guardar servicio ---------
  const handleGuardarServicio = async () => {
    if (!formValido) return
    try {
      const token = localStorage.getItem('token') ?? ''
      const res = await fetch('/api/barbero/servicios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          // descripcion: descripcion.trim(), // (no existe en tu schema, se ignora en API)
          precio: precioNumber,
          duracion,
        }),
      })
      if (!res.ok) throw new Error()
      // refrescar lista
      await fetchServicios()
      // limpiar y cerrar
      setNombre('')
      setDescripcion('')
      setDuracion(60)
      setPrecioUI('')
      setOpen(false)
    } catch {
      alert('Error al crear servicio.')
    }
  }

  // --------- UI ---------
  const nombreCompleto =
    (perfil?.nombres || 'Barbero') +
    (perfil?.apellidos ? ` ${perfil.apellidos}` : '')

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 640, mx: 'auto', pb: 10 }}>
        {/* Header / Identidad */}
        <Box sx={{ textAlign: 'center', pt: 4, position: 'relative' }}>
          <IconButton
            aria-label="configurar"
            onClick={() => router.push('/dashboard/barbero/perfil')}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#fff' }}
          >
            <SettingsIcon />
          </IconButton>

          <Avatar
            sx={{
              width: 96,
              height: 96,
              mx: 'auto',
              mb: 1.5,
              bgcolor: theme.palette.primary.main,
              fontSize: 40,
            }}
          >
            {nombreCompleto.charAt(0)}
          </Avatar>

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {cargandoPerfil ? 'Cargando…' : nombreCompleto}
          </Typography>
          <Typography sx={{ color: '#bbb', mb: 3 }}>
            {perfil?.ciudad || 'Ciudad'}
          </Typography>

          <Button
            onClick={() => router.push('/dashboard/barbero/perfil')}
            size="small"
            sx={{
              color: theme.palette.primary.light,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Configurar cuenta
          </Button>
        </Box>

        {/* Horario */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid #222',
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Horario de atención
          </Typography>
          <Typography sx={{ color: '#9aa' }}>
            {/* El horario vendrá cuando lo configuren en /perfil */}
            Horario no configurado.
          </Typography>
        </Box>

        {/* Servicios */}
        <Box sx={{ mt: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Servicios
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setOpen(true)}
              sx={{
                color: '#fff',
                borderColor: theme.palette.primary.main,
                textTransform: 'none',
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
              }}
            >
              + Agregar
            </Button>
          </Box>

          {cargandoServicios ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress color="inherit" size={26} />
            </Box>
          ) : servicios.length === 0 ? (
            <Typography sx={{ color: '#9aa' }}>
              No hay servicios definidos.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {servicios.map((s) => (
                <Box
                  key={s.id}
                  sx={{
                    background: '#161616',
                    border: `1px solid ${theme.palette.primary.main}22`,
                    borderRadius: 2,
                    p: 1.5,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>{s.nombre}</Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                      mt: 0.5,
                      color: '#9aa',
                      fontSize: 14,
                    }}
                  >
                    <span>${formatMiles(s.precio)}</span>
                    <span>•</span>
                    <span>{s.duracion} min</span>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* MODAL: Agregar servicio */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Agregar servicio</DialogTitle>
        <DialogContent sx={{ pt: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nombre del servicio *"
            variant="outlined"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ maxLength: nombreMax }}
            helperText={`${nombreLen}/${nombreMax}`}
            error={nombreError}
            fullWidth
          />

          <TextField
            label="Descripción (opcional)"
            variant="outlined"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ maxLength: descMax }}
            helperText={`${descLen}/${descMax}`}
            multiline
            minRows={2}
            fullWidth
          />

          <TextField
            label="Precio *"
            variant="outlined"
            value={precioUI}
            onChange={(e) => setPrecioUI(formatMiles(e.target.value))}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <Box sx={{ mr: 1, color: '#888' }}>$</Box> as any,
              inputMode: 'numeric',
            }}
            helperText={precioError ? 'Ingresa un precio válido' : ' '}
            error={precioError}
            fullWidth
          />

          <TextField
            select
            label="Duración *"
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            InputLabelProps={{ shrink: true }}
            helperText="Selecciona la duración del servicio"
            fullWidth
          >
            {DURACIONES.map((d) => (
              <MenuItem key={d} value={d}>
                {d} min
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleGuardarServicio}
            disabled={!formValido}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  )
}


