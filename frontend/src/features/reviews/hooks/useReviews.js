// src/features/reviews/hooks/useReviews.js
//
// Estado de las reseñas públicas. La lectura viene del catálogo público y
// la publicación usa la sesión del usuario autenticado.

import { useEffect, useState } from "react";
import { createReview, getReviews } from "../services/reviewService";

export const useReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let activo = true;

    getReviews()
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

  const addReview = async ({ calificacion, comentario }) => {
    // La reseña nace inactiva: no se agrega a la lista pública hasta que un
    // administrador la apruebe.
    return createReview({ calificacion, comentario });
  };

  const reload = () => {
    setError("");
    setLoading(true);
    setReloadToken((valor) => valor + 1);
  };

  return { reviews, loading, error, addReview, reload };
};
