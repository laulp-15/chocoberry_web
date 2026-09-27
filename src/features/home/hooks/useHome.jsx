// src/home/hooks/useHome.jsx

import { useState } from "react";
import {
  obtenerProductosDestacados,
  obtenerReseñas,
} from "../services/homeService";

const useHome = () => {
  const [productos] = useState(
    obtenerProductosDestacados()
  );

  const [reseñas] = useState(
    obtenerReseñas()
  );

  const [reseñaActual, setReseñaActual] = useState(0);


  const siguienteReseña = () => {
    setReseñaActual((actual) => {
      if (actual === reseñas.length - 1) {
        return 0;
      }

      return actual + 1;
    });
  };


  const anteriorReseña = () => {
    setReseñaActual((actual) => {
      if (actual === 0) {
        return reseñas.length - 1;
      }

      return actual - 1;
    });
  };


  const seleccionarReseña = (index) => {
    setReseñaActual(index);
  };


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