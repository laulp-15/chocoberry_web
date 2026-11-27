import { query } from '../../src/config/db.js';

const originales = new Map();

/** Guarda el valor original una sola vez por fecha. */
async function recordarOriginal(fecha) {
  if (originales.has(fecha)) return;

  const filas = await query(
    'SELECT fecha, max_fresas FROM capacidadDia WHERE fecha = ? LIMIT 1',
    [fecha]
  );
  originales.set(fecha, filas[0] ?? null);
}

/** Fija una excepción de capacidad amplia para aislar pruebas no relacionadas. */
export async function fijarTope(fecha, maxFresas = 100000) {
  await recordarOriginal(fecha);
  await query(
    `INSERT INTO capacidadDia (fecha, max_fresas)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE max_fresas = VALUES(max_fresas)`,
    [fecha, maxFresas]
  );
}

/**
 * Devuelve cada fecha a su valor original. Con `conservar=true` mantiene el
 * snapshot para poder restaurar varias veces dentro de una misma suite.
 */
export async function restablecerFechas(fechas, { conservar = false } = {}) {
  for (const fecha of fechas) {
    if (!originales.has(fecha)) await recordarOriginal(fecha);

    const original = originales.get(fecha);
    if (original) {
      await query('UPDATE capacidadDia SET max_fresas = ? WHERE fecha = ?', [
        original.max_fresas,
        fecha,
      ]);
    } else {
      await query('DELETE FROM capacidadDia WHERE fecha = ?', [fecha]);
    }

    if (!conservar) originales.delete(fecha);
  }
}
