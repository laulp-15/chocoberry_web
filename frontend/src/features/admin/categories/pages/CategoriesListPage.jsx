// src/features/admin/categories/pages/CategoriesListPage.jsx
import { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import CategoryFormModal from '../components/CategoryFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import OrderNotification from "../../orders/components/OrderNotification";
import './CategoriesListPage.css';

export default function CategoriesListPage() {
  const { can } = usePermissions();
  const canCreate = can('Categorías', 'Crear');
  const canEdit = can('Categorías', 'Editar');
  const canDelete = can('Categorías', 'Eliminar');
  const canChangeStatus = can('Categorías', 'Cambiar estado');
  const [notification, setNotification] = useState(null);
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
    handleOpenDelete
  } = useCategories();

  // Relanza el error si falla para que el modal lo muestre sin cerrarse.
  const handleSave = async (data) => {
    const esEdicion = Boolean(categoryToEdit);
    await handleSaveCategory(data);
    setNotification({
      message: esEdicion
        ? `"${data.nombre}" se actualizó correctamente.`
        : `"${data.nombre}" se creó correctamente.`,
    });
  };

  const handleDelete = async () => {
    const nombre = selectedCategory?.nombre;
    try {
      await handleConfirmDelete();
      setNotification({
        message: `"${nombre}" se eliminó correctamente.`,
      });
    } catch (err) {
      setNotification({
        message: err?.message || 'No se pudo eliminar la categoría.',
        variant: 'error',
      });
    }
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
          onClick={canChangeStatus ? () => handleToggleStatus(cat.id) : undefined}
          className={`status-toggle ${cat.estado === 'Activo' ? 'active' : 'inactive'}`}
          disabled={!canChangeStatus}
          style={{
            cursor: canChangeStatus ? 'pointer' : 'not-allowed',
            opacity: canChangeStatus ? 1 : 0.55,
          }}
          title={
            canChangeStatus
              ? cat.estado === 'Activo'
                ? 'Desactivar'
                : 'Activar'
              : 'No tienes permiso para cambiar el estado.'
          }
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

          {canEdit && (
            <button
              type="button"
              onClick={() => handleOpenEdit(cat)}
              className="table-action-btn"
              title="Editar"
            >
              <i className="fa-solid fa-pen" />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => handleOpenDelete(cat)}
              className="table-action-btn danger"
              title="Eliminar"
            >
              <i className="fa-solid fa-trash" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="categories-page">
      <DataTable
        title="Categorías"
        description="Consulta y administra las categorías de productos del negocio."
        createLabel={canCreate ? 'Crear categoría' : undefined}
        onCreate={canCreate ? handleOpenCreate : undefined}
        columns={columns}
        data={filteredCategorias}
        searchPlaceholder="Buscar por categoría..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        emptyMessage={loading ? 'Cargando categorías...' : 'No hay categorías para mostrar.'}
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

      {error && (
        <p className="categories-error-hint" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
          <button type="button" className="categories-retry" onClick={reload}>
            Reintentar
          </button>
        </p>
      )}

      {/* MODAL CREAR / EDITAR */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={categoryToEdit}
        submitting={submitting}
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

      {/* Notificación flotante de éxito */}
      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        message={notification?.message}
        variant={notification?.variant}
      />
    </div>
  );
}
