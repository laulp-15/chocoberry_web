// src/features/admin/municipios/hooks/useMunicipios.jsx
//
// CRUD de municipios (nombre, identificador y costo de envío).
//
// Datos simulados: el estado parte de los municipios de ejemplo de
// `features/cart/data/Shipping` y se persiste en localStorage. Cuando exista
// backend, solo hay que reemplazar los handlers por llamadas al servicio.
import { useState, useEffect } from 'react';
import { MUNICIPIOS, getShippingCost } from '../../../cart/data/Shipping';

const STORAGE_KEY = 'chocoberry_municipios_v1';

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Identificador estable a partir del nombre (ej. "La Estrella" -> "la-estrella").
 * Es el valor que guardan los pedidos en `order.municipio`.
 */
function slugify(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSeed() {
  return MUNICIPIOS.map((municipio, index) => ({
    id: index + 1,
    nombre: municipio.label,
    slug: municipio.value,
    costoEnvio: getShippingCost(municipio.value),
    estado: 'Activo',
  }));
}

function loadMunicipios() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (error) {
    console.error('Error al leer los municipios guardados', error);
  }
  return buildSeed();
}

/** Devuelve un slug único dentro del listado (agrega -2, -3... si se repite). */
function uniqueSlug(base, municipios, ignoreId = null) {
  const taken = new Set(
    municipios.filter((m) => m.id !== ignoreId).map((m) => m.slug)
  );
  if (!base) return '';
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export const useMunicipios = () => {
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedMunicipio, setSelectedMunicipio] = useState(null);
  const [municipioToEdit, setMunicipioToEdit] = useState(null);

  const [municipios, setMunicipios] = useState(loadMunicipios);

  // Persistencia simulada
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(municipios));
  }, [municipios]);

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredMunicipios = municipios.filter(
    (municipio) =>
      statusFilter === 'todos' ||
      municipio.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  // Activar / desactivar
  const handleToggleStatus = (id) => {
    setMunicipios((prev) =>
      prev.map((municipio) =>
        municipio.id === id
          ? {
              ...municipio,
              estado: municipio.estado === 'Activo' ? 'Inactivo' : 'Activo',
            }
          : municipio
      )
    );
  };

  // Guardar (crear o editar)
  const handleSaveMunicipio = async (data) => {
    await delay();
    if (municipioToEdit) {
      // El slug no se regenera: es la referencia que usan los pedidos.
      setMunicipios((prev) =>
        prev.map((municipio) =>
          municipio.id === municipioToEdit.id
            ? { ...municipio, nombre: data.nombre, costoEnvio: data.costoEnvio, estado: data.estado }
            : municipio
        )
      );
    } else {
      setMunicipios((prev) => [
        {
          id: Date.now(),
          nombre: data.nombre,
          slug: uniqueSlug(slugify(data.nombre), prev),
          costoEnvio: data.costoEnvio,
          estado: data.estado,
        },
        ...prev,
      ]);
    }
    setMunicipioToEdit(null);
  };

  // Eliminar
  const handleConfirmDelete = async () => {
    await delay();
    if (!selectedMunicipio) return;
    setMunicipios((prev) => prev.filter((municipio) => municipio.id !== selectedMunicipio.id));
    setIsDeleteOpen(false);
    setSelectedMunicipio(null);
  };

  // Apertura de modales
  const handleOpenCreate = () => {
    setMunicipioToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (municipio) => {
    setMunicipioToEdit(municipio);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (municipio) => {
    setSelectedMunicipio(municipio);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (municipio) => {
    setSelectedMunicipio(municipio);
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
    selectedMunicipio,
    municipioToEdit,
    filteredMunicipios,
    handleToggleStatus,
    handleSaveMunicipio,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
