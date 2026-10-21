// src/features/reviews/utils/reviewFormat.js
//
// La API entrega la fecha como aaaa-mm-dd. En la vista pública mostramos
// cuánto tiempo ha pasado desde que se publicó la reseña.

const DIA_MS = 24 * 60 * 60 * 1000;

export function formatRelativeDate(fecha) {
  if (!fecha) return "—";

  const [anio, mes, dia] = String(fecha).slice(0, 10).split("-").map(Number);
  if (!anio || !mes || !dia) return "—";

  const publicada = new Date(anio, mes - 1, dia);
  if (Number.isNaN(publicada.getTime())) return "—";

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const dias = Math.floor((hoy - publicada) / DIA_MS);

  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Hace 1 día";
  if (dias < 7) return `Hace ${dias} días`;

  if (dias < 30) {
    const semanas = Math.floor(dias / 7);
    return semanas === 1 ? "Hace 1 semana" : `Hace ${semanas} semanas`;
  }

  if (dias < 365) {
    const meses = Math.floor(dias / 30);
    return meses === 1 ? "Hace 1 mes" : `Hace ${meses} meses`;
  }

  const anios = Math.floor(dias / 365);
  return anios === 1 ? "Hace 1 año" : `Hace ${anios} años`;
}
