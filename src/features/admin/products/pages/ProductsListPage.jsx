// src/admin/products/pages/ProductsListPage.jsx
import React from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductFormModal from '../components/ProductFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import { useToast } from '../../../../shared/components/Toast';
import './ProductsListPage.css';

export default function ProductsListPage() {
  const { showToast } = useToast();
  const {
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    isModalOpen,
    setIsModalOpen,
    isDetailOpen,
    setIsDetailOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedProduct,
    productToEdit,
    currentProducts,
    handleToggleStatus,
    handleSaveProduct,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete
  } = useProducts();

  const handleSave = (data) => {
    handleSaveProduct(data);
    showToast({
      type: 'success',
      title: productToEdit ? 'Producto actualizado' : 'Producto creado',
      message: productToEdit
        ? `"${data.nombre}" se actualizó correctamente.`
        : `"${data.nombre}" se creó correctamente.`,
    });
  };

  const handleDelete = () => {
    handleConfirmDelete();
    showToast({
      type: 'success',
      title: 'Producto eliminado',
      message: `"${selectedProduct?.nombre}" se eliminó correctamente.`,
    });
  };

  // Definición de columnas con miniatura de imagen incluida
  const columns = [
    {
      key: 'imagen',
      label: 'FOTO',
      render: (prod) => (
        prod.imagen ? (
          <img
            src={prod.imagen}
            alt={prod.nombre}
            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--borde)' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--secundario-3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--texto-muted)' }}>
            <i className="fa-solid fa-image" style={{ fontSize: '0.9rem' }}></i>
          </div>
        )
      )
    },
    {
      key: 'nombre',
      label: 'NOMBRE',
      render: (prod) => <span style={{ fontWeight: '600', color: 'var(--texto)' }}>{prod.nombre}</span>
    },
    {
      key: 'descripcion',
      label: 'DESCRIPCIÓN',
      render: (prod) => <span style={{ color: 'var(--texto-muted)', maxWidth: '250px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.descripcion}</span>
    },
    {
      key: 'categoria',
      label: 'CATEGORÍA',
      render: (prod) => <span style={{ color: 'var(--texto-muted)' }}>{prod.categoria}</span>
    },
    {
      key: 'estado',
      label: 'ESTADO',
      align: 'center',
      render: (prod) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(prod.id)}
          className={`status-toggle ${prod.estado === 'Activo' ? 'active' : 'inactive'}`}
          title={`Estado: ${prod.estado}. Clic para cambiar.`}
        >
          <div className={`status-toggle-knob ${prod.estado === 'Activo' ? 'active' : 'inactive'}`} />
        </button>
      )
    },
    {
      key: 'actions',
      label: 'ACCIONES',
      align: 'center',
      render: (prod) => (
        <div className="table-actions">
          <button
            type="button"
            onClick={() => handleOpenDetail(prod)}
            className="table-action-btn"
            title="Ver detalle"
          >
            <i className="fa-solid fa-eye" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEdit(prod)}
            className="table-action-btn"
            title="Editar"
          >
            <i className="fa-solid fa-pen" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDelete(prod)}
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
    <div className="products-page">
      <DataTable
        title="Productos"
        description="Consulta y administra el catálogo de productos de ChocoBerry."
        createLabel="Crear producto"
        onCreate={handleOpenCreate}
        columns={columns}
        data={currentProducts}
        searchPlaceholder="Buscar producto, descripción o categoría..."
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        extraFilter={
          <FormSelect
            value={statusFilter}
            onChange={handleStatusFilterChange}
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
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={productToEdit}
      />

      {/* MODAL VER DETALLE */}
      <ProductFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedProduct}
        isReadOnly={true}
      />

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar producto"
        description={`¿Estás seguro de que deseas eliminar el producto "${selectedProduct?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
      />
    </div>
  );
}
