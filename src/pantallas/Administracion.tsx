import { useEffect, useState, type FormEvent } from "react";
import type { Curso, Nivel, Periodo, Rol, Usuario } from "../types";
import { obtenerCursos, obtenerPreregistros, obtenerUsuarios, type Preregistro } from "../lib/datos";
import { crearCurso, eliminarPreregistro, guardarNota, guardarPreregistro } from "../lib/admin";
import { notaValida } from "../lib/mep";
import "../estilos-admin.css";

type Seccion = "personas" | "cursos" | "notas";

const SECCIONES: { id: Seccion; etiqueta: string }[] = [
  { id: "personas", etiqueta: "Personas" },
  { id: "cursos", etiqueta: "Cursos" },
  { id: "notas", etiqueta: "Notas" },
];
const NIVELES: Nivel[] = [7, 8, 9, 10, 11, 12];
const PERIODOS: Periodo[] = [1, 2, 3];
const ROLES: Rol[] = ["estudiante", "profesor", "administrativo"];
const ETIQUETA_ROL: Record<Rol, string> = {
  estudiante: "Estudiante",
  profesor: "Profesor",
  administrativo: "Administrativo",
};

type Props = {
  onSalir: () => void;
};

export default function Administracion({ onSalir }: Props) {
  const [seccion, setSeccion] = useState<Seccion>("personas");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [preregistros, setPreregistros] = useState<Preregistro[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Persona
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<Rol>("estudiante");
  const [nivelPersona, setNivelPersona] = useState<Nivel>(11);

  // Curso
  const [nombreCurso, setNombreCurso] = useState("");
  const [nivelCurso, setNivelCurso] = useState<Nivel>(11);
  const [grupo, setGrupo] = useState("");
  const [profesorId, setProfesorId] = useState("");
  const [especialidad, setEspecialidad] = useState(false);

  // Nota
  const [estudianteId, setEstudianteId] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>(1);
  const [valor, setValor] = useState("");

  const estudiantes = usuarios.filter((u) => u.rol === "estudiante");
  const profesores = usuarios.filter((u) => u.rol === "profesor");
  const pendientes = preregistros.filter(
    (p) => !usuarios.some((u) => u.correo.toLowerCase() === p.correo)
  );

  async function recargar() {
    try {
      const [u, p, c] = await Promise.all([obtenerUsuarios(), obtenerPreregistros(), obtenerCursos()]);
      setUsuarios(u);
      setPreregistros(p);
      setCursos(c);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los datos.");
    }
  }

  useEffect(() => {
    recargar();
  }, []);

  async function ejecutar(accion: () => Promise<void>, ok: string) {
    setError(null);
    setMensaje(null);
    setEnviando(true);
    try {
      await accion();
      setMensaje(ok);
      await recargar();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Ocurrió un error.");
    } finally {
      setEnviando(false);
    }
  }

  function cambiarSeccion(s: Seccion) {
    setSeccion(s);
    setMensaje(null);
    setError(null);
  }

  function guardarPersona(e: FormEvent) {
    e.preventDefault();
    if (!correo.includes("@")) {
      setError("Escribe un correo válido.");
      return;
    }
    if (!nombre.trim()) {
      setError("Escribe el nombre completo.");
      return;
    }
    ejecutar(
      async () => {
        await guardarPreregistro(correo, nombre, rol, rol === "estudiante" ? nivelPersona : undefined);
        setCorreo("");
        setNombre("");
      },
      "Persona registrada. Al entrar con su correo, su perfil se creará con el rol asignado."
    );
  }

  function eliminarPendiente(correoPendiente: string) {
    if (!window.confirm(`¿Eliminar el preregistro de ${correoPendiente}?`)) return;
    ejecutar(() => eliminarPreregistro(correoPendiente), "Preregistro eliminado.");
  }

  function guardarCursoForm(e: FormEvent) {
    e.preventDefault();
    if (!nombreCurso.trim()) {
      setError("Escribe el nombre del curso.");
      return;
    }
    ejecutar(
      async () => {
        await crearCurso(nombreCurso, nivelCurso, grupo, profesorId, especialidad);
        setNombreCurso("");
        setGrupo("");
        setProfesorId("");
        setEspecialidad(false);
      },
      "Curso creado."
    );
  }

  function guardarNotaForm(e: FormEvent) {
    e.preventDefault();
    const numero = Number(valor);
    if (!estudianteId || !cursoId) {
      setError("Elige estudiante y curso.");
      return;
    }
    if (valor.trim() === "" || !notaValida(numero)) {
      setError("La nota debe estar entre 0 y 100.");
      return;
    }
    ejecutar(
      async () => {
        await guardarNota(estudianteId, cursoId, periodo, numero);
        setValor("");
      },
      "Nota guardada."
    );
  }

  return (
    <div className="pagina">
      <header className="encabezado">
        <div>
          <h1>Administración</h1>
          <p>Campus CTP Acosta</p>
        </div>
        <button className="boton secundario" onClick={onSalir}>
          Salir
        </button>
      </header>

      <div className="admin-tabs">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            className={seccion === s.id ? "activo" : ""}
            onClick={() => cambiarSeccion(s.id)}
          >
            {s.etiqueta}
          </button>
        ))}
      </div>

      {mensaje && <p className="exito">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      {seccion === "personas" && (
        <>
          <section className="tarjeta">
            <h2 className="titulo-bloque pequeno">Registrar persona</h2>
            <form className="formulario" onSubmit={guardarPersona}>
              <label className="campo">
                <span>Correo</span>
                <input
                  className="input"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="nombre@mep.go.cr"
                />
              </label>
              <label className="campo">
                <span>Nombre completo</span>
                <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </label>
              <label className="campo">
                <span>Rol</span>
                <select className="select" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ETIQUETA_ROL[r]}
                    </option>
                  ))}
                </select>
              </label>
              {rol === "estudiante" && (
                <label className="campo">
                  <span>Nivel</span>
                  <select
                    className="select"
                    value={nivelPersona}
                    onChange={(e) => setNivelPersona(Number(e.target.value) as Nivel)}
                  >
                    {NIVELES.map((n) => (
                      <option key={n} value={n}>
                        {n}°
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button className="boton" type="submit" disabled={enviando}>
                Guardar
              </button>
            </form>
          </section>

          <section className="tarjeta">
            <h2 className="titulo-bloque pequeno">Pendientes de primer ingreso</h2>
            {pendientes.length === 0 && <p className="vacio">No hay pendientes.</p>}
            {pendientes.map((p) => (
              <div className="item-admin" key={p.correo}>
                <strong>{p.nombre || p.correo}</strong>
                <small>
                  {p.correo} · {ETIQUETA_ROL[p.rol]}
                  {p.nivel ? ` · ${p.nivel}°` : ""}
                </small>
                <button
                  className="boton secundario"
                  style={{ marginTop: 8 }}
                  onClick={() => eliminarPendiente(p.correo)}
                  disabled={enviando}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </section>

          <section className="tarjeta">
            <h2 className="titulo-bloque pequeno">Personas registradas</h2>
            {usuarios.map((u) => (
              <div className="item-admin" key={u.uid}>
                <strong>{u.nombre}</strong>
                <small>
                  {u.correo} · {ETIQUETA_ROL[u.rol]}
                  {u.nivel ? ` · ${u.nivel}°` : ""}
                </small>
              </div>
            ))}
          </section>
        </>
      )}

      {seccion === "cursos" && (
        <>
          <section className="tarjeta">
            <h2 className="titulo-bloque pequeno">Crear curso</h2>
            <form className="formulario" onSubmit={guardarCursoForm}>
              <label className="campo">
                <span>Nombre del curso</span>
                <input
                  className="input"
                  value={nombreCurso}
                  onChange={(e) => setNombreCurso(e.target.value)}
                />
              </label>
              <label className="campo">
                <span>Nivel</span>
                <select
                  className="select"
                  value={nivelCurso}
                  onChange={(e) => setNivelCurso(Number(e.target.value) as Nivel)}
                >
                  {NIVELES.map((n) => (
                    <option key={n} value={n}>
                      {n}°
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                <span>Grupo</span>
                <input
                  className="input"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                  placeholder="11-2"
                />
              </label>
              <label className="campo">
                <span>Profesor</span>
                <select className="select" value={profesorId} onChange={(e) => setProfesorId(e.target.value)}>
                  <option value="">Sin asignar</option>
                  {profesores.map((p) => (
                    <option key={p.uid} value={p.uid}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="fila-check">
                <input
                  type="checkbox"
                  checked={especialidad}
                  onChange={(e) => setEspecialidad(e.target.checked)}
                />
                Especialidad técnica
              </label>
              <button className="boton" type="submit" disabled={enviando}>
                Crear curso
              </button>
            </form>
          </section>

          <section className="tarjeta">
            <h2 className="titulo-bloque pequeno">Cursos</h2>
            {cursos.length === 0 && <p className="vacio">Aún no hay cursos.</p>}
            {cursos.map((c) => (
              <div className="item-admin" key={c.id}>
                <strong>{c.nombre}</strong>
                <small>
                  {c.nivel}° · Grupo {c.grupo}
                  {c.especialidadTecnica ? " · Especialidad técnica" : ""}
                </small>
              </div>
            ))}
          </section>
        </>
      )}

      {seccion === "notas" && (
        <section className="tarjeta">
          <h2 className="titulo-bloque pequeno">Registrar nota</h2>
          <form className="formulario" onSubmit={guardarNotaForm}>
            <label className="campo">
              <span>Estudiante</span>
              <select className="select" value={estudianteId} onChange={(e) => setEstudianteId(e.target.value)}>
                <option value="">Elige un estudiante</option>
                {estudiantes.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.nombre}
                    {u.nivel ? ` · ${u.nivel}°` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Curso</span>
              <select className="select" value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                <option value="">Elige un curso</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} · {c.nivel}° {c.grupo}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Periodo</span>
              <select
                className="select"
                value={periodo}
                onChange={(e) => setPeriodo(Number(e.target.value) as Periodo)}
              >
                {PERIODOS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>Nota (0 a 100)</span>
              <input
                className="input"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </label>
            <button className="boton" type="submit" disabled={enviando}>
              Guardar nota
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
