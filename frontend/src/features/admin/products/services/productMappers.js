// src/features/admin/products/services/productMappers.js
//
// Traduce entre el contrato del backend (/api/productos) y la forma que usa
// el panel. El backend devuelve `categoria: { id, nombre }`; el panel trabaja
// con `categoriaId` / `categoriaNombre` y con el estado como "Activo"/"Inactivo"
// (que es lo que ya esperan la tabla y los toggles del panel).

export function mapProductoAdmin(producto) {
  if (!producto) return null;

  const imagenes = Array.isArray(producto.imagenes)
    ? producto.imagenes.map((imagen) => ({
        id: imagen.id,
        url: imagen.url,
        orden: imagen.orden,
      }))
    : [];

  return {
    id: producto.id,
    nombre: producto.nombre ?? "",
    descripcion: producto.descripcion ?? "",
    imagen: producto.imagen ?? "",
    imagenes,
    estado: producto.estado ? "Activo" : "Inactivo",
    categoriaId: producto.categoria?.id ?? "",
    categoriaNombre: producto.categoria?.nombre ?? "",
  };
}

export function mapProductosAdmin(productos) {
  return Array.isArray(productos) ? productos.map(mapProductoAdmin) : [];
}

/**
 * Agrega las imágenes al FormData. `imagenes` es la lista final en orden:
 * - { tipo: "existente", url }
 * - { tipo: "nueva", file }
 * Los archivos nuevos van en el campo "imagenes" y el orden final en
 * "ordenImagenes", usando tokens "nueva:N" para referenciarlos.
 */
function appendImagenes(formData, datos) {
  if (!Array.isArray(datos.imagenes)) return;

  let indiceNueva = 0;
  const orden = datos.imagenes
    .map((imagen) => {
      if (imagen?.tipo === "nueva" && imagen.file instanceof File) {
        const token = `nueva:${indiceNueva}`;
        formData.append("imagenes", imagen.file);
        indiceNueva += 1;
        return token;
      }
      return imagen?.url ?? "";
    })
    .filter(Boolean);

  formData.append("ordenImagenes", JSON.stringify(orden));
}

/** Alta: multipart con una o varias fotos (el backend las guarda). */
export function toCrearProductoPayload(datos = {}) {
  const formData = new FormData();
  formData.append("nombre", String(datos.nombre ?? "").trim());
  formData.append("descripcion", String(datos.descripcion ?? "").trim());
  formData.append("idCategoria", String(datos.categoriaId ?? ""));
  formData.append("estado", "true");

  appendImagenes(formData, datos);

  // Compatibilidad con el flujo anterior de una sola imagen.
  if (!Array.isArray(datos.imagenes) && datos.imagenFile instanceof File) {
    formData.append("imagenes", datos.imagenFile);
  }

  return formData;
}

/**
 * Edición: se envía la lista final de imágenes (existentes y nuevas en orden).
 * Si no se envía `imagenes`, el backend conserva las actuales.
 */
export function toActualizarProductoPayload(datos = {}) {
  const formData = new FormData();
  formData.append("nombre", String(datos.nombre ?? "").trim());
  formData.append("descripcion", String(datos.descripcion ?? "").trim());
  formData.append("idCategoria", String(datos.categoriaId ?? ""));

  appendImagenes(formData, datos);

  if (!Array.isArray(datos.imagenes) && datos.imagenFile instanceof File) {
    formData.append("imagenes", datos.imagenFile);
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
