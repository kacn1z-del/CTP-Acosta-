import { useEffect, useMemo, useState } from "react";
import type { Aviso, Curso, Nota, Periodo, Usuario } from "../types";
import { obtenerAvisos, obtenerCursos, obtenerNotasDeEstudiante } from "../lib/datos";
import { estadoAcademico, promedioPeriodos, type EstadoAcademico } from "../lib/mep";

const PERIODOS: Periodo[] = [1, 2, 3];

const ETIQUETA_PERIODO: Record<Periodo, string> = {
  1: "I",
  2: "II",
  3: "III",
};

const ETIQUETA_ESTADO: Record<EstadoAcademico, string> = {
  aprobado: "Aprobado",
  reprobado: "Reprobado",
  pendiente: "Pendiente",
};

type Props = {
  perfil: Usuario;
  onSalir: () => void;
};

export default function Inicio({ perfil, onSalir }: Props) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const [listaCursos, listaNotas, listaAvisos] = await Promise.all([
          obtenerCursos(),
          obtenerNotasDeEstudiante(perfil.uid),
          obtenerAvisos(),
        ]);
        if (!cancelado) {
          setCursos(listaCursos);
          setNotas(listaNotas);
          setAvisos(listaAvisos);
        }
      } catch (e) {
        console.error(e);
        if (!cancelado) setError("No se pudieron cargar tus datos. Intenta de nuevo.");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [perfil.uid]);

  const resumen = useMemo(() => {
    return cursos
      .map((curso) => {
        const notasCurso = notas.filter((n) => n.cursoId === curso.id);
        const valores = PERIODOS.map(
          (p) => notasCurso.find((n) => n.periodo === p)?.valor ?? null
        );
        const promedio = promedioPeriodos(valores);
        return { curso, valores, promedio, estado: estadoAcademico(promedio) };
      })
      .filter((fila) => fila.valores.some((v) => v !== null));
  }, [cursos, notas]);

  const promedioGeneral = promedioPeriodos(resumen.map((f) => f.promedio));

  const avisosVisibles = avisos.filter(
    (a) =>
      a.niveles.length === 0 ||
      (perfil.nivel !== undefined && a.niveles.includes(perfil.nivel))
  );

  return (
    <div className="pagina">
      <header className="encabezado">
        <div>
          <h1>Hola, {perfil.nombre}</h1>
          <p>Estudiante{perfil.nivel ? ` · ${perfil.nivel}°` : ""}</p>
        </div>
        <button className="boton secundario" onClick={onSalir}>
          Salir
        </button>
      </header>

      {cargando && <p className="vacio">Cargando tus datos...</p>}
      {error && <p className="error">{error}</p>}

      {!cargando && !error && (
        <>
          <section className="tarjeta">
            <h2>Promedio general</h2>
            <p className="promedio">
              {promedioGeneral === null ? "—" : promedioGeneral.toFixed(1)}
            </p>
          </section>

          <section className="tarjeta">
            <h2>Mis cursos</h2>
            {resumen.length === 0 && (
              <p className="vacio">Aún no tienes notas registradas.</p>
            )}
            {resumen.map((fila) => (
              <div className="fila" key={fila.curso.id}>
                <div>
                  <strong>{fila.curso.nombre}</strong>
                  <div className="periodos">
                    {PERIODOS.map((p, i) => (
                      <span className="chip" key={p}>
                        {ETIQUETA_PERIODO[p]}: {fila.valores[i] ?? "—"}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>
                    {fila.promedio === null ? "—" : fila.promedio.toFixed(1)}
                  </strong>
                  <div>
                    <span className={`estado ${fila.estado}`}>
                      {ETIQUETA_ESTADO[fila.estado]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="tarjeta">
            <h2>Avisos</h2>
            {avisosVisibles.length === 0 && (
              <p className="vacio">No hay avisos para tu nivel.</p>
            )}
            {avisosVisibles.map((a) => (
              <div className="aviso" key={a.id}>
                <strong>{a.titulo}</strong>
                <span>{a.fecha}</span>
                <p className="texto-aviso">{a.texto}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
