// src/utils/dates.js
// Helpers de fechas para reportes. Se trabaja con fechas "de calendario" en UTC
// para evitar que las conversiones de zona horaria muevan un día o un mes.
const MS_DIA = 24 * 60 * 60 * 1000;

const FORMATO_FECHA_COLOMBIA = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Fecha de hoy según el calendario local, representada como UTC a medianoche. */
export function fechaActualLocal() {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
}

/** Fecha de hoy en Colombia (`YYYY-MM-DD`), independiente de la zona del servidor. */
export function fechaHoyColombia() {
  const partes = FORMATO_FECHA_COLOMBIA.formatToParts(new Date());
  const valores = Object.fromEntries(
    partes.filter((parte) => parte.type !== 'literal').map((parte) => [parte.type, parte.value])
  );
  return `${valores.year}-${valores.month}-${valores.day}`;
}

/** Convierte `YYYY-MM-DD` a Date UTC; devuelve null si no es una fecha real. */
export function parseFecha(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;

  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return fecha;
}

/** Convierte `YYYY-MM` al primer día de ese mes (UTC); null si no es válido. */
export function parseMes(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}$/.test(texto)) return null;

  const [anio, mes] = texto.split('-').map(Number);
  if (mes < 1 || mes > 12) return null;

  const fecha = new Date(Date.UTC(anio, mes - 1, 1));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1) return null;

  return fecha;
}

/** Date UTC -> `YYYY-MM-DD`. */
export function formatearFecha(fecha) {
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Date UTC -> `YYYY-MM`. */
export function formatearMes(fecha) {
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}

/** Suma (o resta) días conservando la fecha de calendario. */
export function sumarDias(fecha, dias) {
  return new Date(fecha.getTime() + dias * MS_DIA);
}

/** Primer día del mes de `fecha`, desplazado `meses` meses. */
export function sumarMeses(fecha, meses) {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth() + meses, 1));
}

/** Suma meses conservando el día (se recorta al último día del mes destino). */
export function sumarMesesConservandoDia(fecha, meses) {
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + meses;
  const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(anio, mes, Math.min(fecha.getUTCDate(), ultimoDia)));
}

/** Lunes de la semana que contiene `fecha`. */
export function inicioSemana(fecha) {
  const desplazamiento = (fecha.getUTCDay() + 6) % 7;
  return sumarDias(fecha, -desplazamiento);
}

/** Primer día del mes de `fecha`. */
export function inicioMes(fecha) {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), 1));
}

/** Fecha de calendario a la medianoche que usa MySQL (`YYYY-MM-DD 00:00:00`). */
export function fechaHora(fecha) {
  return `${formatearFecha(fecha)} 00:00:00`;
}
