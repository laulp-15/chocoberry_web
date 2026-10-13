import { useState, useEffect, useCallback } from 'react';
import { PRODUCTS } from "../../../catalog/data/Products";

function delay(ms = 350) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const useProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);

  // Inicialización con LocalStorage
  const [productos, setProductos] = useState(() => {
    const saved = localStorage.getItem('chocoberry_products_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Error al leer localStorage", e);
      }
    }
    return PRODUCTS.map((p, i) => ({
      id: i + 1,
      nombre: p.name,
      descripcion: p.desc,
      categoria: p.catLabel,
      estado: 'Activo',
      imagen: p.image,
    }));
  });

  // Guardar cambios automáticamente en el almacenamiento local del navegador
  useEffect(() => {
    localStorage.setItem('chocoberry_products_v2', JSON.stringify(productos));
  }, [productos]);

  // Filtrado
  const filteredProducts = productos.filter(prod => {
    const matchesSearch = prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prod.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prod.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || prod.estado.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Reset a página 1 al buscar o filtrar (DataTable maneja la paginación)
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  // Toggle de Estado
  const handleToggleStatus = useCallback(async (id) => {
    await delay();
    setProductos(prev =>
      prev.map(prod =>
        prod.id === id ? { ...prod, estado: prod.estado === 'Activo' ? 'Inactivo' : 'Activo' } : prod
      )
    );
  }, []);

  // Guardar (Crear o Editar)
  const handleSaveProduct = useCallback(async (data) => {
    await delay();
    if (productToEdit) {
      setProductos(prev =>
        prev.map(prod => (prod.id === productToEdit.id ? { ...prod, ...data } : prod))
      );
    } else {
      setProductos(prev => [
        {
          id: Date.now(),
          ...data,
          estado: 'Activo'
        },
        ...prev
      ]);
    }
    setProductToEdit(null);
  }, [productToEdit]);

  // Eliminar
  const handleConfirmDelete = useCallback(async () => {
    await delay();
    if (selectedProduct) {
      setProductos(prev => prev.filter(prod => prod.id !== selectedProduct.id));
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    }
  }, [selectedProduct]);

  // Control de Modales
  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setProductToEdit(prod);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (prod) => {
    setSelectedProduct(prod);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (prod) => {
    setSelectedProduct(prod);
    setIsDeleteOpen(true);
  };

  return {
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
    currentProducts: filteredProducts,
    totalProductsCount: filteredProducts.length,
    handleToggleStatus,
    handleSaveProduct,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete
  };
};
