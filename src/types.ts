export type Rol = "estudiante" | "profesor" | "administrativo";

export type Nivel = 7 | 8 | 9 | 10 | 11 | 12;

export type Periodo = 1 | 2 | 3;

export interface Usuario {
  uid: string;
  nombre: string;
  correo: string;
  rol: Rol;
  nivel?: Nivel;
  encargadoCorreo?: string;
}

export interface Curso {
  id: string;
  nombre: string;
  nivel: Nivel;
  grupo: string;
  profesorId: string;
  especialidadTecnica: boolean;
}

export interface Nota {
  id: string;
  estudianteId: string;
  cursoId: string;
  periodo: Periodo;
  valor: number; // de 0 a 100
}

export interface Evaluacion {
  id: string;
  cursoId: string;
  nombre: string;
  fechaAplicacion: string; // formato YYYY-MM-DD
}

export interface Aviso {
  id: string;
  titulo: string;
  texto: string;
  fecha: string; // formato YYYY-MM-DD
  niveles: Nivel[]; // lista vacía = para todos
  publicadoPor: string;
}
