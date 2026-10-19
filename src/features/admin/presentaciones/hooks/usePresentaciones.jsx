// src/features/admin/presentaciones/hooks/usePresentaciones.jsx
//
// CRUD de presentaciones (cantidad de fresas y precio).
//
// Datos simulados: el estado parte de la tabla de precios por cantidad de
// `features/catalog/data/Pricing` y se persiste en localStorage. Cuando exista
// backend, solo hay que reemplazar los handlers por llamadas al servicio.
import { useState, useEffect } from 'react';
import { PRICE_BY_QUANTITY } from '../../../catalog/data/Pricing';

const STORAGE_KEY = 'chocoberry_presentaciones_v1';

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

function loadPresentaciones() {
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

export const usePresentaciones = () => {
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedPresentacion, setSelectedPresentacion] = useState(null);
  const [presentacionToEdit, setPresentacionToEdit] = useState(null);

  const [presentaciones, setPresentaciones] = useState(loadPresentaciones);

  // Persistencia simulada
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presentaciones));
  }, [presentaciones]);

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredPresentaciones = presentaciones.filter(
    (presentacion) =>
      statusFilter === 'todos' ||
      presentacion.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  // Activar / desactivar
  const handleToggleStatus = (id) => {
    setPresentaciones((prev) =>
      prev.map((presentacion) =>
        presentacion.id === id
          ? {
              ...presentacion,
              estado: presentacion.estado === 'Activo' ? 'Inactivo' : 'Activo',
            }
          : presentacion
      )
    );
  };

  // Guardar (crear o editar)
  const handleSavePresentacion = async (data) => {
    await delay();
    if (presentacionToEdit) {
      setPresentaciones((prev) =>
        prev.map((presentacion) =>
          presentacion.id === presentacionToEdit.id
            ? { ...presentacion, ...data }
            : presentacion
        )
      );
    } else {
      setPresentaciones((prev) => [{ id: Date.now(), ...data }, ...prev]);
    }
    setPresentacionToEdit(null);
  };

  // Eliminar
  const handleConfirmDelete = async () => {
    await delay();
    if (!selectedPresentacion) return;
    setPresentaciones((prev) =>
      prev.filter((presentacion) => presentacion.id !== selectedPresentacion.id)
    );
    setIsDeleteOpen(false);
    setSelectedPresentacion(null);
  };

  // Apertura de modales
  const handleOpenCreate = () => {
    setPresentacionToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (presentacion) => {
    setPresentacionToEdit(presentacion);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (presentacion) => {
    setSelectedPresentacion(presentacion);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (presentacion) => {
    setSelectedPresentacion(presentacion);
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
    selectedPresentacion,
    presentacionToEdit,
    filteredPresentaciones,
    handleToggleStatus,
    handleSavePresentacion,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
