// src/features/admin/municipios/pages/MunicipiosListPage.jsx
import React, { useState } from 'react';
import { useMunicipios } from '../hooks/useMunicipios';
import MunicipioFormModal from '../components/MunicipioFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import StatusToggle from '../../../../shared/components/StatusToggle';
import OrderNotification from '../../orders/components/OrderNotification';
import { formatPrice } from '../../../../shared/utils/formatPrice';
import '../../../../shared/css/adminCrud.css';

export default function MunicipiosListPage() {
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
  } = useMunicipios();

  const handleSave = (data) => {
    handleSaveMunicipio(data);
    setNotification({
      message: municipioToEdit
        ? `"${data.nombre}" se actualizó correctamente.`
        : `"${data.nombre}" se creó correctamente.`,
    });
  };

  const handleDelete = () => {
    const nombre = selectedMunicipio?.nombre;
    handleConfirmDelete();
    setNotification({
      message: `"${nombre}" se eliminó correctamente.`,
    });
  };

  const columns = [
    {
      key: 'nombre',
      label: 'MUNICIPIO',
      style: { width: '45%', textAlign: 'left', paddingLeft: '1.5rem' },
      render: (municipio) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>{municipio.nombre}</span>
      ),
    },
    {
      key: 'costoEnvio',
      label: 'COSTO DE ENVÍO',
      style: { width: '20%', textAlign: 'center' },
      render: (municipio) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>
          {formatPrice(municipio.costoEnvio)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'ESTADO',
      style: { width: '120px', textAlign: 'center' },
      render: (municipio) => (
        <StatusToggle
          checked={municipio.estado === 'Activo'}
          onChange={() => handleToggleStatus(municipio.id)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      style: { width: '150px', textAlign: 'right', paddingRight: '2rem' },
      render: (municipio) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(municipio)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(municipio)}
            className="table-action-btn"
            title="Editar"
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDelete(municipio)}
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
        title="Municipios"
        description="Administra los municipios de entrega y el costo de envío de cada uno."
        createLabel="Crear municipio"
        onCreate={handleOpenCreate}
        columns={columns}
        data={filteredMunicipios}
        searchPlaceholder="Buscar municipio..."
        emptyMessage="No hay municipios para mostrar."
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
      <MunicipioFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={municipioToEdit}
      />

      {/* Modal ver detalle */}
      <MunicipioFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedMunicipio}
        isReadOnly
      />

      {/* Modal eliminar */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar municipio"
        description={`¿Estás seguro de que deseas eliminar el municipio "${selectedMunicipio?.nombre}"?`}
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
