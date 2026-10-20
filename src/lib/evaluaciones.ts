// Feriados de Costa Rica que no son días hábiles para el cálculo.
// Completar con el calendario oficial del año.
const FESTIVOS: string[] = [
  // "2026-01-01",
];

function formatearISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function esDiaHabil(fecha: Date): boolean {
  const diaSemana = fecha.getDay();
  return diaSemana !== 0 && diaSemana !== 6 && !FESTIVOS.includes(formatearISO(fecha));
}

function restarDiasHabiles(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  let restantes = dias;

  while (restantes > 0) {
    resultado.setDate(resultado.getDate() - 1);
    if (esDiaHabil(resultado)) restantes--;
  }

  return resultado;
}

function sumarDiasCalendario(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

export function parsearFechaISO(fechaISO: string): Date {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function formatearFecha(fecha: Date): string {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

// Fechas límite según la circular CE-031-2026.
// Indicadores: 5 días hábiles antes.
// Prueba física en duplicado: 8 días antes.
// Copia y tabla de especificación: hasta 3 días después.
// Los días de 8 y 3 se toman como calendario. Confirmar con dirección.
export function fechasLimitePrueba(fechaPruebaISO: string) {
  const prueba = parsearFechaISO(fechaPruebaISO);

  return {
    indicadoresA: formatearFecha(restarDiasHabiles(prueba, 5)),
    duplicadoEntregaA: formatearFecha(sumarDiasCalendario(prueba, -8)),
    copiaEntregaHasta: formatearFecha(sumarDiasCalendario(prueba, 3)),
  };
}
