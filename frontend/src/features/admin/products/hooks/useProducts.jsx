// src/features/admin/products/hooks/useProducts.jsx
//
// Gestión de productos del panel contra el API real (/api/productos).
// El estado vive aquí; las llamadas HTTP, en services/productService.js, y la
// traducción de nombres/errores, en services/productMappers.js.
//
// Las categorías del formulario también vienen del API (no están hardcodeadas).

import { useEffect, useState } from "react";

import * as categoryService from "../../categories/services/categoryService";
import * as productService from "../services/productService";

export const useProducts = ({ autoLoad = true } = {}) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);

  // Carga inicial (productos + categorías para el select del formulario).
  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    Promise.all([productService.listar(), categoryService.listar()])
      .then(([lista, listaCategorias]) => {
        if (!activo) return;
        setProductos(lista);
        setCategorias(listaCategorias);
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudieron cargar los productos.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [autoLoad, reloadToken]);

  function reload() {
    setLoading(true);
    setError("");
    setReloadToken((valor) => valor + 1);
  }

  // Filtrado local (la búsqueda de texto y el estado viven en la página).
  const query = searchTerm.trim().toLowerCase();
  const currentProducts = productos.filter((producto) => {
    const matchesSearch =
      !query ||
      producto.nombre.toLowerCase().includes(query) ||
      producto.descripcion.toLowerCase().includes(query) ||
      producto.categoriaNombre.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "todos" ||
      producto.estado.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleSearchChange = (value) => setSearchTerm(value);
  const handleStatusFilterChange = (value) => setStatusFilter(value);

  /** Activa/desactiva un producto contra el API y refleja la respuesta. */
  async function handleToggleStatus(id) {
    const actual = productos.find((producto) => producto.id === id);
    if (!actual) return;

    try {
      const actualizado = await productService.cambiarEstado(
        id,
        actual.estado !== "Activo"
      );
      setProductos((prev) =>
        prev.map((producto) => (producto.id === id ? actualizado : producto))
      );
      setError("");
    } catch (err) {
      setError(err?.message || "No se pudo cambiar el estado del producto.");
    }
  }

  /**
   * Crea o edita. Devuelve el producto guardado y relanza los errores para que
   * el modal los muestre sin cerrarse.
   */
  async function handleSaveProduct(datos) {
    setSubmitting(true);
    try {
      if (productToEdit) {
        const actualizado = await productService.actualizar(
          productToEdit.id,
          datos
        );
        setProductos((prev) =>
          prev.map((producto) =>
            producto.id === actualizado.id ? actualizado : producto
          )
        );
        setProductToEdit(null);
        return actualizado;
      }

      const creado = await productService.crear(datos);
      setProductos((prev) => [creado, ...prev]);
      return creado;
    } finally {
      setSubmitting(false);
    }
  }

  /** Elimina; si el backend responde 409, el error se propaga a la página. */
  async function handleConfirmDelete() {
    if (!selectedProduct) return;

    try {
      await productService.eliminar(selectedProduct.id);
      setProductos((prev) =>
        prev.filter((producto) => producto.id !== selectedProduct.id)
      );
    } finally {
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    }
  }

  // Control de modales
  const handleOpenCreate = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (producto) => {
    setProductToEdit(producto);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (producto) => {
    setSelectedProduct(producto);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (producto) => {
    setSelectedProduct(producto);
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
    currentProducts,
    totalProductsCount: currentProducts.length,

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
    handleOpenDelete,
  };
};
