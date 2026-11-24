// src/features/admin/presentations/hooks/usePresentations.jsx
//
// Gestión de presentaciones (cantidad de fresas y precio) contra el API real
// (/api/presentaciones). El estado vive aquí; las llamadas HTTP, en
// services/presentationService.js.

import { useEffect, useState } from 'react';

import useDebouncedValue from '../../../../shared/hooks/useDebouncedValue';
import * as presentationService from '../services/presentationService';

const PAGE_SIZE = 10;

export const usePresentations = ({ autoLoad = true } = {}) => {
  const [presentations, setPresentations] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [presentationToEdit, setPresentationToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;
    const buscar = debouncedSearch.trim() || undefined;
    const estado = statusFilter === 'todos' ? undefined : statusFilter;

    presentationService
      .listar({ page, limit: PAGE_SIZE, buscar, estado })
      .then((respuesta) => {
        if (!activo) return;
        setPresentations(respuesta.data);
        setMeta(respuesta.meta);
        setError('');

        if (page > respuesta.meta.totalPages) {
          setPage(respuesta.meta.totalPages);
        }
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
  }, [autoLoad, reloadToken, page, debouncedSearch, statusFilter]);

  function reload() {
    setLoading(true);
    setError('');
    setReloadToken((valor) => valor + 1);
  }

  const currentPresentations = presentations;

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  /** Activa/desactiva una presentación contra el API y recarga el listado. */
  async function handleToggleStatus(id) {
    const actual = presentations.find(
      (presentation) => presentation.id === id
    );
    if (!actual) return;

    try {
      await presentationService.cambiarEstado(
        id,
        actual.estado !== 'Activo'
      );
      setError('');
      reload();
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
        setPresentationToEdit(null);
        reload();
        return actualizada;
      }

      const creada = await presentationService.crear(datos);
      setPage(1);
      reload();
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
      reload();
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
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    page,
    setPage,
    meta,

    isModalOpen,
    setIsModalOpen,
    isDetailOpen,
    setIsDetailOpen,
    isDeleteOpen,
    setIsDeleteOpen,

    selectedPresentation,
    presentationToEdit,
    currentPresentations,

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
