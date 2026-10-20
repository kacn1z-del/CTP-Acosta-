import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { escucharSesion, iniciarSesion, cerrarSesion } from "./lib/auth";
import { obtenerPerfil, obtenerPreregistro } from "./lib/datos";
import { activarPreregistro } from "./lib/admin";
import type { Usuario } from "./types";
import Inicio from "./pantallas/Inicio";
import Administracion from "./pantallas/Administracion";
import "./estilos.css";

// Si la persona no tiene perfil pero fue preregistrada, se crea su perfil ahora.
async function cargarPerfil(user: User): Promise<Usuario | null> {
  let perfil = await obtenerPerfil(user.uid);
  if (!perfil) {
    const pre = await obtenerPreregistro(user.email ?? "");
    if (pre) {
      await activarPreregistro(user, pre);
      perfil = await obtenerPerfil(user.uid);
    }
  }
  return perfil;
}

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
        setPerfil(user ? await cargarPerfil(user) : null);
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

  if (perfil.rol === "administrativo") {
    return <Administracion onSalir={cerrarSesion} />;
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
        <p className="vacio">El panel de profesores está en construcción.</p>
      </section>
    </div>
  );
}
