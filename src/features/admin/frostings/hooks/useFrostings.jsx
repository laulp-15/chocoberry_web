// src/features/admin/frostings/hooks/useFrostings.jsx
//
// CRUD de glaseados (nombre y color).
//
// Datos simulados: el estado parte de los colores de glaseado disponibles de
// `features/catalog/data/Colors` y se persiste en localStorage. Cuando exista
// backend, solo hay que reemplazar los handlers por llamadas al servicio.
import { useState, useEffect } from 'react';
import { COLOR_OPTIONS } from '../../../catalog/data/Colors';

const STORAGE_KEY = 'chocoberry_frostings_v1';

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSeed() {
  return COLOR_OPTIONS.map((color, index) => ({
    id: index + 1,
    nombre: color.label,
    hex: color.hex.toUpperCase(),
    estado: 'Activo',
  }));
}

function loadFrostings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (error) {
    console.error('Error al leer los glaseados guardados', error);
  }
  return buildSeed();
}

export const useFrostings = () => {
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedFrosting, setSelectedFrosting] = useState(null);
  const [frostingToEdit, setFrostingToEdit] = useState(null);

  const [frostings, setFrostings] = useState(loadFrostings);

  // Persistencia simulada
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frostings));
  }, [frostings]);

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredFrostings = frostings.filter(
    (frosting) =>
      statusFilter === 'todos' ||
      frosting.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  // Activar / desactivar
  const handleToggleStatus = (id) => {
    setFrostings((prev) =>
      prev.map((frosting) =>
        frosting.id === id
          ? { ...frosting, estado: frosting.estado === 'Activo' ? 'Inactivo' : 'Activo' }
          : frosting
      )
    );
  };

  // Guardar (crear o editar)
  const handleSaveFrosting = async (data) => {
    await delay();
    if (frostingToEdit) {
      setFrostings((prev) =>
        prev.map((frosting) =>
          frosting.id === frostingToEdit.id ? { ...frosting, ...data } : frosting
        )
      );
    } else {
      setFrostings((prev) => [{ id: Date.now(), ...data }, ...prev]);
    }
    setFrostingToEdit(null);
  };

  // Eliminar
  const handleConfirmDelete = async () => {
    await delay();
    if (!selectedFrosting) return;
    setFrostings((prev) => prev.filter((frosting) => frosting.id !== selectedFrosting.id));
    setIsDeleteOpen(false);
    setSelectedFrosting(null);
  };

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
    handleToggleStatus,
    handleSaveFrosting,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
