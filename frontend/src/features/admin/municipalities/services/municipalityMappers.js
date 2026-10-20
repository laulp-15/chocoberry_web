// src/features/admin/municipalities/services/municipalityMappers.js
//
// Traduce entre el contrato del backend (/api/municipios) y la forma que usa
// el panel. La API devuelve `precioDomicilio` numérico y `estado` booleano;
// la tabla y los modales siguen trabajando con `costoEnvio` y "Activo"/"Inactivo".

export function mapMunicipioAdmin(municipio) {
  if (!municipio) return null;

  return {
    id: municipio.id,
    nombre: municipio.nombre ?? '',
    costoEnvio: Number(municipio.precioDomicilio ?? 0),
    estado: municipio.estado ? 'Activo' : 'Inactivo',
  };
}

export function mapMunicipiosAdmin(municipios) {
  return Array.isArray(municipios) ? municipios.map(mapMunicipioAdmin) : [];
}

function aBooleanoEstado(estado) {
  if (typeof estado === 'boolean') return estado;
  return String(estado ?? '').toLowerCase() === 'activo';
}

export function toCrearMunicipioPayload(datos = {}) {
  return {
    nombre: String(datos.nombre ?? '').trim(),
    precioDomicilio: Number(datos.costoEnvio),
    estado: aBooleanoEstado(datos.estado ?? 'Activo'),
  };
}

export function toActualizarMunicipioPayload(datos = {}) {
  return toCrearMunicipioPayload(datos);
}

/** Un 409 significa nombre repetido: se marca para mostrarlo bajo el campo. */
export function mapGuardarError(error) {
  if (error?.status === 409) {
    const mapped = new Error(
      error.message || 'Ya existe un municipio con ese nombre.'
    );
    mapped.code = 'NAME_TAKEN';
    return mapped;
  }
  return error;
}
