// src/utils/reportes/ventasReporte.js
// Lógica pura del reporte de ventas: agrupación del rango y construcción de
// los periodos (incluidos los que no tienen ventas).
import { formatearFecha, formatearMes, inicioSemana, parseFecha, sumarDias } from '../dates.js';
import { redondear2 } from '../number.js';

const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Cantidad de días de calendario incluidos entre dos fechas `YYYY-MM-DD`. */
export function contarDiasInclusivos(desde, hasta) {
  const inicio = parseFecha(desde);
  const fin = parseFecha(hasta);
  return Math.round((fin.getTime() - inicio.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Agrupación del reporte según el largo del rango:
 * hasta 31 días por día, de 32 a 92 por semana y más de 92 por mes.
 */
export function determinarAgrupacion(desde, hasta) {
  const dias = contarDiasInclusivos(desde, hasta);

  if (dias <= 31) return 'dia';
  if (dias <= 92) return 'semana';
  return 'mes';
}

function etiquetaDia(fecha) {
  return `${fecha.getUTCDate()} ${MESES_CORTOS[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`;
}

function etiquetaSemana(desde, hasta) {
  const diaInicio = desde.getUTCDate();
  const diaFin = hasta.getUTCDate();
  const mesInicio = MESES_CORTOS[desde.getUTCMonth()];
  const mesFin = MESES_CORTOS[hasta.getUTCMonth()];
  const anioInicio = desde.getUTCFullYear();
  const anioFin = hasta.getUTCFullYear();
  const mismoMes = mesInicio === mesFin && anioInicio === anioFin;
  const mismoAnio = anioInicio === anioFin;

  if (mismoMes) {
    if (diaInicio === diaFin) return `${diaInicio} ${mesInicio} ${anioInicio}`;
    return `${diaInicio} – ${diaFin} ${mesInicio}`;
  }

  if (mismoAnio) {
    return `${diaInicio} ${mesInicio} – ${diaFin} ${mesFin}`;
  }

  return `${diaInicio} ${mesInicio} ${anioInicio} – ${diaFin} ${mesFin} ${anioFin}`;
}

function etiquetaMes(anio, mes, inicioReal, finReal, inicioMes, finMes) {
  let etiqueta = `${MESES_LARGOS[mes]} de ${anio}`;

  if (inicioReal.getTime() > inicioMes.getTime()) {
    etiqueta += ` (desde el ${inicioReal.getUTCDate()})`;
  }

  if (finReal.getTime() < finMes.getTime()) {
    etiqueta += ` (hasta el ${finReal.getUTCDate()})`;
  }

  return etiqueta;
}

function claveDePeriodo(fecha, agrupacion) {
  if (agrupacion === 'semana') return formatearFecha(inicioSemana(fecha));
  if (agrupacion === 'mes') return formatearMes(fecha);
  return formatearFecha(fecha);
}

/**
 * Construye una fila por cada periodo del rango. Los días sin ventas se
 * incluyen con cero y, en semanas/meses, la fila se recorta al rango real.
 */
export function construirFilasPeriodo({
  desde,
  hasta,
  agrupacion = determinarAgrupacion(desde, hasta),
  totalesPorDia = new Map(),
}) {
  const inicio = parseFecha(desde);
  const fin = parseFecha(hasta);
  const periodos = new Map();

  for (let fecha = inicio; fecha <= fin; fecha = sumarDias(fecha, 1)) {
    const clave = claveDePeriodo(fecha, agrupacion);
    let periodo = periodos.get(clave);

    if (!periodo) {
      periodo = { inicio: fecha, fin: fecha, ventas: 0, total: 0 };
      periodos.set(clave, periodo);
    }

    periodo.fin = fecha;

    const dia = totalesPorDia.get(formatearFecha(fecha));
    if (dia) {
      periodo.ventas += Number(dia.ventas) || 0;
      periodo.total += Number(dia.total) || 0;
    }
  }

  return Array.from(periodos.values()).map((periodo) => {
    let etiqueta;

    if (agrupacion === 'semana') {
      etiqueta = etiquetaSemana(periodo.inicio, periodo.fin);
    } else if (agrupacion === 'mes') {
      const anio = periodo.inicio.getUTCFullYear();
      const mes = periodo.inicio.getUTCMonth();
      const inicioMes = new Date(Date.UTC(anio, mes, 1));
      const finMes = new Date(Date.UTC(anio, mes + 1, 0));
      etiqueta = etiquetaMes(anio, mes, periodo.inicio, periodo.fin, inicioMes, finMes);
    } else {
      etiqueta = etiquetaDia(periodo.inicio);
    }

    return {
      periodo: etiqueta,
      ventas: periodo.ventas,
      total: redondear2(periodo.total),
    };
  });
}
