// src/features/admin/admin-reviews/services/reviewMappers.js
//
// Contrato del backend -> forma que usa el panel de reseñas.
// El backend entrega `estado` como booleano; el panel lo muestra como
// "Activo"/"Inactivo" y conserva el booleano para el switch.

export function mapResenaAdmin(resena) {
  if (!resena) return null;

  return {
    id: resena.id,
    cliente: resena.cliente || "Cliente ChocoBerry",
    calificacion: Number(resena.calificacion),
    comentario: resena.comentario || "",
    fecha: resena.fecha || "",
    estado: resena.estado ? "Activo" : "Inactivo",
    activo: Boolean(resena.estado),
  };
}

export function mapResenasAdmin(resenas) {
  return Array.isArray(resenas) ? resenas.map(mapResenaAdmin) : [];
}
