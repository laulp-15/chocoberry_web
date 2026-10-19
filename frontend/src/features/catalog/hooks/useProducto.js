// src/features/catalog/hooks/useProducto.js
//
// Detalle de un producto de la tienda contra el API real. Además del producto
// trae la lista completa (para armar "También te podría gustar" priorizando la
// misma categoría) y las presentaciones (cantidad de fresas -> precio).
//
// `cargando` se deriva del id solicitado: si el usuario navega a otro producto,
// la vista no muestra los datos del anterior mientras llega la respuesta.

import { useEffect, useState } from 'react';

import * as catalogService from '../services/catalogService';

const ESTADO_INICIAL = {
  id: null,
  producto: null,
  relacionados: [],
  presentaciones: [],
};

export default function useProducto(id) {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) return undefined;

    let activo = true;

    Promise.all([
      catalogService.obtenerProducto(id),
      catalogService.listarProductos(),
      catalogService.listarPresentaciones(),
    ])
      .then(([producto, lista, presentaciones]) => {
        if (!activo) return;

        const otros = lista.filter((item) => String(item.id) !== String(producto.id));
        const relacionados = [
          ...otros.filter((item) => item.cat === producto.cat),
          ...otros.filter((item) => item.cat !== producto.cat),
        ].slice(0, 4);

        setEstado({
          id: String(id),
          producto,
          relacionados,
          presentaciones,
        });
        setError('');
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudo cargar el producto.');
      });

    return () => {
      activo = false;
    };
  }, [id, reloadToken]);

  function reload() {
    setError('');
    setReloadToken((valor) => valor + 1);
  }

  const cargando = !estado.producto || estado.id !== String(id);

  return {
    producto: estado.producto,
    relacionados: estado.relacionados,
    presentaciones: estado.presentaciones,
    loading: cargando,
    error,
    reload,
  };
}
