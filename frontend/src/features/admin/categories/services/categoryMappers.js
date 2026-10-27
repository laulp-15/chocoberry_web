// src/features/admin/categories/services/categoryMappers.js
//
// Traduce entre el contrato del backend (/api/categorias) y la forma que usa
// el panel. El backend devuelve `estado` como booleano; la tabla y los toggles
// del panel siguen trabajando con "Activo"/"Inactivo".

export function mapCategoriaAdmin(categoria) {
  if (!categoria) return null;

  return {
    id: categoria.id,
    nombre: categoria.nombre ?? '',
    estado: categoria.estado ? 'Activo' : 'Inactivo',
  };
}

export function mapCategoriasAdmin(categorias) {
  return Array.isArray(categorias) ? categorias.map(mapCategoriaAdmin) : [];
}

function aBooleanoEstado(estado) {
  if (typeof estado === 'boolean') return estado;
  return String(estado ?? '').toLowerCase() === 'activo';
}

export function toCrearCategoriaPayload(datos = {}) {
  return {
    nombre: String(datos.nombre ?? '').trim(),
    estado: aBooleanoEstado(datos.estado ?? 'Activo'),
  };
}

export function toActualizarCategoriaPayload(datos = {}) {
  return {
    nombre: String(datos.nombre ?? '').trim(),
  };
}

/** Un 409 significa nombre repetido: se marca para mostrarlo bajo el campo. */
export function mapGuardarError(error) {
  if (error?.status === 409) {
    const mapped = new Error(
      error.message || 'Ya existe una categoría con ese nombre.'
    );
    mapped.code = 'NAME_TAKEN';
    return mapped;
  }
  return error;
}
