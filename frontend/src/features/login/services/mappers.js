// src/features/login/services/mappers.js
// Traduce entre el contrato del backend y la forma que esperan las páginas
// del frontend. Es el ÚNICO punto donde se traducen los nombres:
//
//   backend -> frontend   correo -> email, nombreCompleto -> fullName,
//                          rol.slug -> role, cantidades de campos, etc.
//   frontend -> backend   email -> correo, docType -> tipoDocumento, ...
//
// Además adapta los errores del backend a los `code` que ya usan las
// páginas (LOCKED, INVALID_CREDENTIALS, EMAIL_TAKEN, ...).

// -----------------------------------------------------------------------------
// USUARIO DE LA API -> USUARIO DE SESIÓN
// -----------------------------------------------------------------------------

export function mapUsuarioToSession(usuario) {
  if (!usuario) return null;

  const nombres = usuario.nombres ?? "";
  const apellidos = usuario.apellidos ?? "";

  return {
    id: usuario.id,
    nombres,
    apellidos,
    fullName:
      usuario.nombreCompleto || `${nombres} ${apellidos}`.trim(),
    email: usuario.correo ?? "",
    // El slug del rol coincide con el que usa el front:
    // administrador / repartidor / cliente.
    role: usuario.rol?.slug ?? "",
    phone: usuario.telefono ?? "",
    address: usuario.direccion ?? "",
    neighborhood: usuario.barrio ?? "",
    docType: usuario.tipoDocumento ?? "",
    idNumber: usuario.numeroDocumento ?? "",
    active: usuario.estado !== false,
  };
}

// -----------------------------------------------------------------------------
// FORMULARIO DEL FRONTEND -> CUERPO DE LA API
// -----------------------------------------------------------------------------

export function toLoginPayload({ email, password }) {
  return {
    correo: String(email ?? "").trim().toLowerCase(),
    contrasena: password,
  };
}

export function toRegisterPayload(datos = {}) {
  return {
    nombres: String(datos.nombres ?? "").trim(),
    apellidos: String(datos.apellidos ?? "").trim(),
    tipoDocumento: datos.docType,
    numeroDocumento: String(datos.idNumber ?? "").trim(),
    correo: String(datos.email ?? "").trim().toLowerCase(),
    contrasena: datos.password,
    telefono: String(datos.phone ?? "").trim(),
    direccion: String(datos.address ?? "").trim(),
    barrio: String(datos.neighborhood ?? "").trim(),
  };
}

/**
 * El perfil puede venir con nombres/apellidos, con firstName/lastName o
 * solo con fullName. Se acepta cualquiera de las tres formas y se envían
 * únicamente los campos presentes (el backend permite actualizaciones
 * parciales del propio perfil).
 */
export function toProfilePayload(updates = {}) {
  const payload = {};

  let nombres = updates.nombres ?? updates.firstName;
  let apellidos = updates.apellidos ?? updates.lastName;

  if ((nombres === undefined || apellidos === undefined) && updates.fullName) {
    const partes = String(updates.fullName).trim().split(/\s+/);
    if (nombres === undefined) nombres = partes.shift() ?? "";
    if (apellidos === undefined) apellidos = partes.join(" ");
  }

  if (nombres !== undefined) payload.nombres = String(nombres).trim();
  if (apellidos !== undefined) payload.apellidos = String(apellidos).trim();
  if (updates.docType !== undefined) payload.tipoDocumento = updates.docType;
  if (updates.idNumber !== undefined) {
    payload.numeroDocumento = String(updates.idNumber).trim();
  }
  if (updates.email !== undefined) {
    payload.correo = String(updates.email).trim().toLowerCase();
  }
  if (updates.phone !== undefined) payload.telefono = String(updates.phone).trim();
  if (updates.address !== undefined) {
    payload.direccion = String(updates.address).trim();
  }
  if (updates.neighborhood !== undefined) {
    payload.barrio = String(updates.neighborhood).trim();
  }

  return payload;
}

// -----------------------------------------------------------------------------
// ERRORES DE LA API -> ERRORES DEL FRONTEND
// -----------------------------------------------------------------------------

/** Crea un Error con el `code` y los campos extra que esperan las páginas. */
function errorConCodigo(error, code, extra = {}) {
  const mapped = new Error(error?.message || "Ocurrió un error inesperado.");
  mapped.code = code;
  Object.assign(mapped, extra);
  return mapped;
}

export function mapLoginError(error) {
  if (!(error instanceof Error)) return error;

  // 429: bloqueo temporal por intentos fallidos.
  // El backend puede enviar `errors` como array u objeto; se leen ambas formas.
  if (error.status === 429) {
    const segundos =
      error.errors?.[0]?.segundosRestantes ??
      error.errors?.segundosRestantes ??
      30;
    return errorConCodigo(error, "LOCKED", { secondsLeft: segundos });
  }

  // 401: credenciales incorrectas (el backend añade los intentos restantes).
  if (error.status === 401) {
    const restantes =
      error.errors?.[0]?.intentosRestantes ??
      error.errors?.intentosRestantes;
    return errorConCodigo(error, "INVALID_CREDENTIALS", {
      attemptsLeft: restantes,
    });
  }

  // 403 en el login: la cuenta está deshabilitada.
  if (error.status === 403) {
    return errorConCodigo(error, "USER_DISABLED");
  }

  return error;
}

export function mapRegisterError(error) {
  if (!(error instanceof Error)) return error;

  // 409: ya existe una cuenta con ese correo.
  if (error.status === 409) {
    return errorConCodigo(error, "EMAIL_TAKEN");
  }

  return error;
}

export function mapChangePasswordError(error) {
  if (!(error instanceof Error)) return error;

  // 401: la contraseña actual no coincide.
  if (error.status === 401) {
    return errorConCodigo(error, "INVALID_CURRENT_PASSWORD");
  }

  return error;
}

export function mapProfileError(error) {
  if (!(error instanceof Error)) return error;

  // 409: el correo nuevo ya está en uso por otra cuenta.
  if (error.status === 409) {
    return errorConCodigo(error, "EMAIL_TAKEN");
  }

  return error;
}
