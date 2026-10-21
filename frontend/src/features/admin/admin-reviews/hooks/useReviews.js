// src/features/admin/admin-reviews/hooks/useReviews.js
//
// Listado de reseñas del panel contra /api/resenas. La búsqueda y la
// paginación las maneja DataTable; aquí solo se filtra por estado y se
// sincroniza el switch con el API.

import { useEffect, useState } from "react";
import * as reviewService from "../services/reviewService";

export const useReviews = () => {
  const [statusFilter, setStatusFilter] = useState("todos");

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    let activo = true;

    reviewService
      .listar()
      .then((data) => {
        if (!activo) return;
        setReviews(data);
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
  }, [reloadToken]);

  const filteredReviews = reviews.filter((review) => {
    if (statusFilter === "todos") return true;
    return statusFilter === "activo" ? review.activo : !review.activo;
  });

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const handleToggleStatus = async (review) => {
    setTogglingId(review.id);

    try {
      const actualizada = await reviewService.cambiarEstado(review.id, !review.activo);
      setReviews((prev) =>
        prev.map((item) => (item.id === review.id ? actualizada : item))
      );
      setSelectedReview((prev) => (prev?.id === actualizada.id ? actualizada : prev));
      setError("");
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
    statusFilter,
    handleStatusFilterChange,
    isDetailOpen,
    setIsDetailOpen,
    selectedReview,
    reviews: filteredReviews,
    loading,
    error,
    reload,
    togglingId,
    handleToggleStatus,
    handleOpenDetail,
  };
};
