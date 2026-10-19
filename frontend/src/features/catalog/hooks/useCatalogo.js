// src/features/catalog/hooks/useCatalogo.js
//
// Catálogo de la tienda contra el API real (/api/catalogo). Trae en paralelo
// productos, categorías y presentaciones (las presentaciones definen el
// precio mínimo que muestran las tarjetas).

import { useEffect, useState } from 'react';

import * as catalogService from '../services/catalogService';
import { minPrecio } from '../services/catalogMappers';

export default function useCatalogo({ autoLoad = true } = {}) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([{ value: 'todas', label: 'Todas' }]);
  const [presentaciones, setPresentaciones] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    Promise.all([
      catalogService.listarProductos(),
      catalogService.listarCategorias(),
      catalogService.listarPresentaciones(),
    ])
      .then(([listaProductos, listaCategorias, listaPresentaciones]) => {
        if (!activo) return;
        setProductos(listaProductos);
        setCategorias(listaCategorias);
        setPresentaciones(listaPresentaciones);
        setError('');
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudo cargar el catálogo.');
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [autoLoad, reloadToken]);

  function reload() {
    setLoading(true);
    setError('');
    setReloadToken((valor) => valor + 1);
  }

  return {
    productos,
    categorias,
    presentaciones,
    minPrice: minPrecio(presentaciones),
    loading,
    error,
    reload,
  };
}
