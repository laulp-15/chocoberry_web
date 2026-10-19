// src/utils/loginAttempts.js
// Bloqueo temporal por intentos fallidos, almacenado EN MEMORIA.
// Decisión de alcance: la base de datos no tiene tabla para esto y acordamos
// no modificarla; el registro se pierde al reiniciar el servidor (aceptable).
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 30_000;

// correo (minúsculas) -> { count, bloqueadoHasta }
const intentos = new Map();

const clave = (correo) => String(correo ?? '').trim().toLowerCase();

/** ¿Está bloqueado ese correo? Devuelve también los segundos restantes. */
export function estaBloqueado(correo) {
  const k = clave(correo);
  const registro = intentos.get(k);
  if (!registro?.bloqueadoHasta) return { bloqueado: false, segundosRestantes: 0 };

  const restante = registro.bloqueadoHasta - Date.now();
  if (restante <= 0) {
    intentos.delete(k);
    return { bloqueado: false, segundosRestantes: 0 };
  }
  return { bloqueado: true, segundosRestantes: Math.ceil(restante / 1000) };
}

/** Registra un intento fallido y bloquea la cuenta si se supera el máximo. */
export function registrarIntentoFallido(correo) {
  const k = clave(correo);
  const actual = intentos.get(k) ?? { count: 0, bloqueadoHasta: 0 };
  const count = actual.count + 1;

  if (count >= MAX_INTENTOS) {
    intentos.set(k, { count: 0, bloqueadoHasta: Date.now() + BLOQUEO_MS });
    return { bloqueado: true, segundosRestantes: Math.ceil(BLOQUEO_MS / 1000), intentosRestantes: 0 };
  }

  intentos.set(k, { count, bloqueadoHasta: 0 });
  return { bloqueado: false, segundosRestantes: 0, intentosRestantes: MAX_INTENTOS - count };
}

/** Limpia los intentos (por ejemplo, tras un login exitoso). */
export function limpiarIntentos(correo) {
  intentos.delete(clave(correo));
}

export const CONFIG_INTENTOS = { MAX_INTENTOS, BLOQUEO_MS };
