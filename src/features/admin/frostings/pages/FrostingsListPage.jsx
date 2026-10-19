// src/features/admin/glaseados/pages/GlaseadosListPage.jsx
import React, { useState } from 'react';
import { useGlaseados } from '../hooks/useGlaseados';
import GlaseadoFormModal from '../components/GlaseadoFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import StatusToggle from '../../../../shared/components/StatusToggle';
import OrderNotification from '../../orders/components/OrderNotification';
import '../../../../shared/css/adminCrud.css';

export default function GlaseadosListPage() {
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
  } = useGlaseados();

  const handleSave = (data) => {
    handleSaveGlaseado(data);
    setNotification({
      message: glaseadoToEdit
        ? `"${data.nombre}" se actualizó correctamente.`
        : `"${data.nombre}" se creó correctamente.`,
    });
  };

  const handleDelete = () => {
    const nombre = selectedGlaseado?.nombre;
    handleConfirmDelete();
    setNotification({
      message: `"${nombre}" se eliminó correctamente.`,
    });
  };

  const columns = [
    {
      key: 'nombre',
      label: 'GLASEADO',
      style: { width: '45%', textAlign: 'left', paddingLeft: '1.5rem' },
      render: (glaseado) => (
        <span className="crud-color-cell">
          <span className="crud-swatch" style={{ backgroundColor: glaseado.hex }} />
          <span style={{ fontWeight: '600', color: 'var(--texto)' }}>{glaseado.nombre}</span>
        </span>
      ),
    },
    {
      key: 'hex',
      label: 'CÓDIGO',
      style: { width: '20%', textAlign: 'left' },
      render: (glaseado) => (
        <span style={{ color: 'var(--texto-muted)' }}>{glaseado.hex}</span>
      ),
    },
    {
      key: 'estado',
      label: 'ESTADO',
      style: { width: '120px', textAlign: 'center' },
      render: (glaseado) => (
        <StatusToggle
          checked={glaseado.estado === 'Activo'}
          onChange={() => handleToggleStatus(glaseado.id)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      style: { width: '150px', textAlign: 'right', paddingRight: '2rem' },
      render: (glaseado) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(glaseado)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(glaseado)}
            className="table-action-btn"
            title="Editar"
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDelete(glaseado)}
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
        title="Glaseados"
        description="Administra los colores de glaseado disponibles para los productos."
        createLabel="Crear glaseado"
        onCreate={handleOpenCreate}
        columns={columns}
        data={filteredGlaseados}
        searchPlaceholder="Buscar glaseado..."
        emptyMessage="No hay glaseados para mostrar."
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
      <GlaseadoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={glaseadoToEdit}
      />

      {/* Modal ver detalle */}
      <GlaseadoFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedGlaseado}
        isReadOnly
      />

      {/* Modal eliminar */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar glaseado"
        description={`¿Estás seguro de que deseas eliminar el glaseado "${selectedGlaseado?.nombre}"?`}
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
