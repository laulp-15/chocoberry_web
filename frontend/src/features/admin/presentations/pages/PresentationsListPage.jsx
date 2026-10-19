// src/features/admin/presentations/pages/PresentationsListPage.jsx
import { useState } from 'react';
import { usePresentations } from '../hooks/usePresentations';
import PresentationFormModal from '../components/PresentationFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import StatusToggle from '../../../../shared/components/StatusToggle';
import OrderNotification from '../../orders/components/OrderNotification';
import { formatPrice } from '../../../../shared/utils/formatPrice';
import { quantityLabel } from '../utils/presentationDisplay';
import '../../../../shared/css/adminCrud.css';

export default function PresentationsListPage() {
  const [notification, setNotification] = useState(null);
  const {
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
    loading,
    submitting,
    error,
    reload,
    handleToggleStatus,
    handleSavePresentation,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete,
  } = usePresentations();

  // Relanza el error si falla para que el modal lo muestre sin cerrarse.
  const handleSave = async (data) => {
    const esEdicion = Boolean(presentationToEdit);
    await handleSavePresentation(data);
    setNotification({
      message: esEdicion
        ? `Se actualizó la presentación de ${quantityLabel(data.cantidadFresas)}.`
        : `Se creó la presentación de ${quantityLabel(data.cantidadFresas)}.`,
    });
  };

  const handleDelete = async () => {
    const cantidad = selectedPresentation?.cantidadFresas;
    try {
      await handleConfirmDelete();
      setNotification({
        message: `Se eliminó la presentación de ${quantityLabel(cantidad)}.`,
      });
    } catch (err) {
      setNotification({
        message: err?.message || 'No se pudo eliminar la presentación.',
      });
    }
  };

  const columns = [
    {
      key: 'cantidadFresas',
      label: 'CANTIDAD DE FRESAS',
      style: { width: '45%', textAlign: 'left', paddingLeft: '1.5rem' },
      render: (presentation) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>
          {quantityLabel(presentation.cantidadFresas)}
        </span>
      ),
    },
    {
      key: 'precio',
      label: 'PRECIO',
      style: { width: '20%', textAlign: 'center' },
      render: (presentation) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>
          {formatPrice(presentation.precio)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'ESTADO',
      style: { width: '120px', textAlign: 'center' },
      render: (presentation) => (
        <StatusToggle
          checked={presentation.estado === 'Activo'}
          onChange={() => handleToggleStatus(presentation.id)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      style: { width: '150px', textAlign: 'right', paddingRight: '2rem' },
      render: (presentation) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(presentation)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(presentation)}
            className="table-action-btn"
            title="Editar"
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDelete(presentation)}
            className="table-action-btn danger"
            title="Eliminar"
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="crud-page">
      <DataTable
        title="Presentaciones"
        description="Administra las cantidades de fresas y el precio de cada presentación."
        createLabel="Crear presentación"
        onCreate={handleOpenCreate}
        columns={columns}
        data={filteredPresentations}
        searchPlaceholder="Buscar presentación..."
        emptyMessage={
          loading
            ? 'Cargando presentaciones...'
            : 'No hay presentaciones para mostrar.'
        }
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
        <p className="crud-error-hint" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
          <button type="button" className="crud-retry" onClick={reload}>
            Reintentar
          </button>
        </p>
      )}

      {/* Modal crear / editar */}
      <PresentationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={presentationToEdit}
        submitting={submitting}
      />

      {/* Modal ver detalle */}
      <PresentationFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedPresentation}
        isReadOnly
      />

      {/* Modal eliminar */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar presentación"
        description={`¿Estás seguro de que deseas eliminar la presentación de ${quantityLabel(
          selectedPresentation?.cantidadFresas
        )}?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />

      {/* Notificación flotante de éxito */}
      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        message={notification?.message}
      />
    </div>
  );
}
