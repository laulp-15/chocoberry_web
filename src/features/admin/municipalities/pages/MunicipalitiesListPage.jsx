// src/features/admin/municipalities/pages/MunicipalitiesListPage.jsx
import React, { useState } from 'react';
import { useMunicipalities } from '../hooks/useMunicipalities';
import MunicipalityFormModal from '../components/MunicipalityFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import StatusToggle from '../../../../shared/components/StatusToggle';
import OrderNotification from '../../orders/components/OrderNotification';
import { formatPrice } from '../../../../shared/utils/formatPrice';
import '../../../../shared/css/adminCrud.css';

export default function MunicipalitiesListPage() {
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
  } = useMunicipalities();

  const handleSave = (data) => {
    handleSaveMunicipality(data);
    setNotification({
      message: municipalityToEdit
        ? `"${data.nombre}" se actualizó correctamente.`
        : `"${data.nombre}" se creó correctamente.`,
    });
  };

  const handleDelete = () => {
    const nombre = selectedMunicipality?.nombre;
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
      render: (municipality) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>{municipality.nombre}</span>
      ),
    },
    {
      key: 'costoEnvio',
      label: 'COSTO DE ENVÍO',
      style: { width: '20%', textAlign: 'center' },
      render: (municipality) => (
        <span style={{ fontWeight: '600', color: 'var(--texto)' }}>
          {formatPrice(municipality.costoEnvio)}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'ESTADO',
      style: { width: '120px', textAlign: 'center' },
      render: (municipality) => (
        <StatusToggle
          checked={municipality.estado === 'Activo'}
          onChange={() => handleToggleStatus(municipality.id)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      style: { width: '150px', textAlign: 'right', paddingRight: '2rem' },
      render: (municipality) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(municipality)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(municipality)}
            className="table-action-btn"
            title="Editar"
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDelete(municipality)}
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
        data={filteredMunicipalities}
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
      <MunicipalityFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={municipalityToEdit}
      />

      {/* Modal ver detalle */}
      <MunicipalityFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedMunicipality}
        isReadOnly
      />

      {/* Modal eliminar */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar municipio"
        description={`¿Estás seguro de que deseas eliminar el municipio "${selectedMunicipality?.nombre}"?`}
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
