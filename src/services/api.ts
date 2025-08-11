// src/services/api.ts
export interface Barbero {
  id: number;
  nombre: string;
  avgRating: number;
  servicios: { nombre: string; precio: number }[];
  avatarUrl?: string;
  region?: string;
  ciudad?: string;
}

export async function fetchBarberos(): Promise<Barbero[]> {
  const res = await fetch('/api/barberos');
  if (!res.ok) throw new Error('Error al cargar barberos');
  return res.json();
}
