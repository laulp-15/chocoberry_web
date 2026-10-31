// src/features/login/services/authService.js
// Llamadas reales al backend para el módulo de acceso. Solo esta capa
// conoce las rutas /auth/*; los hooks y las páginas no cambian su forma
// de uso (siguen llamando a useAuth()).

import { api } from "../../../shared/api/client";
import {
  clearSession,
  getToken,
  saveSession,
} from "../../../shared/api/session";
import {
  mapChangePasswordError,
  mapLoginError,
  mapProfileError,
  mapRegisterError,
  mapUsuarioToSession,
  toLoginPayload,
  toProfilePayload,
  toRegisterPayload,
} from "./mappers";

/** POST /auth/login -> guarda sesión + token y devuelve el usuario de sesión. */
export async function login({ email, password, remember }) {
  try {
    const { token, usuario } = await api.post(
      "/auth/login",
      toLoginPayload({ email, password }),
      { auth: false }
    );

    const sesion = mapUsuarioToSession(usuario);
    saveSession(sesion, token, Boolean(remember));
    return sesion;
  } catch (error) {
    throw mapLoginError(error);
  }
}

/** POST /auth/register -> devuelve el usuario creado (rol Cliente). */
export async function register(datos) {
  try {
    const usuario = await api.post(
      "/auth/register",
      toRegisterPayload(datos),
      { auth: false }
    );
    return mapUsuarioToSession(usuario);
  } catch (error) {
    throw mapRegisterError(error);
  }
}

/** GET /auth/me -> usuario de la sesión actual (revalida el token). */
export async function me() {
  const usuario = await api.get("/auth/me");
  return mapUsuarioToSession(usuario);
}

/** PUT /auth/me -> actualiza el propio perfil. */
export async function updateProfile(updates) {
  try {
    const usuario = await api.put("/auth/me", toProfilePayload(updates));
    return mapUsuarioToSession(usuario);
  } catch (error) {
    throw mapProfileError(error);
  }
}

/** PUT /auth/me/password -> cambia la contraseña del usuario autenticado. */
export async function changePassword({ currentPassword, newPassword }) {
  try {
    await api.put("/auth/me/password", {
      contrasenaActual: currentPassword,
      nuevaContrasena: newPassword,
    });
    return { ok: true };
  } catch (error) {
    throw mapChangePasswordError(error);
  }
}

/**
 * POST /auth/forgot-password.
 *
 * La respuesta es siempre genérica (por seguridad no revela si el correo
 * existe), así que un fallo de red tampoco se propaga: la página solo
 * confirma "enlace enviado".
 */
export async function requestPasswordReset(email) {
  try {
    await api.post(
      "/auth/forgot-password",
      { correo: String(email ?? "").trim().toLowerCase() },
      { auth: false }
    );
  } catch {
    // best effort.
  }
  return { ok: true };
}

/**
 * POST /auth/reset-password.
 * Sirve tanto para el enlace de recuperación como para el de activación;
 * el backend decide el flujo según el tipo de token.
 */
export async function resetPassword({ token, password }) {
  const data = await api.post(
    "/auth/reset-password",
    {
      token: String(token ?? "").trim(),
      contrasena: password,
    },
    { auth: false }
  );
  return data;
}

/** POST /auth/logout -> el JWT es stateless; se limpia la sesión local. */
export async function logout() {
  try {
    if (getToken()) {
      await api.post("/auth/logout");
    }
  } finally {
    clearSession();
  }
}
