// src/features/admin/capacity/utils/capacityUtils.js
//
// Utilidades de fechas y presentación para la capacidad diaria. Las fechas se
// construyen siempre con componentes locales para evitar el desfase de un día
// que produce `new Date("YYYY-MM-DD")` en zonas horarias negativas.

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

export const MAX_MESES_FUTURO = 36;

function pad2(valor) {
  return String(valor).padStart(2, "0");
}

/** `Date` local -> `YYYY-MM-DD`. */
export function fechaISO(fecha) {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(
    fecha.getDate()
  )}`;
}

/** Fecha de hoy en formato ISO local. */
export function hoyISO() {
  return fechaISO(new Date());
}

/** Mes actual en formato `YYYY-MM`. */
export function mesActualISO() {
  return hoyISO().slice(0, 7);
}

/** `YYYY-MM` -> primer día local del mes. */
export function parseMes(mes) {
  const [anio, numeroMes] = String(mes ?? "")
    .split("-")
    .map(Number);

  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(numeroMes) ||
    numeroMes < 1 ||
    numeroMes > 12
  ) {
    return null;
  }

  return new Date(anio, numeroMes - 1, 1);
}

/** Suma meses a `YYYY-MM` y devuelve el nuevo `YYYY-MM`. */
export function sumarMeses(mes, delta) {
  const fecha = parseMes(mes) ?? parseMes(mesActualISO());
  fecha.setMonth(fecha.getMonth() + delta);
  return fechaISO(fecha).slice(0, 7);
}

/** Último mes consultable en el calendario de capacidad. */
export function mesMaximoCapacidad() {
  return sumarMeses(mesActualISO(), MAX_MESES_FUTURO);
}

/** `YYYY-MM` -> "Noviembre 2026". */
export function nombreMes(mes) {
  const fecha = parseMes(mes);
  if (!fecha) return "";
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

/** `YYYY-MM-DD` -> "Miércoles, 25 de noviembre de 2026". */
export function formatearFechaLarga(iso) {
  const [anio, mes, dia] = String(iso ?? "")
    .split("-")
    .map(Number);

  if (!anio || !mes || !dia) return "";

  const texto = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, dia));

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** `YYYY-MM-DD` -> `DD/MM/YYYY`. */
export function formatearFechaCorta(iso) {
  const [anio, mes, dia] = String(iso ?? "").split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : "";
}

/**
 * Genera la grilla lunes-domingo del mes. Las posiciones vacías se devuelven
 * como `null` para que el calendario conserve la alineación de los días.
 */
export function construirGrillaMes(mes) {
  const fecha = parseMes(mes);
  if (!fecha) return [];

  const anio = fecha.getFullYear();
  const numeroMes = fecha.getMonth();
  const inicioSemana = (fecha.getDay() + 6) % 7;
  const diasDelMes = new Date(anio, numeroMes + 1, 0).getDate();

  const celdas = [];
  for (let i = 0; i < inicioSemana; i++) celdas.push(null);

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const fechaDia = new Date(anio, numeroMes, dia);
    celdas.push({
      dia,
      fecha: fechaISO(fechaDia),
    });
  }

  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

/** Clasificación visual de un día a partir de su capacidad. */
export function obtenerEstadoDia(dia) {
  if (!dia) return { clave: "vacio", etiqueta: "Sin datos" };

  if (dia.bloqueado) return { clave: "bloqueado", etiqueta: "Bloqueado" };
  if (dia.fresasAgendadas > dia.tope) {
    return { clave: "sobrecupo", etiqueta: "Sobre cupo" };
  }
  if (dia.disponible <= 0) return { clave: "lleno", etiqueta: "Sin cupo" };
  if (dia.fresasAgendadas > 0) {
    return { clave: "parcial", etiqueta: "Cupo parcial" };
  }

  return { clave: "libre", etiqueta: "Con cupo" };
}

/** Porcentaje entero de ocupación, limitado a 100 para la barra visual. */
export function porcentajeOcupacion(dia) {
  if (!dia) return 0;
  if (!dia.tope || dia.tope <= 0) return 100;
  return Math.min(
    100,
    Math.round((dia.fresasAgendadas / dia.tope) * 100)
  );
}
