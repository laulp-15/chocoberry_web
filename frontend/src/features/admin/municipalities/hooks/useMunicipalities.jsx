// src/features/admin/municipalities/hooks/useMunicipalities.jsx
//
// Gestión de municipios (nombre, costo de envío y estado) contra el API real
// (/api/municipios). El estado vive aquí; las llamadas HTTP, en
// services/municipalityService.js.

import { useEffect, useState } from 'react';

import * as municipalityService from '../services/municipalityService';

/** El backend lista alfabéticamente; se mantiene ese orden al crear o editar. */
function ordenarPorNombre(lista) {
  return [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export const useMunicipalities = ({ autoLoad = true } = {}) => {
  const [municipalities, setMunicipalities] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales y estados de selección
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [municipalityToEdit, setMunicipalityToEdit] = useState(null);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    municipalityService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setMunicipalities(ordenarPorNombre(lista));
        setError('');
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
  }, [autoLoad, reloadToken]);

  function reload() {
    setLoading(true);
    setError('');
    setReloadToken((valor) => valor + 1);
  }

  // Filtrado por estado (la búsqueda de texto la maneja DataTable)
  const filteredMunicipalities = municipalities.filter(
    (municipality) =>
      statusFilter === 'todos' ||
      municipality.estado.toLowerCase() === statusFilter.toLowerCase()
  );

  /** Activa/desactiva un municipio contra el API y refleja la respuesta. */
  async function handleToggleStatus(id) {
    const actual = municipalities.find((municipality) => municipality.id === id);
    if (!actual) return;

    try {
      const actualizado = await municipalityService.cambiarEstado(
        id,
        actual.estado !== 'Activo'
      );
      setMunicipalities((prev) =>
        prev.map((municipality) =>
          municipality.id === id ? actualizado : municipality
        )
      );
      setError('');
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
        setMunicipalities((prev) =>
          ordenarPorNombre(
            prev.map((municipality) =>
              municipality.id === actualizado.id ? actualizado : municipality
            )
          )
        );
        setMunicipalityToEdit(null);
        return actualizado;
      }

      const creado = await municipalityService.crear(datos);
      setMunicipalities((prev) => ordenarPorNombre([creado, ...prev]));
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
      setMunicipalities((prev) =>
        prev.filter(
          (municipality) => municipality.id !== selectedMunicipality.id
        )
      );
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
