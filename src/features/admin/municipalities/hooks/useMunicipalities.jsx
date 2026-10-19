// src/features/admin/municipalities/hooks/useMunicipalities.jsx
//
// CRUD de municipios (nombre, identificador y costo de envío).
//
// Datos simulados: el estado parte de los municipios de ejemplo de
// `features/cart/data/Shipping` y se persiste en localStorage. Cuando exista
// backend, solo hay que reemplazar los handlers por llamadas al servicio.
import { useState, useEffect } from 'react';
import { MUNICIPIOS, getShippingCost } from '../../../cart/data/Shipping';

const STORAGE_KEY = 'chocoberry_municipalities_v1';

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

function loadMunicipalities() {
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
function uniqueSlug(base, municipalities, ignoreId = null) {
  const taken = new Set(
    municipalities.filter((m) => m.id !== ignoreId).map((m) => m.slug)
  );
  if (!base) return '';
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export const useMunicipalities = () => {
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [municipalityToEdit, setMunicipalityToEdit] = useState(null);

  const [municipalities, setMunicipalities] = useState(loadMunicipalities);

  // Persistencia simulada
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(municipalities));
  }, [municipalities]);

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredMunicipalities = municipalities.filter(
    (municipality) =>
      statusFilter === 'todos' ||
      municipality.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  // Activar / desactivar
  const handleToggleStatus = (id) => {
    setMunicipalities((prev) =>
      prev.map((municipality) =>
        municipality.id === id
          ? {
              ...municipality,
              estado: municipality.estado === 'Activo' ? 'Inactivo' : 'Activo',
            }
          : municipality
      )
    );
  };

  // Guardar (crear o editar)
  const handleSaveMunicipality = async (data) => {
    await delay();
    if (municipalityToEdit) {
      // El slug no se regenera: es la referencia que usan los pedidos.
      setMunicipalities((prev) =>
        prev.map((municipality) =>
          municipality.id === municipalityToEdit.id
            ? { ...municipality, nombre: data.nombre, costoEnvio: data.costoEnvio, estado: data.estado }
            : municipality
        )
      );
    } else {
      setMunicipalities((prev) => [
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
    setMunicipalityToEdit(null);
  };

  // Eliminar
  const handleConfirmDelete = async () => {
    await delay();
    if (!selectedMunicipality) return;
    setMunicipalities((prev) =>
      prev.filter((municipality) => municipality.id !== selectedMunicipality.id)
    );
    setIsDeleteOpen(false);
    setSelectedMunicipality(null);
  };

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
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    isDetailOpen,
    setIsDetailOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedMunicipality,
    municipalityToEdit,
    filteredMunicipalities,
    handleToggleStatus,
    handleSaveMunicipality,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  };
};
