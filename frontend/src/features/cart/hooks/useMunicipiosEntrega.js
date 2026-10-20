// src/features/cart/hooks/useMunicipiosEntrega.js
//
// Municipios activos para el checkout, contra el catálogo público
// (/api/catalogo/municipios). El costo de domicilio es el vigente en la BD;
// el backend lo vuelve a congelar al crear el pedido.

import { useEffect, useState } from 'react';

import * as catalogService from '../../catalog/services/catalogService';

export default function useMunicipiosEntrega({ autoLoad = true } = {}) {
  const [municipios, setMunicipios] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    catalogService
      .listarMunicipios()
      .then((lista) => {
        if (!activo) return;
        setMunicipios(lista);
        setError('');
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudieron cargar los municipios de entrega.');
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

  return { municipios, loading, error, reload };
}
