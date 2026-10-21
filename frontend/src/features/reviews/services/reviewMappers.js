// src/features/reviews/services/reviewMappers.js
//
// Contrato del backend -> forma que usan las tarjetas públicas de reseñas.
// El backend devuelve { id, calificacion, comentario, fecha, estado, usuarioId, cliente };
// la vista solo necesita el nombre, las estrellas, el comentario y la fecha.

export function mapResenaPublica(resena) {
  if (!resena) return null;

  return {
    id: resena.id,
    clientName: resena.cliente || "Cliente ChocoBerry",
    rating: Number(resena.calificacion),
    comment: resena.comentario || "",
    date: resena.fecha || "",
  };
}

export function mapResenasPublicas(resenas) {
  return Array.isArray(resenas) ? resenas.map(mapResenaPublica) : [];
}
