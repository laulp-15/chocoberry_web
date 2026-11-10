// src/shared/api/session.js
// Único lugar que sabe dónde vive la sesión: el usuario y el token JWT.
//
// "Recordarme" decide el almacenamiento:
//   - localStorage   -> la sesión sobrevive al cerrar el navegador.
//   - sessionStorage -> la sesión se borra al cerrar la pestaña.
//
// El token vive SIEMPRE junto al usuario, en el mismo almacenamiento, y no
// se expone en la interfaz.

const SESSION_KEY = "cb_session";
const TOKEN_KEY = "cb_token";

/** Lee el usuario de la sesión (localStorage primero, luego sessionStorage). */
export function readSession() {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) ||
      sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Guarda usuario + token y deja la sesión en un único almacenamiento,
 * limpiando el otro para evitar sesiones duplicadas.
 */
export function saveSession(user, token, remember) {
  const storage = remember ? localStorage : sessionStorage;
  const otro = remember ? sessionStorage : localStorage;

  try {
    otro.removeItem(SESSION_KEY);
    otro.removeItem(TOKEN_KEY);

    storage.setItem(SESSION_KEY, JSON.stringify(user));
    if (token) storage.setItem(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento disponible: la sesión vive solo en memoria.
  }
}

/**
 * Actualiza el usuario de la sesión conservando el almacenamiento actual
 * (por ejemplo, al recargar el perfil o revalidar el token).
 */
export function refreshSessionUser(user) {
  try {
    const storage = localStorage.getItem(SESSION_KEY)
      ? localStorage
      : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // best effort: si falla, el estado en memoria sigue siendo válido.
  }
  return user;
}

/** Devuelve el token JWT actual, o null si no hay sesión. */
export function getToken() {
  try {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

/** Cierra la sesión: borra usuario y token de ambos almacenamientos. */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // best effort.
  }
}

export const SESSION_STORAGE_KEY = SESSION_KEY;
export const TOKEN_STORAGE_KEY = TOKEN_KEY;
