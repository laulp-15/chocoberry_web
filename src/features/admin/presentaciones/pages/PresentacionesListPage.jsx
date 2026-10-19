// src/features/admin/presentaciones/pages/PresentacionesListPage.jsx
import React, { useState } from 'react';
import { usePresentaciones } from '../hooks/usePresentaciones';
import PresentacionFormModal from '../components/PresentacionFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import StatusToggle from '../../../../shared/components/StatusToggle';
import OrderNotification from '../../orders/components/OrderNotification';
import { formatPrice } from '../../../../shared/utils/formatPrice';
import { labelCantidad } from '../utils/presentacionDisplay';
import '../../../../shared/css/adminCrud.css';

export default function PresentacionesListPage() {
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
  } = usePresentaciones();

  const handleSave = (data) => {
    handleSavePresentacion(data);
    setNotification({
      message: presentacionToEdit
        ? `Se actualizó la presentación de ${labelCantidad(data.cantidadFresas)}.`
        : `Se creó la presentación de ${labelCantidad(data.cantidadFresas)}.`,
    });
  };

  const handleDelete = () => {
    const cantidad = selectedPresentacion?.cantidadFresas;
    handleConfirmDelete();
    setNotification({
      message: `Se eliminó la presentación de ${labelCantidad(cantidad)}.`,
    });
  };

  const columns = [
    {
      key: 'cantidadFresas',
      label: 'CANTIDAD DE FRESAS',
      style: { width: '45%', textAlign: 'left', paddingLeft: '1.5rem' },
      render: (presentacion) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>
          {labelCantidad(presentacion.cantidadFresas)}
        </span>
      ),
    },
    {
      key: 'precio',
      label: 'PRECIO',
      style: { width: '20%', textAlign: 'center' },
      render: (presentacion) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>
          {formatPrice(presentacion.precio)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'ESTADO',
      style: { width: '120px', textAlign: 'center' },
      render: (presentacion) => (
        <StatusToggle
          checked={presentacion.estado === 'Activo'}
          onChange={() => handleToggleStatus(presentacion.id)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      style: { width: '150px', textAlign: 'right', paddingRight: '2rem' },
      render: (presentacion) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(presentacion)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(presentacion)}
            className="table-action-btn"
            title="Editar"
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDelete(presentacion)}
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
        data={filteredPresentaciones}
        searchPlaceholder="Buscar presentación..."
        emptyMessage="No hay presentaciones para mostrar."
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

      {/* Modal crear / editar */}
      <PresentacionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={presentacionToEdit}
      />

      {/* Modal ver detalle */}
      <PresentacionFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedPresentacion}
        isReadOnly
      />

      {/* Modal eliminar */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar presentación"
        description={`¿Estás seguro de que deseas eliminar la presentación de ${labelCantidad(
          selectedPresentacion?.cantidadFresas
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
