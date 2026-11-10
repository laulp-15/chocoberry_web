// src/utils/accessLog.js
// Registro de accesos, almacenado EN MEMORIA (misma decisión de alcance que
// los intentos fallidos). Guarda los últimos N eventos y los traza en consola.
const LIMITE = 200;

const accesos = [];

/** Guarda un evento de acceso: login, logout, fallo, registro, etc. */
export function registrarAcceso({ correo, resultado, ip = null, userAgent = null }) {
  const registro = {
    correo: correo ?? null,
    resultado,
    ip,
    userAgent,
    fecha: new Date().toISOString(),
  };

  accesos.unshift(registro);
  if (accesos.length > LIMITE) accesos.pop();

  // Traza en consola (se silencia en las pruebas).
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.info(`[acceso] ${registro.resultado} - ${registro.correo}`);
  }
  return registro;
}

/** Devuelve una copia de los accesos registrados (más recientes primero). */
export function listarAccesos() {
  return [...accesos];
}
