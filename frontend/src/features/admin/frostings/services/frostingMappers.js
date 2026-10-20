// src/features/admin/frostings/services/frostingMappers.js
//
// Traduce entre el contrato del backend (/api/glaseados) y la forma que usa
// el panel. La API devuelve `codigoHex` y `estado` booleano; la tabla y los
// modales siguen trabajando con `hex` y "Activo"/"Inactivo".

export function mapFrostingAdmin(glaseado) {
  if (!glaseado) return null;

  return {
    id: glaseado.id,
    nombre: glaseado.nombre ?? '',
    hex: glaseado.codigoHex ?? '',
    estado: glaseado.estado ? 'Activo' : 'Inactivo',
  };
}

export function mapFrostingsAdmin(glaseados) {
  return Array.isArray(glaseados) ? glaseados.map(mapFrostingAdmin) : [];
}

function aBooleanoEstado(estado) {
  if (typeof estado === 'boolean') return estado;
  return String(estado ?? '').toLowerCase() === 'activo';
}

export function toCrearFrostingPayload(datos = {}) {
  return {
    nombre: String(datos.nombre ?? '').trim(),
    // El backend normaliza igualmente, pero se envía ya en #RRGGBB.
    codigoHex: String(datos.hex ?? '').trim().toUpperCase(),
    estado: aBooleanoEstado(datos.estado ?? 'Activo'),
  };
}

export function toActualizarFrostingPayload(datos = {}) {
  return toCrearFrostingPayload(datos);
}

/** Un 409 significa nombre repetido: se marca para mostrarlo bajo el campo. */
export function mapGuardarError(error) {
  if (error?.status === 409) {
    const mapped = new Error(
      error.message || 'Ya existe un glaseado con ese nombre.'
    );
    mapped.code = 'NAME_TAKEN';
    return mapped;
  }
  return error;
}
