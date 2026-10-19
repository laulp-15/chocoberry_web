// src/features/admin/glaseados/hooks/useGlaseados.jsx
//
// CRUD de glaseados (nombre y color).
//
// Datos simulados: el estado parte de los colores de glaseado disponibles de
// `features/catalog/data/Colors` y se persiste en localStorage. Cuando exista
// backend, solo hay que reemplazar los handlers por llamadas al servicio.
import { useState, useEffect } from 'react';
import { COLOR_OPTIONS } from '../../../catalog/data/Colors';

const STORAGE_KEY = 'chocoberry_glaseados_v1';

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

function loadGlaseados() {
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

export const useGlaseados = () => {
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedGlaseado, setSelectedGlaseado] = useState(null);
  const [glaseadoToEdit, setGlaseadoToEdit] = useState(null);

  const [glaseados, setGlaseados] = useState(loadGlaseados);

  // Persistencia simulada
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(glaseados));
  }, [glaseados]);

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredGlaseados = glaseados.filter(
    (glaseado) =>
      statusFilter === 'todos' ||
      glaseado.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  // Activar / desactivar
  const handleToggleStatus = (id) => {
    setGlaseados((prev) =>
      prev.map((glaseado) =>
        glaseado.id === id
          ? { ...glaseado, estado: glaseado.estado === 'Activo' ? 'Inactivo' : 'Activo' }
          : glaseado
      )
    );
  };

  // Guardar (crear o editar)
  const handleSaveGlaseado = async (data) => {
    await delay();
    if (glaseadoToEdit) {
      setGlaseados((prev) =>
        prev.map((glaseado) =>
          glaseado.id === glaseadoToEdit.id ? { ...glaseado, ...data } : glaseado
        )
      );
    } else {
      setGlaseados((prev) => [{ id: Date.now(), ...data }, ...prev]);
    }
    setGlaseadoToEdit(null);
  };

  // Eliminar
  const handleConfirmDelete = async () => {
    await delay();
    if (!selectedGlaseado) return;
    setGlaseados((prev) => prev.filter((glaseado) => glaseado.id !== selectedGlaseado.id));
    setIsDeleteOpen(false);
    setSelectedGlaseado(null);
  };

  // Apertura de modales
  const handleOpenCreate = () => {
    setGlaseadoToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (glaseado) => {
    setGlaseadoToEdit(glaseado);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (glaseado) => {
    setSelectedGlaseado(glaseado);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (glaseado) => {
    setSelectedGlaseado(glaseado);
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
    selectedGlaseado,
    glaseadoToEdit,
    filteredGlaseados,
    handleToggleStatus,
    handleSaveGlaseado,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
