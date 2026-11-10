// src/utils/reportes/formatos.js
// Formatos compartidos por los reportes PDF y Excel.
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/** Número -> "$ 35.000". */
export function formatearMoneda(valor) {
  return moneda.format(Number(valor) || 0);
}

/** Convierte fechas de MySQL (Date o texto) a Date local sin desfase de día. */
export function aFecha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;

  const texto = String(valor);
  const coincidencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (coincidencia) {
    return new Date(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3])
    );
  }

  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Fecha -> "dd/mm/yyyy". */
export function formatearFechaCorta(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

/** Fecha -> "dd/mm/yyyy hh:mm". */
export function formatearFechaHora(valor) {
  const fecha = aFecha(valor);
  if (!fecha) return '—';
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minuto = String(fecha.getMinutes()).padStart(2, '0');
  return `${formatearFechaCorta(fecha)} ${hora}:${minuto}`;
}

/** "YYYY-MM" -> "marzo de 1999". */
export function formatearMesLargo(valor) {
  if (!valor) return '—';
  const [anio, mes] = String(valor).split('-').map(Number);
  if (!anio || !mes || mes < 1 || mes > 12) return String(valor);
  return `${MESES[mes - 1]} de ${anio}`;
}

/** Fecha de hoy -> "dd/mm/yyyy". */
export function fechaHoyCorta() {
  return formatearFechaCorta(new Date());
}
