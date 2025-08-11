// src/components/SearchBar.tsx
import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const regiones = [
  { id: 'XV', nombre: 'Arica y Parinacota' },
  { id: 'I',  nombre: 'Tarapacá' },
  { id: 'II', nombre: 'Antofagasta' },
  { id: 'III', nombre: 'Atacama' },
  { id: 'IV', nombre: 'Coquimbo' },
  { id: 'V',  nombre: 'Valparaíso' },
  { id: 'RM', nombre: 'Metropolitana' },
  { id: 'VI', nombre: 'O’Higgins' },
  { id: 'VII', nombre: 'Maule' },
  { id: 'XVI',nombre: 'Ñuble' },
  { id: 'VIII',nombre: 'Biobío' },
  { id: 'IX', nombre: 'La Araucanía' },
  { id: 'XIV',nombre: 'Los Ríos' },
  { id: 'X',  nombre: 'Los Lagos' },
  { id: 'XI', nombre: 'Aysén' },
  { id: 'XII',nombre: 'Magallanes y Antártica' },
];

const comunasPorRegion: Record<string,string[]> = {
  XV: ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  I:  ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Huara'],
  II: ['Antofagasta', 'Mejillones', 'Taltal', 'Sierra Gorda', 'Tocopilla'],
  III:['Copiapó', 'Caldera', 'Tierra Amarilla', 'Vallenar'],
  IV: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel'],
  V:  ['Valparaíso', 'Viña del Mar', 'Quilpué', 'Concón'],
  RM: ['Santiago', 'La Florida', 'Puente Alto', 'Maipú'],
  VI: ['Rancagua', 'Machalí', 'San Fernando', 'Pichilemu'],
  VII:['Talca', 'Curicó', 'Linares', 'San Javier'],
  XVI:['Chillán', 'San Carlos', 'Ñiquén', 'Quillón'],
  VIII:['Concepción', 'Talcahuano', 'Tome', 'Chiguayante'],
  IX: ['Temuco', 'Villarrica', 'Angol', 'Pucón'],
  XIV:['Valdivia', 'La Unión', 'Río Bueno', 'Lanco'],
  X: ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro'],
  XI:['Coihaique', 'Aysén', 'Chile Chico', 'Cisnes'],
  XII:['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Laguna Blanca'],
};

interface SearchBarProps {
  onSearch: (region: string, comuna: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const theme = useTheme();
  const [region, setRegion] = useState('');
  const [comuna, setComuna] = useState('');
  const [listaComunas, setListaComunas] = useState<string[]>([]);

  useEffect(() => {
    if (region) {
      setListaComunas(comunasPorRegion[region] || []);
      setComuna('');
    } else {
      setListaComunas([]);
      setComuna('');
    }
  }, [region]);

  useEffect(() => {
    if (region && comuna) {
      onSearch(region, comuna);
    }
  }, [region, comuna, onSearch]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 4,
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <FormControl sx={{ minWidth: 180 }} size="small">
        <InputLabel id="label-region" sx={{ color: '#FFF' }}>
          Región
        </InputLabel>
        <Select
          labelId="label-region"
          value={region}
          label="Región"
          onChange={(e) => setRegion(e.target.value)}
          sx={{
            backgroundColor: '#111',
            color: '#FFF',
            '.MuiSelect-icon': { color: theme.palette.primary.main },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {regiones.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.nombre}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 180 }} size="small" disabled={!region}>
        <InputLabel id="label-comuna" sx={{ color: '#FFF' }}>
          Comuna
        </InputLabel>
        <Select
          labelId="label-comuna"
          value={comuna}
          label="Comuna"
          onChange={(e) => setComuna(e.target.value)}
          sx={{
            backgroundColor: '#111',
            color: '#FFF',
            '.MuiSelect-icon': { color: theme.palette.primary.main },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
          }}
        >
          {listaComunas.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        disableElevation
        disabled={!region || !comuna}
        onClick={() => onSearch(region, comuna)}
        sx={{
          textTransform: 'none',
          bgcolor: theme.palette.primary.main,
          color: '#000',
          '&:hover': { bgcolor: theme.palette.primary.dark },
        }}
      >
        Buscar
      </Button>
    </Box>
  );
}
