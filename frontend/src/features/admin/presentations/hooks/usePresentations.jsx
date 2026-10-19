// src/features/admin/presentations/hooks/usePresentations.jsx
//
// CRUD de presentaciones (cantidad de fresas y precio).
//
// Datos simulados: el estado parte de la tabla de precios por cantidad de
// `features/catalog/data/Pricing` y se persiste en localStorage. Cuando exista
// backend, solo hay que reemplazar los handlers por llamadas al servicio.
import { useState, useEffect } from 'react';
import { PRICE_BY_QUANTITY } from '../../../catalog/data/Pricing';

const STORAGE_KEY = 'chocoberry_presentations_v1';

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSeed() {
  return Object.entries(PRICE_BY_QUANTITY).map(([cantidad, precio], index) => ({
    id: index + 1,
    cantidadFresas: Number(cantidad),
    precio,
    estado: 'Activo',
  }));
}

function loadPresentations() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (error) {
    console.error('Error al leer las presentaciones guardadas', error);
  }
  return buildSeed();
}

export const usePresentations = () => {
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [presentationToEdit, setPresentationToEdit] = useState(null);

  const [presentations, setPresentations] = useState(loadPresentations);

  // Persistencia simulada
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presentations));
  }, [presentations]);

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredPresentations = presentations.filter(
    (presentation) =>
      statusFilter === 'todos' ||
      presentation.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  // Activar / desactivar
  const handleToggleStatus = (id) => {
    setPresentations((prev) =>
      prev.map((presentation) =>
        presentation.id === id
          ? {
              ...presentation,
              estado: presentation.estado === 'Activo' ? 'Inactivo' : 'Activo',
            }
          : presentation
      )
    );
  };

  // Guardar (crear o editar)
  const handleSavePresentation = async (data) => {
    await delay();
    if (presentationToEdit) {
      setPresentations((prev) =>
        prev.map((presentation) =>
          presentation.id === presentationToEdit.id
            ? { ...presentation, ...data }
            : presentation
        )
      );
    } else {
      setPresentations((prev) => [{ id: Date.now(), ...data }, ...prev]);
    }
    setPresentationToEdit(null);
  };

  // Eliminar
  const handleConfirmDelete = async () => {
    await delay();
    if (!selectedPresentation) return;
    setPresentations((prev) =>
      prev.filter((presentation) => presentation.id !== selectedPresentation.id)
    );
    setIsDeleteOpen(false);
    setSelectedPresentation(null);
  };

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
    handleToggleStatus,
    handleSavePresentation,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
