// pages/login.tsx
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Link
} from '@mui/material'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  // Validaciones simples
  useEffect(() => {
    setErrors({
      email: form.email && !form.email.includes('@') ? 'Email inválido' : '',
      password:
        form.password && form.password.length < 8
          ? 'La contraseña debe tener al menos 8 caracteres'
          : ''
    })
  }, [form.email, form.password])

  const isValid =
    !!form.email &&
    !!form.password &&
    !errors.email &&
    !errors.password

  const handleSubmit = async () => {
    if (!isValid) return
    setLoading(true)
    setServerError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || 'Error en el servidor')
      } else {
        // ====== PARCHE MÍNIMO: persistir estado para nav/guards ======
        localStorage.setItem('token', data.token)

        const rol = data?.user?.rol as 'CLIENTE' | 'BARBERO'
        const userId =
          // intenta con varias posibles llaves por si tu API varía
          data?.user?.id ??
          data?.user?.usuarioId ??
          data?.id

        if (rol) localStorage.setItem('barberHub:rol', rol)
        if (userId != null) localStorage.setItem('barberHub:userId', String(userId))
        // ============================================================

        // Redirigir según rol
        if (rol === 'BARBERO') {
          router.push('/dashboard/barbero')
        } else {
          router.push('/dashboard/cliente')
        }
      }
    } catch (err) {
      setServerError('Error de red, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = () => {
    // redirigir a página de recuperación
    router.push('/forgot-password')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#000', color: '#FFF', pb: 8 }}>
      {/* Header Instagram-style */}
      <Box
        sx={{
          py: 2,
          background: 'linear-gradient(45deg, #f09433, #bc1888)',
          textAlign: 'center'
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
            Iniciar Sesión
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              error={!!errors.email}
              helperText={errors.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              error={!!errors.password}
              helperText={errors.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              fullWidth
            />
            <Box textAlign="right">
              <Link
                component="button"
                variant="body2"
                onClick={handleForgot}
                sx={{ color: '#90caf9' }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>
            <Button
              variant="contained"
              disabled={!isValid || loading}
              onClick={handleSubmit}
              fullWidth
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Entrar'
              )}
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
        <Alert severity="error" onClose={() => setServerError('')}>
          {serverError}
        </Alert>
      </Snackbar>
    </Box>
  )
}
