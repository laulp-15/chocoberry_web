
import { useCallback, useState } from "react";

import {
  obtenerProductosDestacados,
  obtenerReseñas,
} from "../services/homeService";

const useHome = () => {
  // Datos iniciales de la página
  const [productos] = useState(() => obtenerProductosDestacados() ?? []);
  const [reseñas] = useState(() => obtenerReseñas() ?? []);

  // Índice de la reseña actualmente seleccionada
  const [reseñaActual, setReseñaActual] = useState(0);

  // Avanzar a la siguiente reseña
  const siguienteReseña = useCallback(() => {
    if (reseñas.length <= 1) return;

    setReseñaActual((actual) => (actual + 1) % reseñas.length);
  }, [reseñas.length]);

  // Volver a la reseña anterior
  const anteriorReseña = useCallback(() => {
    if (reseñas.length <= 1) return;

    setReseñaActual(
      (actual) => (actual - 1 + reseñas.length) % reseñas.length
    );
  }, [reseñas.length]);

  // Seleccionar una reseña específica
  const seleccionarReseña = useCallback(
    (index) => {
      if (!Number.isInteger(index)) return;
      if (index < 0 || index >= reseñas.length) return;

      setReseñaActual(index);
    },
    [reseñas.length]
  );

  return {
    productos,
    reseñas,
    reseñaActual,
    siguienteReseña,
    anteriorReseña,
    seleccionarReseña,
  };
};

export default useHome;
