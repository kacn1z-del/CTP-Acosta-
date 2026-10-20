import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
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
  const [diagnostico, setDiagnostico] = useState<string | null>(null);

  useEffect(() => {
    const quitar = escucharSesion(async (user) => {
      setUsuarioAuth(user);
      setDiagnostico(null);
      try {
        const p = user ? await obtenerPerfil(user.uid) : null;
        setPerfil(p);
        if (user && !p) {
          const snap = await getDocs(collection(db, "usuarios"));
          const ids = snap.docs.map((d) => d.id);
          setDiagnostico(
            `UID de tu sesión:\n${JSON.stringify(user.uid)}\n\nIDs en usuarios:\n${JSON.stringify(ids, null, 2)}`
          );
        }
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
        {diagnostico && (
          <pre
            className="vacio"
            style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", textAlign: "left" }}
          >
            {diagnostico}
          </pre>
        )}
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
