import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import type { Aviso, Curso, Nota, Usuario } from "../types";

export async function obtenerPerfil(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;
  return { ...(snap.data() as Usuario), uid: snap.id };
}

export async function obtenerCursos(): Promise<Curso[]> {
  const snap = await getDocs(collection(db, "cursos"));
  return snap.docs.map((d) => ({ ...(d.data() as Curso), id: d.id }));
}

export async function obtenerNotasDeEstudiante(uid: string): Promise<Nota[]> {
  const consulta = query(collection(db, "notas"), where("estudianteId", "==", uid));
  const snap = await getDocs(consulta);
  return snap.docs.map((d) => ({ ...(d.data() as Nota), id: d.id }));
}

export async function obtenerAvisos(): Promise<Aviso[]> {
  const snap = await getDocs(collection(db, "avisos"));
  return snap.docs
    .map((d) => ({ ...(d.data() as Aviso), id: d.id }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}
