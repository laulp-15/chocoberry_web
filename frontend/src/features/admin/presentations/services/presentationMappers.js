// src/features/admin/presentations/services/presentationMappers.js
//
// Traduce entre el contrato del backend (/api/presentaciones) y la forma que
// usa el panel. La API ya devuelve `cantidadFresas` y `precio` numéricos; el
// estado booleano se convierte a "Activo"/"Inactivo" para la tabla y toggles.

export function mapPresentacionAdmin(presentacion) {
  if (!presentacion) return null;

  return {
    id: presentacion.id,
    cantidadFresas: Number(presentacion.cantidadFresas ?? 0),
    precio: Number(presentacion.precio ?? 0),
    estado: presentacion.estado ? 'Activo' : 'Inactivo',
  };
}

export function mapPresentacionesAdmin(presentaciones) {
  return Array.isArray(presentaciones)
    ? presentaciones.map(mapPresentacionAdmin)
    : [];
}

function aBooleanoEstado(estado) {
  if (typeof estado === 'boolean') return estado;
  return String(estado ?? '').toLowerCase() === 'activo';
}

export function toCrearPresentacionPayload(datos = {}) {
  return {
    cantidadFresas: Number(datos.cantidadFresas),
    precio: Number(datos.precio),
    estado: aBooleanoEstado(datos.estado ?? 'Activo'),
  };
}

export function toActualizarPresentacionPayload(datos = {}) {
  return toCrearPresentacionPayload(datos);
}

/**
 * Un 409 puede significar dos cosas: cantidad de fresas repetida (al crear o
 * editar) o presentación usada en pedidos (al eliminar). En el primer caso se
 * marca para mostrarlo bajo el campo; en el segundo, el mensaje se muestra
 * como aviso general.
 */
export function mapGuardarError(error) {
  if (error?.status === 409 && /presentaci[oó]n de \d+/i.test(error.message || '')) {
    const mapped = new Error(error.message);
    mapped.code = 'QUANTITY_TAKEN';
    return mapped;
  }
  return error;
}
