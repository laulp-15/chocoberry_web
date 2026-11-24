// src/features/admin/categories/hooks/useCategories.jsx
//
// Gestión de categorías del panel contra el API real (/api/categorias).
// El estado vive aquí; las llamadas HTTP, en services/categoryService.js.

import { useEffect, useState } from 'react';

import useDebouncedValue from '../../../../shared/hooks/useDebouncedValue';
import * as categoryService from '../services/categoryService';

const PAGE_SIZE = 10;

export const useCategories = ({ autoLoad = true } = {}) => {
  const [categorias, setCategorias] = useState([]);

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

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;
    const nombre = debouncedSearch.trim() || undefined;
    const estado = statusFilter === 'todos' ? undefined : statusFilter;

    categoryService
      .listar({ page, limit: PAGE_SIZE, nombre, estado })
      .then((respuesta) => {
        if (!activo) return;
        setCategorias(respuesta.data);
        setMeta(respuesta.meta);
        setError('');

        if (page > respuesta.meta.totalPages) {
          setPage(respuesta.meta.totalPages);
        }
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudieron cargar las categorías.');
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

  const currentCategories = categorias;

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  /** Activa/desactiva una categoría contra el API y recarga el listado. */
  async function handleToggleStatus(id) {
    const actual = categorias.find((categoria) => categoria.id === id);
    if (!actual) return;

    try {
      await categoryService.cambiarEstado(id, actual.estado !== 'Activo');
      setError('');
      reload();
    } catch (err) {
      setError(err?.message || 'No se pudo cambiar el estado de la categoría.');
    }
  }

  /**
   * Crea o edita. Devuelve la categoría guardada y relanza los errores para
   * que el modal los muestre sin cerrarse.
   */
  async function handleSaveCategory(datos) {
    setSubmitting(true);
    try {
      if (categoryToEdit) {
        const actualizada = await categoryService.actualizar(
          categoryToEdit.id,
          datos
        );
        setCategoryToEdit(null);
        reload();
        return actualizada;
      }

      const creada = await categoryService.crear(datos);
      setPage(1);
      reload();
      return creada;
    } finally {
      setSubmitting(false);
    }
  }

  /** Elimina; si el backend responde 409, el error se propaga a la página. */
  async function handleConfirmDelete() {
    if (!selectedCategory) return;

    try {
      await categoryService.eliminar(selectedCategory.id);
      reload();
    } finally {
      setIsDeleteOpen(false);
      setSelectedCategory(null);
    }
  }

  // Abrir modales
  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (categoria) => {
    setCategoryToEdit(categoria);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (categoria) => {
    setSelectedCategory(categoria);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (categoria) => {
    setSelectedCategory(categoria);
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

    selectedCategory,
    categoryToEdit,
    currentCategories,

    loading,
    submitting,
    error,
    reload,

    handleToggleStatus,
    handleSaveCategory,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
