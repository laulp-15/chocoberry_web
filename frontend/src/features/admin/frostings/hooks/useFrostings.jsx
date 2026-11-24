// src/features/admin/frostings/hooks/useFrostings.jsx
//
// Gestión de glaseados (nombre, color y estado) contra el API real
// (/api/glaseados). El estado vive aquí; las llamadas HTTP, en
// services/frostingService.js.

import { useEffect, useState } from 'react';

import useDebouncedValue from '../../../../shared/hooks/useDebouncedValue';
import * as frostingService from '../services/frostingService';

const PAGE_SIZE = 10;

export const useFrostings = ({ autoLoad = true } = {}) => {
  const [frostings, setFrostings] = useState([]);

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

  const [selectedFrosting, setSelectedFrosting] = useState(null);
  const [frostingToEdit, setFrostingToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;
    const nombre = debouncedSearch.trim() || undefined;
    const estado = statusFilter === 'todos' ? undefined : statusFilter;

    frostingService
      .listar({ page, limit: PAGE_SIZE, nombre, estado })
      .then((respuesta) => {
        if (!activo) return;
        setFrostings(respuesta.data);
        setMeta(respuesta.meta);
        setError('');

        if (page > respuesta.meta.totalPages) {
          setPage(respuesta.meta.totalPages);
        }
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
  }, [autoLoad, reloadToken, page, debouncedSearch, statusFilter]);

  function reload() {
    setLoading(true);
    setError('');
    setReloadToken((valor) => valor + 1);
  }

  const currentFrostings = frostings;

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  /** Activa/desactiva un glaseado contra el API y recarga el listado. */
  async function handleToggleStatus(id) {
    const actual = frostings.find((frosting) => frosting.id === id);
    if (!actual) return;

    try {
      await frostingService.cambiarEstado(id, actual.estado !== 'Activo');
      setError('');
      reload();
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
        setFrostingToEdit(null);
        reload();
        return actualizado;
      }

      const creado = await frostingService.crear(datos);
      setPage(1);
      reload();
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
      reload();
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

    selectedFrosting,
    frostingToEdit,
    currentFrostings,

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
