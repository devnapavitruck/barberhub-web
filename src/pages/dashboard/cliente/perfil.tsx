// src/pages/dashboard/cliente/perfil.tsx

import React, { useEffect, useState } from 'react'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Box,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  useTheme,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import useClientePerfil, { ClientePerfil } from '@/hooks/useClientePerfil'

type PerfilForm = Pick<ClientePerfil, 'nombres' | 'apellidos' | 'telefono' | 'ciudad'>

interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

const ClientePerfilPage: NextPage = () => {
  const router = useRouter()
  const theme = useTheme()
  const queryClient = useQueryClient()

  // Carga inicial de datos
  const { data: perfil, isLoading: loadingPerfil } = useClientePerfil()

  // Estado local del formulario (sin usuarioId)
  const [form, setForm] = useState<PerfilForm>({
    nombres: '',
    apellidos: '',
    telefono: '',
    ciudad: '',
  })

  // Control de modales
  const [editOpen, setEditOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Cuando llega el perfil, rellenamos el form
  useEffect(() => {
    if (perfil) {
      setForm({
        nombres: perfil.nombres,
        apellidos: perfil.apellidos,
        telefono: perfil.telefono,
        ciudad: perfil.ciudad,
      })
    }
  }, [perfil])

  // Mutación para guardar perfil
  const { mutate: saveProfile, status: saveStatus } = useMutation({
    mutationFn: async (datos: PerfilForm) => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/cliente/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      })
      if (!res.ok) throw new Error('Error guardando perfil')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientePerfil'] })
      setEditOpen(false)
    },
  })

  // Mutación para cambiar contraseña
  const { mutate: changePassword, status: pwdStatus } = useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/cliente/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Error cambiando contraseña')
    },
    onSuccess: () => {
      alert('✅ Contraseña actualizada')
      setPwdOpen(false)
    },
  })

  // Loading inicial
  if (loadingPerfil) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Avatar y datos estilo Instagram */}
      <Box sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
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
          {perfil?.nombres.charAt(0)}
        </Avatar>
        <Typography variant="h5" sx={{ color: '#FFF', fontWeight: 700 }}>
          {perfil?.nombres} {perfil?.apellidos}
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          {perfil?.ciudad}
        </Typography>
        <IconButton onClick={() => setEditOpen(true)} sx={{ color: '#FFF', mt: 1 }}>
          <EditIcon />
        </IconButton>
      </Box>

      {/* Modal: Editar Perfil */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth>
        <DialogTitle>Editar Perfil</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nombres"
            fullWidth
            variant="filled"
            value={form.nombres}
            onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value }))}
          />
          <TextField
            label="Apellidos"
            fullWidth
            variant="filled"
            value={form.apellidos}
            onChange={(e) => setForm((p) => ({ ...p, apellidos: e.target.value }))}
          />
          <TextField
            label="Teléfono"
            fullWidth
            variant="filled"
            value={form.telefono}
            onChange={(e) =>
              setForm((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, '') }))
            }
            inputProps={{ inputMode: 'numeric', maxLength: 9 }}
          />
          <TextField
            label="Ciudad"
            fullWidth
            variant="filled"
            value={form.ciudad}
            onChange={(e) => setForm((p) => ({ ...p, ciudad: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => saveProfile(form)}
            disabled={saveStatus === 'pending'}
          >
            {saveStatus === 'pending' ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Cambiar Contraseña */}
      <Dialog open={pwdOpen} onClose={() => setPwdOpen(false)}>
        <DialogTitle>Cambiar Contraseña</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Contraseña Actual"
            type="password"
            variant="outlined"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            label="Nueva Contraseña"
            type="password"
            variant="outlined"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPwdOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => changePassword({ currentPassword, newPassword })}
            disabled={pwdStatus === 'pending'}
          >
            {pwdStatus === 'pending' ? 'Cambiando…' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  )
}

export default ClientePerfilPage
