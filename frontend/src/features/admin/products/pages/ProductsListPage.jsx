// src/features/admin/products/pages/ProductsListPage.jsx
import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductFormModal from '../components/ProductFormModal';
import DataTable from '../../../../shared/components/DataTable';
import ConfirmModal from '../../../../shared/components/ConfirmModal';
import FormSelect from '../../../../shared/components/FormSelect';
import OrderNotification from "../../orders/components/OrderNotification";
import { imageUrl } from '../../../../shared/utils/imageUrl';
import './ProductsListPage.css';

export default function ProductsListPage() {
  const [notification, setNotification] = useState(null);
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
    categorias,
    loading,
    submitting,
    error,
    reload,
    handleToggleStatus,
    handleSaveProduct,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete
  } = useProducts();

  // Relanza el error si falla para que el modal lo muestre sin cerrarse.
  const handleSave = async (data) => {
    const esEdicion = Boolean(productToEdit);
    await handleSaveProduct(data);
    setNotification({
      message: esEdicion
        ? `"${data.nombre}" se actualizó correctamente.`
        : `"${data.nombre}" se creó correctamente.`,
    });
  };

  const handleDelete = async () => {
    const nombre = selectedProduct?.nombre;
    try {
      await handleConfirmDelete();
      setNotification({
        message: `"${nombre}" se eliminó correctamente.`,
      });
    } catch (err) {
      setNotification({
        message: err?.message || 'No se pudo eliminar el producto.',
      });
    }
  };

  // Definición de columnas con miniatura de imagen incluida
  const columns = [
    {
      key: 'imagen',
      label: 'FOTO',
      render: (prod) => (
        prod.imagen ? (
          <img
            src={imageUrl(prod.imagen)}
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
      key: 'categoriaNombre',
      label: 'CATEGORÍA',
      render: (prod) => <span style={{ color: 'var(--texto-muted)' }}>{prod.categoriaNombre}</span>
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
      style: { textAlign: 'right', paddingRight: '2rem' },
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
        emptyMessage={loading ? 'Cargando productos...' : 'No hay productos para mostrar.'}
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

      {error && (
        <p className="products-error-hint" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
          <button type="button" className="products-retry" onClick={reload}>
            Reintentar
          </button>
        </p>
      )}

      {/* MODAL CREAR / EDITAR */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={productToEdit}
        categorias={categorias}
        submitting={submitting}
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

      {/* Notificación flotante de éxito */}
      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        message={notification?.message}
      />
    </div>
  );
}
