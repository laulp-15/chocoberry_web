// src/features/admin/users/services/userMappers.js
//
// Traduce entre el contrato del backend (/api/usuarios) y la forma que usa
// el panel de administración. Es el ÚNICO punto donde se traducen nombres:
//
//   backend -> frontend   correo -> email, rol.slug -> role,
//                          estado -> active, fechaRegistro -> createdAt
//   frontend -> backend   email -> correo, docType -> tipoDocumento, ...
//
// Mismo patrón que features/login/services/mappers.js.

// -----------------------------------------------------------------------------
// USUARIO DE LA API -> USUARIO DEL PANEL
// -----------------------------------------------------------------------------

export function mapUsuarioAdmin(usuario) {
  if (!usuario) return null;

  const nombres = usuario.nombres ?? "";
  const apellidos = usuario.apellidos ?? "";

  return {
    id: usuario.id,
    nombres,
    apellidos,
    fullName: usuario.nombreCompleto || `${nombres} ${apellidos}`.trim(),
    docType: usuario.tipoDocumento ?? "",
    idNumber: usuario.numeroDocumento ?? "",
    email: usuario.correo ?? "",
    phone: usuario.telefono ?? "",
    address: usuario.direccion ?? "",
    neighborhood: usuario.barrio ?? "",
    // El slug del rol coincide con el que usa el front:
    // administrador / repartidor / cliente.
    role: usuario.rol?.slug ?? "",
    active: usuario.estado !== false,
    createdAt: usuario.fechaRegistro ?? null,
  };
}

export function mapUsuariosAdmin(usuarios) {
  return Array.isArray(usuarios) ? usuarios.map(mapUsuarioAdmin) : [];
}

// -----------------------------------------------------------------------------
// FORMULARIO DEL PANEL -> CUERPO DE LA API
// -----------------------------------------------------------------------------

/** Campos comunes a crear y editar (los que el backend acepta siempre). */
function camposBase(datos = {}) {
  return {
    nombres: String(datos.nombres ?? "").trim(),
    apellidos: String(datos.apellidos ?? "").trim(),
    tipoDocumento: datos.docType,
    numeroDocumento: String(datos.idNumber ?? "").trim(),
    correo: String(datos.email ?? "").trim().toLowerCase(),
    telefono: String(datos.phone ?? "").trim(),
    direccion: String(datos.address ?? "").trim(),
    barrio: String(datos.neighborhood ?? "").trim(),
    rol: datos.role,
  };
}

/**
 * POST /usuarios: el backend genera la contraseña temporal y envía el
 * correo de activación, por eso el panel no la solicita.
 */
export function toCrearUsuarioPayload(datos = {}) {
  return {
    ...camposBase(datos),
    estado: datos.active !== false,
  };
}

/**
 * PUT /usuarios/:id. Si la contraseña viene vacía NO se envía, para que el
 * backend conserve la actual (la regla de edición del formulario).
 */
export function toActualizarUsuarioPayload(datos = {}) {
  const payload = camposBase(datos);
  if (datos.password) payload.contrasena = datos.password;
  return payload;
}

// -----------------------------------------------------------------------------
// ERRORES DE LA API -> ERRORES DEL PANEL
// -----------------------------------------------------------------------------

/**
 * En crear/editar, un 409 puede ser por correo o por número de documento.
 * Se marca con el código correspondiente para que el modal muestre el error
 * debajo del campo correcto.
 */
export function mapGuardarError(error) {
  if (error?.status !== 409) return error;

  if (error.code === "DOCUMENT_TAKEN") {
    const mapped = new Error(
      error.message || "Ya existe otro usuario registrado con ese número de documento."
    );
    mapped.code = "DOCUMENT_TAKEN";
    return mapped;
  }

  if (error.code === "EMAIL_TAKEN" || error.code === "CONFLICT") {
    const mapped = new Error(
      error.message || "Ya existe otro usuario registrado con ese correo."
    );
    mapped.code = "EMAIL_TAKEN";
    return mapped;
  }

  // Por ejemplo DUPLICATE_ENTRY sin campo identificable: se muestra como
  // error general del formulario en lugar de señalar el campo equivocado.
  return error;
}
