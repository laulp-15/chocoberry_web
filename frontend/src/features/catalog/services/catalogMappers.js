// src/features/catalog/services/catalogMappers.js
//
// Traduce el catálogo público del backend (/api/catalogo) a la forma que usan
// las páginas de la tienda: nombres cortos (`name`, `desc`, `image`) y la
// categoría como id en texto, que es lo que consumen los chips de filtro.

import { imageUrl } from '../../../shared/utils/imageUrl';

export function mapProducto(producto) {
  if (!producto) return null;

  return {
    id: producto.id,
    name: producto.nombre ?? '',
    cat:
      producto.categoria?.id !== undefined && producto.categoria?.id !== null
        ? String(producto.categoria.id)
        : '',
    catLabel: producto.categoria?.nombre ?? '',
    desc: producto.descripcion ?? '',
    image: imageUrl(producto.imagen),
  };
}

export function mapProductos(productos) {
  return Array.isArray(productos) ? productos.map(mapProducto) : [];
}

/** Categorías para los chips: se antepone "Todas". */
export function mapCategorias(categorias) {
  const lista = Array.isArray(categorias) ? categorias : [];
  return [
    { value: 'todas', label: 'Todas' },
    ...lista.map((categoria) => ({
      value: String(categoria.id),
      label: categoria.nombre,
    })),
  ];
}

/** Presentaciones como tabla cantidad -> precio, ordenada de menor a mayor. */
export function mapPresentaciones(presentaciones) {
  const lista = Array.isArray(presentaciones) ? presentaciones : [];
  return lista
    .map((presentacion) => ({
      id: presentacion.id,
      cantidadFresas: Number(presentacion.cantidadFresas),
      precio: Number(presentacion.precio),
    }))
    .sort((a, b) => a.cantidadFresas - b.cantidadFresas);
}

/** Municipios activos para el checkout (id + costo de domicilio vigente). */
export function mapMunicipios(municipios) {
  const lista = Array.isArray(municipios) ? municipios : [];
  return lista.map((municipio) => ({
    id: municipio.id,
    nombre: municipio.nombre ?? '',
    precioDomicilio: Number(municipio.precioDomicilio ?? 0),
  }));
}

/** Glaseados activos con la forma que consume el selector de colores. */
export function mapGlaseados(glaseados) {
  const lista = Array.isArray(glaseados) ? glaseados : [];
  return lista.map((glaseado) => ({
    id: glaseado.id,
    value: String(glaseado.id),
    label: glaseado.nombre ?? '',
    nombre: glaseado.nombre ?? '',
    hex: glaseado.codigoHex ?? '#d90429',
  }));
}

/** Menor precio disponible, para el "Desde $..." de las tarjetas. */
export function minPrecio(presentaciones) {
  if (!presentaciones.length) return 0;
  return Math.min(...presentaciones.map((presentacion) => presentacion.precio));
}
