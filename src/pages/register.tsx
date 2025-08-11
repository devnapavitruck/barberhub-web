// pages/register.tsx

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  InputAdornment,
  FormControl,
  InputLabel,
} from '@mui/material'
import { motion } from 'framer-motion'

type Role = 'CLIENTE' | 'BARBERO'

// Validaciones
const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/
const phoneRegex    = /^\d{9}$/

interface Region { codigo: string; nombre: string }
interface FormData {
  rol: Role
  nombres: string
  apellidos: string
  telefono: string
  email: string
  region: string   // código de región
  ciudad: string
  nacimiento: string
  password: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { rol } = router.query as { rol?: Role }

  // Validar rol
  useEffect(() => {
    if (!rol || (rol !== 'CLIENTE' && rol !== 'BARBERO')) router.replace('/')
  }, [rol, router])
  const fixedRol: Role = rol === 'BARBERO' ? 'BARBERO' : 'CLIENTE'

  const [form, setForm] = useState<FormData>({
    rol: fixedRol,
    nombres: '',
    apellidos: '',
    telefono: '',
    email: '',
    region: '',
    ciudad: '',
    nacimiento: '',
    password: '',
  })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [regiones, setRegiones] = useState<Region[]>([])

  // Carga regiones
  useEffect(() => {
    fetch('/api/chile/regiones')
      .then(res => res.json())
      .then((data: Region[]) => setRegiones(data))
      .catch(() => setRegiones([]))
  }, [])

  // Validar email y password
  useEffect(() => {
    setErrors({
      email: form.email && !emailRegex.test(form.email) ? 'Email inválido' : '',
      password:
        form.password && !passwordRegex.test(form.password)
          ? 'Contraseña: mínimo 8 caracteres, mayúscula, minúscula y número'
          : '',
    })
  }, [form.email, form.password])

  // Check valididad
  const isValid =
    !!form.nombres &&
    !!form.apellidos &&
    phoneRegex.test(form.telefono) &&
    form.email && !errors.email &&
    form.region &&
    form.ciudad &&
    form.nacimiento &&
    form.password && !errors.password

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    setServerError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || 'Error en el servidor')
      } else {
        router.push('/login')
      }
    } catch {
      setServerError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#FFF', pb: 8 }}>
      {/* Header Instagram-style */}
      <Box
        sx={{
          py: 2,
          background: 'linear-gradient(45deg, #f09433, #bc1888)',
          textAlign: 'center',
        }}
      >
        <Box
          component="img"
          src="/images/logo-transparente.png"
          alt="BarberHub"
          sx={{ height: 40, mx: 'auto' }}
        />
      </Box>

      <Container maxWidth="xs" sx={{ mt: 4 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Registro como {fixedRol === 'CLIENTE' ? 'Cliente' : 'Barbero'}
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Nombres"
              value={form.nombres}
              onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Apellidos"
              value={form.apellidos}
              onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Teléfono"
              value={form.telefono}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0,9)
                setForm(f => ({ ...f, telefono: val }))
              }}
              InputProps={{ startAdornment: <InputAdornment position="start">+56</InputAdornment> }}
              helperText={form.telefono.length === 9 ? '' : 'Debe tener 9 dígitos'}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Región</InputLabel>
              <Select
                value={form.region}
                label="Región"
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
              >
                {regiones.map(r => (
                  <MenuItem key={r.codigo} value={r.codigo}>
                    {r.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Ciudad"
              value={form.ciudad}
              onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Fecha de nacimiento"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.nacimiento}
              onChange={e => setForm(f => ({ ...f, nacimiento: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Email"
              type="email"
              value={form.email}
              error={!!errors.email}
              helperText={errors.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Contraseña (la usarás para iniciar sesión)"
              type="password"
              value={form.password}
              error={!!errors.password}
              helperText={errors.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              fullWidth
            />
            <Button
              variant="contained"
              disabled={!isValid || loading}
              onClick={handleSubmit}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrarme'}
            </Button>
          </Box>
        </motion.div>
      </Container>

      <Snackbar
        open={!!serverError}
        autoHideDuration={6000}
        onClose={() => setServerError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setServerError('')}> {serverError} </Alert>
      </Snackbar>
    </Box>
  )
}