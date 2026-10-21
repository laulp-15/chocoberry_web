// src/features/reviews/services/reviewService.js
//
// Reseñas públicas: la lectura no exige sesión y solo devuelve reseñas
// activas. Para publicar, el backend toma el usuario del token y define
// fecha y estado, por eso aquí solo se envían calificación y comentario.

import { api } from "../../../shared/api/client";
import { mapResenaPublica, mapResenasPublicas } from "./reviewMappers";

export async function getReviews() {
  const resenas = await api.get("/catalogo/resenas");
  return mapResenasPublicas(resenas);
}

export async function createReview({ calificacion, comentario }) {
  const resena = await api.post("/resenas", { calificacion, comentario });
  return mapResenaPublica(resena);
}
