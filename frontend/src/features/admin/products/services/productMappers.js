// src/features/admin/products/services/productMappers.js
//
// Traduce entre el contrato del backend (/api/productos) y la forma que usa
// el panel. El backend devuelve `categoria: { id, nombre }`; el panel trabaja
// con `categoriaId` / `categoriaNombre` y con el estado como "Activo"/"Inactivo"
// (que es lo que ya esperan la tabla y los toggles del panel).

export function mapProductoAdmin(producto) {
  if (!producto) return null;

  return {
    id: producto.id,
    nombre: producto.nombre ?? "",
    descripcion: producto.descripcion ?? "",
    imagen: producto.imagen ?? "",
    estado: producto.estado ? "Activo" : "Inactivo",
    categoriaId: producto.categoria?.id ?? "",
    categoriaNombre: producto.categoria?.nombre ?? "",
  };
}

export function mapProductosAdmin(productos) {
  return Array.isArray(productos) ? productos.map(mapProductoAdmin) : [];
}

/** Alta: multipart con la foto (el backend la guarda y devuelve su ruta). */
export function toCrearProductoPayload(datos = {}) {
  const formData = new FormData();
  formData.append("nombre", String(datos.nombre ?? "").trim());
  formData.append("descripcion", String(datos.descripcion ?? "").trim());
  formData.append("idCategoria", String(datos.categoriaId ?? ""));
  formData.append("estado", "true");

  if (datos.imagenFile instanceof File) {
    formData.append("imagen", datos.imagenFile);
  }

  return formData;
}

/**
 * Edición: la imagen solo se envía si hay una nueva o si el usuario la quitó.
 * Si no se envía, el backend conserva la actual.
 */
export function toActualizarProductoPayload(datos = {}) {
  const formData = new FormData();
  formData.append("nombre", String(datos.nombre ?? "").trim());
  formData.append("descripcion", String(datos.descripcion ?? "").trim());
  formData.append("idCategoria", String(datos.categoriaId ?? ""));

  if (datos.imagenFile instanceof File) {
    formData.append("imagen", datos.imagenFile);
  } else if (datos.quitarImagen) {
    // Cadena vacía = borrar la imagen (el backend la guarda como NULL).
    formData.append("imagen", "");
  }

  return formData;
}

/** Un 409 significa nombre repetido: se marca para mostrarlo bajo el campo. */
export function mapGuardarError(error) {
  if (error?.status === 409) {
    const mapped = new Error(
      error.message || "Ya existe un producto con ese nombre."
    );
    mapped.code = "NAME_TAKEN";
    return mapped;
  }
  return error;
}
