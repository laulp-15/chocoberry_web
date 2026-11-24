// src/features/admin/municipalities/hooks/useMunicipalities.jsx
//
// Gestión de municipios (nombre, costo de envío y estado) contra el API real
// (/api/municipios). El estado vive aquí; las llamadas HTTP, en
// services/municipalityService.js.

import { useEffect, useState } from 'react';

import useDebouncedValue from '../../../../shared/hooks/useDebouncedValue';
import * as municipalityService from '../services/municipalityService';

const PAGE_SIZE = 10;

export const useMunicipalities = ({ autoLoad = true } = {}) => {
  const [municipalities, setMunicipalities] = useState([]);

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

  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [municipalityToEdit, setMunicipalityToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;
    const nombre = debouncedSearch.trim() || undefined;
    const estado = statusFilter === 'todos' ? undefined : statusFilter;

    municipalityService
      .listar({ page, limit: PAGE_SIZE, nombre, estado })
      .then((respuesta) => {
        if (!activo) return;
        setMunicipalities(respuesta.data);
        setMeta(respuesta.meta);
        setError('');

        if (page > respuesta.meta.totalPages) {
          setPage(respuesta.meta.totalPages);
        }
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudieron cargar los municipios.');
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

  const currentMunicipalities = municipalities;

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  /** Activa/desactiva un municipio contra el API y recarga el listado. */
  async function handleToggleStatus(id) {
    const actual = municipalities.find((municipality) => municipality.id === id);
    if (!actual) return;

    try {
      await municipalityService.cambiarEstado(id, actual.estado !== 'Activo');
      setError('');
      reload();
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar el estado del municipio.');
    }
  }

  /**
   * Crea o edita. Devuelve el municipio guardado y relanza los errores para
   * que el modal los muestre sin cerrarse.
   */
  async function handleSaveMunicipality(datos) {
    setSubmitting(true);
    try {
      if (municipalityToEdit) {
        const actualizado = await municipalityService.actualizar(
          municipalityToEdit.id,
          datos
        );
        setMunicipalityToEdit(null);
        reload();
        return actualizado;
      }

      const creado = await municipalityService.crear(datos);
      setPage(1);
      reload();
      return creado;
    } finally {
      setSubmitting(false);
    }
  }

  /** Elimina; si el backend responde 409, el error se propaga a la página. */
  async function handleConfirmDelete() {
    if (!selectedMunicipality) return;

    try {
      await municipalityService.eliminar(selectedMunicipality.id);
      reload();
    } finally {
      setIsDeleteOpen(false);
      setSelectedMunicipality(null);
    }
  }

  // Apertura de modales
  const handleOpenCreate = () => {
    setMunicipalityToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (municipality) => {
    setMunicipalityToEdit(municipality);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (municipality) => {
    setSelectedMunicipality(municipality);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (municipality) => {
    setSelectedMunicipality(municipality);
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

    selectedMunicipality,
    municipalityToEdit,
    currentMunicipalities,

    loading,
    submitting,
    error,
    reload,

    handleToggleStatus,
    handleSaveMunicipality,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
