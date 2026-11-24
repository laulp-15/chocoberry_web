// src/features/admin/products/hooks/useProducts.jsx
//
// Gestión de productos del panel contra el API real (/api/productos).
// El estado vive aquí; las llamadas HTTP, en services/productService.js, y la
// traducción de nombres/errores, en services/productMappers.js.
//
// Las categorías del formulario también vienen del API (no están hardcodeadas).

import { useEffect, useState } from "react";

import useDebouncedValue from "../../../../shared/hooks/useDebouncedValue";
import * as categoryService from "../../categories/services/categoryService";
import * as productService from "../services/productService";

const PAGE_SIZE = 10;

export const useProducts = ({ autoLoad = true } = {}) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(autoLoad);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToEdit, setProductToEdit] = useState(null);

  // Carga los productos de la página actual + categorías del formulario.
  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;
    const nombre = debouncedSearch.trim() || undefined;
    const estado = statusFilter === "todos" ? undefined : statusFilter;

    Promise.all([
      productService.listar({ page, limit: PAGE_SIZE, nombre, estado }),
      categoryService.listar(),
    ])
      .then(([respuesta, listaCategorias]) => {
        if (!activo) return;
        setProductos(respuesta.data);
        setMeta(respuesta.meta);
        setCategorias(listaCategorias);
        setError("");

        if (page > respuesta.meta.totalPages) {
          setPage(respuesta.meta.totalPages);
        }
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
  }, [autoLoad, reloadToken, page, debouncedSearch, statusFilter]);

  function reload() {
    setLoading(true);
    setError("");
    setReloadToken((valor) => valor + 1);
  }

  const currentProducts = productos;

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  /** Activa/desactiva un producto contra el API y recarga el listado. */
  async function handleToggleStatus(id) {
    const actual = productos.find((producto) => producto.id === id);
    if (!actual) return;

    try {
      await productService.cambiarEstado(id, actual.estado !== "Activo");
      setError("");
      reload();
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
        setProductToEdit(null);
        reload();
        return actualizado;
      }

      const creado = await productService.crear(datos);
      setPage(1);
      reload();
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
      reload();
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
    totalProductsCount: meta.total,
    page,
    setPage,
    meta,

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
