// src/features/admin/orders/hooks/useOrderFormOptions.js
//
// Carga los catálogos que necesita el formulario de pedidos del panel:
// clientes activos, municipios activos, productos activos, presentaciones
// activas y glaseados activos. Se carga al montar el listado y se recarga al
// abrir el modal para que los maestros recién creados aparezcan de inmediato.

import { useEffect, useState } from "react";

import * as frostingService from "../../frostings/services/frostingService";
import * as municipalityService from "../../municipalities/services/municipalityService";
import * as presentationService from "../../presentations/services/presentationService";
import * as productService from "../../products/services/productService";
import * as userService from "../../users/services/userService";

const VACIO = {
  clientes: [],
  municipios: [],
  productos: [],
  presentaciones: [],
  glaseados: [],
};

function porNombre(a, b) {
  return String(a.nombre ?? "").localeCompare(String(b.nombre ?? ""), "es");
}

export default function useOrderFormOptions({ autoLoad = true } = {}) {
  const [options, setOptions] = useState(VACIO);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    Promise.all([
      userService.listar({ rol: "cliente", estado: true }),
      municipalityService.listar(),
      productService.listar(),
      presentationService.listar(),
      frostingService.listar(),
    ])
      .then(([clientes, municipios, productos, presentaciones, glaseados]) => {
        if (!activo) return;

        setOptions({
          clientes: clientes
            .filter((cliente) => cliente.active)
            .sort((a, b) => a.fullName.localeCompare(b.fullName, "es")),
          municipios: municipios
            .filter((municipio) => municipio.estado === "Activo")
            .sort(porNombre),
          productos: productos
            .filter((producto) => producto.estado === "Activo")
            .sort(porNombre),
          presentaciones: presentaciones
            .filter((presentacion) => presentacion.estado === "Activo")
            .sort((a, b) => a.cantidadFresas - b.cantidadFresas),
          glaseados: glaseados
            .filter((glaseado) => glaseado.estado === "Activo")
            .sort(porNombre),
        });
      })
      .catch((err) => {
        if (!activo) return;
        setError(
          err?.message || "No se pudieron cargar los datos del formulario."
        );
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

  return {
    ...options,
    loading,
    error,
    reload,
  };
}
