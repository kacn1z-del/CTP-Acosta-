import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./lib/firebase";
import { escucharSesion, iniciarSesion, cerrarSesion } from "./lib/auth";
import { obtenerPerfil } from "./lib/datos";
import type { Usuario } from "./types";
import Inicio from "./pantallas/Inicio";
import "./estilos.css";

export default function App() {
  const [usuarioAuth, setUsuarioAuth] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const quitar = escucharSesion(async (user) => {
      setUsuarioAuth(user);
      try {
        setPerfil(user ? await obtenerPerfil(user.uid) : null);
      } catch (e) {
        console.error(e);
        setPerfil(null);
        setError(`No se pudo cargar tu perfil: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setCargando(false);
      }
    });
    return quitar;
  }, []);

  async function entrar() {
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  // TEMPORAL: crea el perfil desde la app. Quitar después de usarlo.
  async function crearPerfilTemporal(user: User) {
    setError(null);
    try {
      await setDoc(doc(db, "usuarios", user.uid), {
        nombre: user.displayName ?? "Usuario",
        correo: user.email ?? "",
        rol: "administrativo",
      });
      setPerfil(await obtenerPerfil(user.uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (cargando) {
    return (
      <div className="pagina centrado">
        <p className="vacio">Cargando...</p>
      </div>
    );
  }

  if (!usuarioAuth) {
    return (
      <div className="pagina centrado">
        <h1>Campus CTP Acosta</h1>
        <p className="vacio">Ingresa con tu correo institucional.</p>
        <button className="boton" onClick={entrar} disabled={enviando}>
          {enviando ? "Entrando..." : "Iniciar sesión"}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="pagina centrado">
        <p>Tu cuenta aún no tiene un rol asignado. Consulta con administración.</p>
        <p className="vacio" style={{ fontFamily: "monospace", wordBreak: "break-all" }}>
          UID: {usuarioAuth.uid}
        </p>
        <button className="boton" onClick={() => crearPerfilTemporal(usuarioAuth)}>
          Crear perfil temporal
        </button>
        {error && <p className="error">{error}</p>}
        <button className="boton secundario" onClick={cerrarSesion}>
          Salir
        </button>
      </div>
    );
  }

  if (perfil.rol === "estudiante") {
    return <Inicio perfil={perfil} onSalir={cerrarSesion} />;
  }

  return (
    <div className="pagina">
      <header className="encabezado">
        <div>
          <h1>Hola, {perfil.nombre}</h1>
          <p>Rol: {perfil.rol}</p>
        </div>
        <button className="boton secundario" onClick={cerrarSesion}>
          Salir
        </button>
      </header>
      <section className="tarjeta">
        <p className="vacio">
          El panel de {perfil.rol === "profesor" ? "profesores" : "administración"} está en construcción.
        </p>
      </section>
    </div>
  );
}
