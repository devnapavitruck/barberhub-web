// Página temporal sin base de datos.
// Muestra el ID y evita que el build falle en Vercel.

import { useRouter } from "next/router";

export default function PerfilBarberoTemporal() {
  const { query } = useRouter();
  const id = Array.isArray(query.id) ? query.id[0] : query.id;

  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Perfil del Barbero</h1>
      <p style={{ opacity: 0.8 }}>ID: {id}</p>
      <p style={{ marginTop: 16 }}>
        Estamos preparando esta página. Vuelve pronto.
      </p>
    </main>
  );
}
