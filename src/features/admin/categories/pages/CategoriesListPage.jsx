// src/admin/categories/pages/CategoriesListPage.jsx
import React from 'react';
import { useCategories } from '../hooks/useCategories';
import CategoryFormModal from '../components/CategoryFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import { useToast } from '../../../../shared/components/Toast';
import './CategoriesListPage.css';

export default function CategoriesListPage() {
  const { showToast } = useToast();
  const {
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
    handleToggleStatus,
    handleSaveCategory,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete
  } = useCategories();

  const handleSave = (data) => {
    handleSaveCategory(data);
    showToast({
      type: 'success',
      title: categoryToEdit ? 'Categoría actualizada' : 'Categoría creada',
      message: categoryToEdit
        ? `"${data.nombre}" se actualizó correctamente.`
        : `"${data.nombre}" se creó correctamente.`,
    });
  };

  const handleDelete = () => {
    handleConfirmDelete();
    showToast({
      type: 'success',
      title: 'Categoría eliminada',
      message: `"${selectedCategory?.nombre}" se eliminó correctamente.`,
    });
  };

  // Definición de columnas con anchos controlados para que las acciones no queden lejos
  const columns = [
    {
      key: 'nombre',
      label: 'CATEGORÍA',
      style: { width: '55%', textAlign: 'left', paddingLeft: '1.5rem' },
      render: (cat) => <span style={{ fontWeight: '600', color: 'var(--texto)' }}>{cat.nombre}</span>
    },
    {
      key: 'estado',
      label: 'ESTADO',
      style: { width: '150px', textAlign: 'center' },
      render: (cat) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(cat.id)}
          className={`status-toggle ${cat.estado === 'Activo' ? 'active' : 'inactive'}`}
          title={cat.estado === 'Activo' ? 'Desactivar' : 'Activar'}
        >
          <div className={`status-toggle-knob ${cat.estado === 'Activo' ? 'active' : 'inactive'}`} />
        </button>
      )
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      style: { width: '180px', textAlign: 'right', paddingRight: '2rem' },
      render: (cat) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(cat)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(cat)}
            className="table-action-btn"
            title="Editar"
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDelete(cat)}
            className="table-action-btn danger"
            title="Eliminar"
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="categories-page">
      <DataTable
        title="Categorías"
        description="Consulta y administra las categorías de productos del negocio."
        createLabel="Crear categoría"
        onCreate={handleOpenCreate}
        columns={columns}
        data={filteredCategorias}
        searchPlaceholder="Buscar por categoría..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        extraFilter={
          <FormSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'todos', label: 'Todos los estados' },
              { value: 'activo', label: 'Activo' },
              { value: 'inactivo', label: 'Inactivo' },
            ]}
            placeholder="Todos los estados"
          />
        }
      />

      {/* MODAL CREAR / EDITAR */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={categoryToEdit}
      />

      {/* MODAL VER DETALLE */}
      <CategoryFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedCategory}
        isReadOnly={true}
      />

      {/* MODAL ELIMINAR */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar categoría"
        description={`¿Estás seguro de que deseas eliminar la categoría "${selectedCategory?.nombre}"?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
