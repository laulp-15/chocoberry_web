// src/shared/api/client.js
// Cliente HTTP único del frontend. Habla con la API real, adjunta el token
// y normaliza las respuestas y los errores.
//
// La URL base sale de VITE_API_URL (ver .env / .env.example); si no está
// definida, se usa el backend local por defecto.

import { getToken } from "./session";

const DEFAULT_API_URL = "http://localhost:4000/api";

export const API_URL = (
  import.meta.env?.VITE_API_URL || DEFAULT_API_URL
).replace(/\/+$/, "");

/**
 * Error de la API. Conserva el status HTTP, el `code` de negocio del
 * backend y, si los hay, los errores de validación por campo.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = null, errors = null, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.data = data;
  }
}

/** Construye el mensaje a mostrar a partir de la respuesta del backend. */
function construirMensaje(parsed, status) {
  if (status === 422 && Array.isArray(parsed?.errors) && parsed.errors.length) {
    const detalles = parsed.errors
      .map((error) => error?.mensaje)
      .filter(Boolean)
      .join(" ");
    if (detalles) return detalles;
  }
  return parsed?.message || "Ocurrió un error inesperado.";
}

async function request(path, { method = "GET", body, auth = true, headers } = {}) {
  const finalHeaders = { Accept: "application/json", ...headers };
  let payload;

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: payload,
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.",
      { status: 0, code: "NETWORK_ERROR" }
    );
  }

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(construirMensaje(parsed, response.status), {
      status: response.status,
      code: parsed?.code ?? null,
      errors: parsed?.errors ?? null,
      data: parsed?.data ?? null,
    });
  }

  // El backend responde siempre { success, message, data }.
  return parsed?.data ?? null;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  del: (path, options) => request(path, { ...options, method: "DELETE" }),
};
