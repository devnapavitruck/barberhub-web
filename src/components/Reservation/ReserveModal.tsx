// src/components/Reservation/ReserveModal.tsx
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Button, Select, MenuItem, FormControl, InputLabel,
  TextField, Snackbar, Alert, Chip
} from '@mui/material';
import { useRouter } from 'next/router';

type Servicio = { id: number; nombre: string; duracion: number; precio: number };

type Props = {
  open: boolean;
  onClose: () => void;
  barberoId: number;
  userId: number;                // id del usuario cliente (ya lo tienes en localStorage)
  servicios?: Servicio[];        // pásalos desde barbero/[id].tsx (SSR)
};

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function ReserveModal({ open, onClose, barberoId, userId, servicios }: Props) {
  const router = useRouter();
  const [svcId, setSvcId] = React.useState<number | ''>('');
  const [fecha, setFecha] = React.useState<string>(toISO(new Date()));
  const [loading, setLoading] = React.useState(false);
  const [slots, setSlots] = React.useState<string[]>([]);
  const [slotSel, setSlotSel] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<{open:boolean; msg:string; sev:'success'|'error'}>({
    open:false, msg:'', sev:'success'
  });

  const serviciosList = servicios ?? [];

  const fetchDisponibilidad = async () => {
    if (!svcId || !fecha) return;
    try {
      setLoading(true);
      const url = `/api/cliente/disponibilidad?barberoId=${barberoId}&servicioId=${svcId}&fecha=${fecha}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo cargar la disponibilidad');
      const data = await res.json(); // { slots: ["09:00","09:15",...], ... }
      // Filtramos a 30 min
      const only30 = (Array.isArray(data?.slots) ? data.slots : [])
        .filter((hhmm: string) => {
          const m = Number(hhmm.split(':')[1]);
          return m % 30 === 0;  // 00 y 30
        });
      setSlots(only30);
    } catch (e:any) {
      setSlots([]);
      setSnack({ open:true, msg: e?.message || 'No se pudo cargar la disponibilidad', sev:'error' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    setSlotSel(null);
    if (svcId) fetchDisponibilidad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svcId, fecha]);

  const onConfirm = async () => {
    if (!svcId || !slotSel) return;
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const res = await fetch('/api/cliente/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          barberoId,
          servicioId: svcId,
          fecha,          // YYYY-MM-DD
          hora: slotSel,  // HH:MM
          // userId se deriva del token en el server; enviamos como fallback dev:
          userId,
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'No se pudo crear la reserva');
      }

      setSnack({ open:true, msg:'Reserva enviada. Te avisaremos cuando el barbero confirme.', sev:'success' });

      // cerramos modal y redirigimos al Home Cliente (donde aparece Próxima Cita)
      setTimeout(() => {
        onClose();
        router.push('/dashboard/cliente'); // ajusta si tu "home" cliente es otra ruta
      }, 700);
    } catch (e:any) {
      setSnack({ open:true, msg: e?.message || 'Error al crear la reserva', sev:'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: '#2a2a2a',
          borderRadius: 3,
          border: '1px solid rgba(212,175,55,0.35)',
          boxShadow: '0 12px 32px rgba(0,0,0,.6)',
        }
      }}>
      <DialogTitle sx={{ color:'#fff', fontWeight: 800 }}>Reservar</DialogTitle>

      <DialogContent sx={{ display:'flex', flexDirection:'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ color:'#ddd' }}>Servicio</InputLabel>
          <Select
            label="Servicio"
            value={svcId}
            onChange={(e) => setSvcId(Number(e.target.value))}
            sx={{ color:'#fff' }}
          >
            {serviciosList.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          type="date"
          label="Fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ input: { color:'#fff' } }}
        />

        <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Box sx={{ color:'#aaa', fontSize: 14 }}>Horarios disponibles</Box>
          <Button onClick={fetchDisponibilidad} disabled={loading || !svcId} size="small">
            Actualizar
          </Button>
        </Box>

        <Box sx={{
          display:'grid',
          gridTemplateColumns:'repeat(4, minmax(0,1fr))',
          gap: 1
        }}>
          {slots.length === 0 && (
            <Box sx={{ color:'#9aa0a6', fontSize: 14 }}>
              {loading ? 'Cargando…' : 'No hay horarios libres para esta fecha.'}
            </Box>
          )}
          {slots.map(hhmm => (
            <Chip
              key={hhmm}
              label={hhmm}
              variant={slotSel === hhmm ? 'filled' : 'outlined'}
              onClick={() => setSlotSel(hhmm)}
              sx={{
                cursor: 'pointer',
                color: '#EEDB7C',
                borderColor: 'rgba(238,219,124,.4)',
                ...(slotSel === hhmm
                  ? { bgcolor:'rgba(238,219,124,.15)' }
                  : { bgcolor:'transparent' })
              }}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p:2 }}>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={!svcId || !slotSel || loading}
        >
          {loading ? 'Guardando…' : 'Confirmar reserva'}
        </Button>
      </DialogActions>

      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}
      >
        <Alert onClose={() => setSnack(s => ({ ...s, open:false }))} severity={snack.sev} sx={{ width:'100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
