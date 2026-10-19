// src/features/admin/presentations/hooks/usePresentations.jsx
//
// Gestión de presentaciones (cantidad de fresas y precio) contra el API real
// (/api/presentaciones). El estado vive aquí; las llamadas HTTP, en
// services/presentationService.js.

import { useEffect, useState } from 'react';

import * as presentationService from '../services/presentationService';

/** El backend lista por cantidad de fresas ascendente; se mantiene ese orden. */
function ordenarPorCantidad(lista) {
  return [...lista].sort((a, b) => a.cantidadFresas - b.cantidadFresas);
}

export const usePresentations = ({ autoLoad = true } = {}) => {
  const [presentations, setPresentations] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [presentationToEdit, setPresentationToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    presentationService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setPresentations(ordenarPorCantidad(lista));
        setError('');
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudieron cargar las presentaciones.');
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
  const filteredPresentations = presentations.filter(
    (presentation) =>
      statusFilter === 'todos' ||
      presentation.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  /** Activa/desactiva una presentación contra el API y refleja la respuesta. */
  async function handleToggleStatus(id) {
    const actual = presentations.find(
      (presentation) => presentation.id === id
    );
    if (!actual) return;

    try {
      const actualizada = await presentationService.cambiarEstado(
        id,
        actual.estado !== 'Activo'
      );
      setPresentations((prev) =>
        prev.map((presentation) =>
          presentation.id === id ? actualizada : presentation
        )
      );
      setError('');
    } catch (err) {
      setError(
        err?.message || 'No se pudo cambiar el estado de la presentación.'
      );
    }
  }

  /**
   * Crea o edita. Devuelve la presentación guardada y relanza los errores para
   * que el modal los muestre sin cerrarse.
   */
  async function handleSavePresentation(datos) {
    setSubmitting(true);
    try {
      if (presentationToEdit) {
        const actualizada = await presentationService.actualizar(
          presentationToEdit.id,
          datos
        );
        setPresentations((prev) =>
          ordenarPorCantidad(
            prev.map((presentation) =>
              presentation.id === actualizada.id ? actualizada : presentation
            )
          )
        );
        setPresentationToEdit(null);
        return actualizada;
      }

      const creada = await presentationService.crear(datos);
      setPresentations((prev) => ordenarPorCantidad([creada, ...prev]));
      return creada;
    } finally {
      setSubmitting(false);
    }
  }

  /** Elimina; si el backend responde 409, el error se propaga a la página. */
  async function handleConfirmDelete() {
    if (!selectedPresentation) return;

    try {
      await presentationService.eliminar(selectedPresentation.id);
      setPresentations((prev) =>
        prev.filter(
          (presentation) => presentation.id !== selectedPresentation.id
        )
      );
    } finally {
      setIsDeleteOpen(false);
      setSelectedPresentation(null);
    }
  }

  // Apertura de modales
  const handleOpenCreate = () => {
    setPresentationToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (presentation) => {
    setPresentationToEdit(presentation);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (presentation) => {
    setSelectedPresentation(presentation);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (presentation) => {
    setSelectedPresentation(presentation);
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

    selectedPresentation,
    presentationToEdit,
    filteredPresentations,

    loading,
    submitting,
    error,
    reload,

    handleToggleStatus,
    handleSavePresentation,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
