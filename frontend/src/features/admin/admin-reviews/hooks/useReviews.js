// src/features/admin/admin-reviews/hooks/useReviews.js
//
// Listado de reseñas del panel contra /api/resenas. La búsqueda, el filtro de
// estado y la paginación se resuelven en el servidor; DataTable solo controla
// la UI.

import { useEffect, useState } from "react";
import useDebouncedValue from "../../../../shared/hooks/useDebouncedValue";
import * as reviewService from "../services/reviewService";

const PAGE_SIZE = 10;

export const useReviews = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [togglingId, setTogglingId] = useState(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    let activo = true;

    reviewService
      .listar({
        page,
        limit: PAGE_SIZE,
        buscar: debouncedSearch.trim() || undefined,
        estado:
          statusFilter === "activo" ? true : statusFilter === "inactivo" ? false : undefined,
      })
      .then((respuesta) => {
        if (!activo) return;
        setReviews(respuesta.data);
        setMeta(respuesta.meta);
        if (respuesta.meta && page > respuesta.meta.totalPages) {
          setPage(respuesta.meta.totalPages);
        }
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudieron cargar las reseñas.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [page, debouncedSearch, statusFilter, reloadToken]);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleToggleStatus = async (review) => {
    setTogglingId(review.id);

    try {
      const actualizada = await reviewService.cambiarEstado(review.id, !review.activo);
      setSelectedReview((prev) => (prev?.id === actualizada.id ? actualizada : prev));
      setError("");
      reload();
    } catch (err) {
      setError(err?.message || "No se pudo actualizar el estado de la reseña.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenDetail = (review) => {
    setSelectedReview(review);
    setIsDetailOpen(true);
  };

  const reload = () => {
    setError("");
    setLoading(true);
    setReloadToken((valor) => valor + 1);
  };

  return {
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    page,
    setPage,
    meta,
    isDetailOpen,
    setIsDetailOpen,
    selectedReview,
    reviews,
    loading,
    error,
    reload,
    togglingId,
    handleToggleStatus,
    handleOpenDetail,
  };
};
