import { NOTA_MINIMA_APROBACION } from "../config";

export function notaValida(valor: number): boolean {
  return Number.isFinite(valor) && valor >= 0 && valor <= 100;
}

// Promedio de los periodos que ya tienen nota. Redondea a un decimal.
// Confirmar con el colegio si el promedio final sigue esta regla.
export function promedioPeriodos(notas: (number | null | undefined)[]): number | null {
  const validas = notas.filter((n): n is number => typeof n === "number");
  if (validas.length === 0) return null;

  const suma = validas.reduce((acum, n) => acum + n, 0);
  return Math.round((suma / validas.length) * 10) / 10;
}

export type EstadoAcademico = "aprobado" | "reprobado" | "pendiente";

export function estadoAcademico(promedio: number | null): EstadoAcademico {
  if (promedio === null) return "pendiente";
  return promedio >= NOTA_MINIMA_APROBACION ? "aprobado" : "reprobado";
}
