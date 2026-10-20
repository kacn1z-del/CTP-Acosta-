import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { DOMINIOS_INSTITUCIONALES } from "../config";

export function esCorreoInstitucional(correo: string | null | undefined): boolean {
  if (!correo) return false;
  const dominio = correo.split("@")[1]?.toLowerCase();
  return !!dominio && DOMINIOS_INSTITUCIONALES.includes(dominio);
}

export async function iniciarSesion(): Promise<User> {
  const credencial = await signInWithPopup(auth, googleProvider);

  if (!esCorreoInstitucional(credencial.user.email)) {
    await signOut(auth);
    throw new Error("Debes iniciar sesión con tu correo institucional.");
  }

  return credencial.user;
}

export function cerrarSesion(): Promise<void> {
  return signOut(auth);
}

export function escucharSesion(callback: (usuario: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
