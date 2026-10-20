import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type { Nivel, Periodo, Rol } from "../types";
import type { Preregistro } from "./datos";

export async function guardarPreregistro(correo: string, nombre: string, rol: Rol, nivel?: Nivel) {
  const id = correo.trim().toLowerCase();
  const datos: { nombre: string; rol: Rol; nivel?: Nivel } = { nombre: nombre.trim(), rol };
  if (nivel !== undefined) datos.nivel = nivel;
  await setDoc(doc(db, "preregistros", id), datos);
}

export async function crearCurso(
  nombre: string,
  nivel: Nivel,
  grupo: string,
  profesorId: string,
  especialidadTecnica: boolean
) {
  await addDoc(collection(db, "cursos"), {
    nombre: nombre.trim(),
    nivel,
    grupo: grupo.trim(),
    profesorId,
    especialidadTecnica,
  });
}

// El ID es fijo, así guardar otra vez la misma nota la reemplaza.
export async function guardarNota(estudianteId: string, cursoId: string, periodo: Periodo, valor: number) {
  const id = `${estudianteId}_${cursoId}_${periodo}`;
  await setDoc(doc(db, "notas", id), { estudianteId, cursoId, periodo, valor });
}

// Lo usa la app en el primer ingreso de una persona preregistrada.
export async function activarPreregistro(user: User, pre: Preregistro) {
  const datos: { nombre: string; correo: string; rol: Rol; nivel?: Nivel } = {
    nombre: pre.nombre || user.displayName || "Usuario",
    correo: user.email ?? "",
    rol: pre.rol,
  };
  if (pre.nivel !== undefined) datos.nivel = pre.nivel;
  await setDoc(doc(db, "usuarios", user.uid), datos);
}
