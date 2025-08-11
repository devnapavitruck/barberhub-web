// src/pages/dashboard/barbero/perfil.tsx
import React, { useEffect, useState } from 'react'
import {
  Box,
  Avatar,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DashboardLayout from '@/components/DashboardLayout'

type Perfil = {
  nombres: string
  apellidos: string
  telefono: string
  ciudad: string
  nombreBarberia: string
  descripcion: string
  experiencia: number
  avatarUrl?: string
}

export default function BarberoPerfilConfigPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [form, setForm] = useState<Perfil>({
    nombres: '',
    apellidos: '',
    telefono: '',
    ciudad: '',
    nombreBarberia: '',
    descripcion: '',
    experiencia: 0,
    avatarUrl: '',
  })
  const [toast, setToast] = useState<string>('')

  // ---------- cargar perfil ----------
  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem('token') || ''
        const res = await fetch('/api/barbero/perfil', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setPerfil(data)
        setForm({
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          telefono: data.telefono || '',
          ciudad: data.ciudad || '',
          nombreBarberia: data.nombreBarberia || '',
          descripcion: data.descripcion || '',
          experiencia: Number(data.experiencia || 0),
          avatarUrl: data.avatarUrl || '',
        })
      } catch {
        setToast('No se pudo cargar tu perfil.')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const refetch = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/api/barbero/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPerfil(data)
      setForm((prev) => ({ ...prev, ...data, experiencia: Number(data.experiencia || 0) }))
    } finally {
      setLoading(false)
    }
  }

  // ---------- guardar perfil ----------
  const onSave = async () => {
    if (!form.nombres || !form.apellidos || !form.telefono || !form.ciudad) {
      setToast('Completa nombres, apellidos, teléfono y ciudad.')
      return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem('token') || ''
      const res = await fetch('/api/barbero/perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          telefono: form.telefono.trim(),
          ciudad: form.ciudad.trim(),
          nombreBarberia: form.nombreBarberia.trim(),
          descripcion: form.descripcion.trim(),
          experiencia: Number(form.experiencia || 0),
        }),
      })
      if (!res.ok) throw new Error()
      await refetch()
      setOpenEdit(false)
      setToast('Cambios guardados ✅')
    } catch {
      setToast('Error al guardar. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  // ---------- UI ----------
  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="inherit" />
        </Box>
      </DashboardLayout>
    )
  }

  if (!perfil) {
    return (
      <DashboardLayout>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="error">No se pudo cargar tu perfil.</Typography>
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, pt: 2, pb: 10 }}>
        {/* Card principal */}
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 3,
            p: 3,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
            position: 'relative',
          }}
        >
          {/* Avatar (solo lectura) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={perfil.avatarUrl || undefined}
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#b3902e',
                fontSize: 40,
              }}
            >
              {(perfil.nombres || 'B').charAt(0)}
            </Avatar>

            <Typography variant="h6" sx={{ mt: 1, fontWeight: 700 }}>
              {perfil.nombres} {perfil.apellidos}
            </Typography>
            <Typography sx={{ color: '#aaa' }}>{perfil.ciudad}</Typography>
            <Typography sx={{ color: '#aaa' }}>+56 {perfil.telefono}</Typography>

            <Button
              startIcon={<EditIcon />}
              onClick={() => setOpenEdit(true)}
              sx={{
                mt: 1.5,
                borderRadius: 2,
                px: 2.5,
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                textTransform: 'none',
                '&:hover': { borderColor: '#fff' },
              }}
              variant="outlined"
            >
              Editar datos
            </Button>
          </Box>

          {/* Info barbería */}
          {(perfil.nombreBarberia || perfil.descripcion) && (
            <Box sx={{ mt: 3 }}>
              {perfil.nombreBarberia && (
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                  {perfil.nombreBarberia}
                </Typography>
              )}
              {perfil.descripcion && (
                <Typography sx={{ color: '#bbb', whiteSpace: 'pre-wrap' }}>
                  {perfil.descripcion}
                </Typography>
              )}
              {typeof perfil.experiencia === 'number' && (
                <Typography sx={{ color: '#bbb', mt: 1 }}>
                  Experiencia: {perfil.experiencia} año(s)
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* MODAL EDICIÓN */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="sm"
        keepMounted
      >
        <DialogTitle>Editar perfil</DialogTitle>
        <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nombres *"
            value={form.nombres}
            onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value.slice(0, 60) }))}
          />
          <TextField
            label="Apellidos *"
            value={form.apellidos}
            onChange={(e) => setForm((p) => ({ ...p, apellidos: e.target.value.slice(0, 60) }))}
          />
          <TextField
            label="Teléfono *"
            value={form.telefono}
            inputProps={{ inputMode: 'numeric', maxLength: 9 }}
            onChange={(e) =>
              setForm((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, '').slice(0, 9) }))
            }
          />
          <TextField
            label="Ciudad *"
            value={form.ciudad}
            onChange={(e) => setForm((p) => ({ ...p, ciudad: e.target.value.slice(0, 40) }))}
          />
          <TextField
            label="Nombre de tu barbería"
            value={form.nombreBarberia}
            onChange={(e) =>
              setForm((p) => ({ ...p, nombreBarberia: e.target.value.slice(0, 60) }))
            }
          />
          <TextField
            label="Descripción"
            multiline
            minRows={3}
            helperText={`${form.descripcion.length}/200`}
            value={form.descripcion}
            onChange={(e) =>
              setForm((p) => ({ ...p, descripcion: e.target.value.slice(0, 200) }))
            }
          />
          <TextField
            label="Años de experiencia"
            value={form.experiencia}
            inputProps={{ inputMode: 'numeric', maxLength: 2 }}
            onChange={(e) =>
              setForm((p) => ({ ...p, experiencia: Number(String(e.target.value).replace(/\D/g, '')) }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        onClose={() => setToast('')}
        autoHideDuration={2500}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </DashboardLayout>
  )
}
