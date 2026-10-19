// src/features/admin/categories/hooks/useCategories.jsx
//
// Gestión de categorías del panel contra el API real (/api/categorias).
// El estado vive aquí; las llamadas HTTP, en services/categoryService.js.

import { useEffect, useState } from 'react';

import * as categoryService from '../services/categoryService';

export const useCategories = ({ autoLoad = true } = {}) => {
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    categoryService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setCategorias(lista);
        setError('');
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
  }, [autoLoad, reloadToken]);

  function reload() {
    setLoading(true);
    setError('');
    setReloadToken((valor) => valor + 1);
  }

  // Filtrado local (búsqueda por nombre + estado).
  const query = searchTerm.trim().toLowerCase();
  const filteredCategorias = categorias.filter((categoria) => {
    const matchesSearch =
      !query || categoria.nombre.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === 'todos' ||
      categoria.estado.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  /** Activa/desactiva una categoría contra el API y refleja la respuesta. */
  async function handleToggleStatus(id) {
    const actual = categorias.find((categoria) => categoria.id === id);
    if (!actual) return;

    try {
      const actualizada = await categoryService.cambiarEstado(
        id,
        actual.estado !== 'Activo'
      );
      setCategorias((prev) =>
        prev.map((categoria) =>
          categoria.id === id ? actualizada : categoria
        )
      );
      setError('');
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
        setCategorias((prev) =>
          prev.map((categoria) =>
            categoria.id === actualizada.id ? actualizada : categoria
          )
        );
        setCategoryToEdit(null);
        return actualizada;
      }

      const creada = await categoryService.crear(datos);
      setCategorias((prev) => [creada, ...prev]);
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
      setCategorias((prev) =>
        prev.filter((categoria) => categoria.id !== selectedCategory.id)
      );
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
    setSearchTerm,
    statusFilter,
    setStatusFilter,

    isModalOpen,
    setIsModalOpen,
    isDetailOpen,
    setIsDetailOpen,
    isDeleteOpen,
    setIsDeleteOpen,

    selectedCategory,
    categoryToEdit,
    filteredCategorias,

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
