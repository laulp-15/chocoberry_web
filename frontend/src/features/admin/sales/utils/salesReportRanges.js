// src/features/admin/sales/utils/salesReportRanges.js
// Fechas de los rangos rápidos del reporte de ventas. Todo se calcula como
// calendario de Colombia (America/Bogota), nunca con la zona del navegador.
const MS_DIA = 24 * 60 * 60 * 1000;

const FORMATO_FECHA_COLOMBIA = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Bogota",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const RANGOS_RAPIDOS_REPORTE = [
  { id: "hoy", label: "Hoy" },
  { id: "ayer", label: "Ayer" },
  { id: "ultimos7", label: "Últimos 7 días" },
  { id: "esteMes", label: "Este mes" },
  { id: "mesPasado", label: "Mes pasado" },
  { id: "personalizado", label: "Personalizado" },
];

/** Fecha de hoy en Colombia en formato `YYYY-MM-DD`. */
export function fechaHoyColombia() {
  const partes = FORMATO_FECHA_COLOMBIA.formatToParts(new Date());
  const valores = Object.fromEntries(
    partes
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, parte.value])
  );
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function aFechaUTC(iso) {
  const [anio, mes, dia] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function aISO(fecha) {
  const anio = fecha.getUTCFullYear();
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getUTCDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function esFechaValida(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ""))) return false;
  const fecha = aFechaUTC(iso);
  return aISO(fecha) === iso;
}

export function sumarDiasISO(iso, dias) {
  return aISO(new Date(aFechaUTC(iso).getTime() + dias * MS_DIA));
}

/** Suma meses conservando el día (se recorta al último día del mes destino). */
export function sumarMesesISO(iso, meses) {
  const fecha = aFechaUTC(iso);
  const anio = fecha.getUTCFullYear();
  const mes = fecha.getUTCMonth() + meses;
  const ultimoDia = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return aISO(
    new Date(Date.UTC(anio, mes, Math.min(fecha.getUTCDate(), ultimoDia)))
  );
}

function primerDiaMes(iso) {
  return `${iso.slice(0, 7)}-01`;
}

function ultimoDiaMes(iso) {
  const [anio, mes] = iso.split("-").map(Number);
  return aISO(new Date(Date.UTC(anio, mes, 0)));
}

/** Calcula las fechas de cada rango rápido a partir de hoy (Colombia). */
export function calcularRangosRapidos(hoy = fechaHoyColombia()) {
  const ayer = sumarDiasISO(hoy, -1);
  const inicioUltimos7 = sumarDiasISO(hoy, -6);
  const referenciaMesPasado = sumarMesesISO(hoy, -1);

  return {
    hoy: { desde: hoy, hasta: hoy },
    ayer: { desde: ayer, hasta: ayer },
    ultimos7: { desde: inicioUltimos7, hasta: hoy },
    esteMes: { desde: primerDiaMes(hoy), hasta: hoy },
    mesPasado: {
      desde: primerDiaMes(referenciaMesPasado),
      hasta: ultimoDiaMes(referenciaMesPasado),
    },
  };
}

/** Devuelve el mensaje de error del rango o "" si es válido. */
export function validarRangoReporte(desde, hasta, hoy = fechaHoyColombia()) {
  if (!desde || !hasta) return "Selecciona las fechas Desde y Hasta.";
  if (!esFechaValida(desde) || !esFechaValida(hasta)) {
    return "Selecciona fechas válidas.";
  }
  if (desde > hasta) {
    return 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".';
  }
  if (desde > hoy || hasta > hoy) {
    return "No se permiten fechas futuras.";
  }
  if (hasta > sumarMesesISO(desde, 12)) {
    return "El rango máximo permitido es de 12 meses.";
  }
  return "";
}

/** `YYYY-MM-DD` -> `dd/mm/yyyy` para mostrar en la interfaz. */
export function formatearFechaCorta(iso) {
  if (!iso) return "—";
  const [anio, mes, dia] = String(iso).slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}
