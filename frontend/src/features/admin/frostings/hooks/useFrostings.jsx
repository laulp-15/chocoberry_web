// src/features/admin/frostings/hooks/useFrostings.jsx
//
// Gestión de glaseados (nombre, color y estado) contra el API real
// (/api/glaseados). El estado vive aquí; las llamadas HTTP, en
// services/frostingService.js.

import { useEffect, useState } from 'react';

import * as frostingService from '../services/frostingService';

/** El backend lista alfabéticamente; se mantiene ese orden al crear o editar. */
function ordenarPorNombre(lista) {
  return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export const useFrostings = ({ autoLoad = true } = {}) => {
  const [frostings, setFrostings] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedFrosting, setSelectedFrosting] = useState(null);
  const [frostingToEdit, setFrostingToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    frostingService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setFrostings(ordenarPorNombre(lista));
        setError('');
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudieron cargar los glaseados.');
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

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredFrostings = frostings.filter(
    (frosting) =>
      statusFilter === 'todos' ||
      frosting.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  /** Activa/desactiva un glaseado contra el API y refleja la respuesta. */
  async function handleToggleStatus(id) {
    const actual = frostings.find((frosting) => frosting.id === id);
    if (!actual) return;

    try {
      const actualizado = await frostingService.cambiarEstado(
        id,
        actual.estado !== 'Activo'
      );
      setFrostings((prev) =>
        prev.map((frosting) =>
          frosting.id === id ? actualizado : frosting
        )
      );
      setError('');
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar el estado del glaseado.');
    }
  }

  /**
   * Crea o edita. Devuelve el glaseado guardado y relanza los errores para
   * que el modal los muestre sin cerrarse.
   */
  async function handleSaveFrosting(datos) {
    setSubmitting(true);
    try {
      if (frostingToEdit) {
        const actualizado = await frostingService.actualizar(
          frostingToEdit.id,
          datos
        );
        setFrostings((prev) =>
          ordenarPorNombre(
            prev.map((frosting) =>
              frosting.id === actualizado.id ? actualizado : frosting
            )
          )
        );
        setFrostingToEdit(null);
        return actualizado;
      }

      const creado = await frostingService.crear(datos);
      setFrostings((prev) => ordenarPorNombre([creado, ...prev]));
      return creado;
    } finally {
      setSubmitting(false);
    }
  }

  /** Elimina; si el backend responde 409, el error se propaga a la página. */
  async function handleConfirmDelete() {
    if (!selectedFrosting) return;

    try {
      await frostingService.eliminar(selectedFrosting.id);
      setFrostings((prev) =>
        prev.filter((frosting) => frosting.id !== selectedFrosting.id)
      );
    } finally {
      setIsDeleteOpen(false);
      setSelectedFrosting(null);
    }
  }

  // Apertura de modales
  const handleOpenCreate = () => {
    setFrostingToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (frosting) => {
    setFrostingToEdit(frosting);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (frosting) => {
    setSelectedFrosting(frosting);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (frosting) => {
    setSelectedFrosting(frosting);
    setIsDeleteOpen(true);
  };

  return {
    statusFilter,
    setStatusFilter,

    isModalOpen,
    setIsModalOpen,
    isDetailOpen,
    setIsDetailOpen,
    isDeleteOpen,
    setIsDeleteOpen,

    selectedFrosting,
    frostingToEdit,
    filteredFrostings,

    loading,
    submitting,
    error,
    reload,

    handleToggleStatus,
    handleSaveFrosting,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
