import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { escucharSesion, iniciarSesion, cerrarSesion } from "./lib/auth";
import type { Usuario } from "./types";

export default function App() {
  const [usuarioAuth, setUsuarioAuth] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const quitar = escucharSesion(async (user) => {
      setUsuarioAuth(user);
      if (user) {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        setPerfil(snap.exists() ? (snap.data() as Usuario) : null);
      } else {
        setPerfil(null);
      }
      setCargando(false);
    });
    return quitar;
  }, []);

  async function entrar() {
    setError(null);
    try {
      await iniciarSesion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    }
  }

  if (cargando) return <p style={{ padding: 24 }}>Cargando...</p>;

  if (!usuarioAuth) {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <h1>Campus CTP Acosta</h1>
        <p>Ingresa con tu correo institucional.</p>
        <button onClick={entrar}>Iniciar sesión</button>
        {error && <p style={{ color: "crimson" }}>{error}</p>}
      </main>
    );
  }

  if (!perfil) {
    return (
      <main style={{ padding: 24 }}>
        <p>Tu cuenta aún no tiene un rol asignado. Consulta con administración.</p>
        <button onClick={cerrarSesion}>Salir</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Hola, {perfil.nombre}</h1>
      <p>Rol: {perfil.rol}</p>
      <button onClick={cerrarSesion}>Salir</button>
    </main>
  );
}
