// src/features/admin/capacity/hooks/useCapacity.js
//
// Estado del calendario de capacidad y mutaciones contra /api/capacidad.

import { useEffect, useState } from "react";

import * as capacityService from "../services/capacityService";
import { mesActualISO } from "../utils/capacityUtils";

const DATOS_INICIALES = {
  mes: "",
  topeEstandar: 0,
  dias: [],
};

export default function useCapacity() {
  const [mes, setMes] = useState(mesActualISO);
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const [selectedFecha, setSelectedFecha] = useState("");
  const [datosDia, setDatosDia] = useState(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState("");
  const [dayReloadToken, setDayReloadToken] = useState(0);

  const [savingStandard, setSavingStandard] = useState(false);
  const [savingDayLimit, setSavingDayLimit] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    let activo = true;

    capacityService
      .listarMes(mes)
      .then((respuesta) => {
        if (!activo) return;
        setDatos(respuesta);
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudo cargar la capacidad del mes.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [mes, reloadToken]);

  useEffect(() => {
    if (!selectedFecha) return undefined;

    let activo = true;

    capacityService
      .obtenerDia(selectedFecha)
      .then((dia) => {
        if (!activo) return;
        setDatosDia(dia);
        setDayError("");
      })
      .catch((err) => {
        if (!activo) return;
        setDayError(err?.message || "No se pudo cargar el detalle del día.");
      })
      .finally(() => {
        if (activo) setDayLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [selectedFecha, dayReloadToken]);

  function cambiarMes(nuevoMes) {
    if (nuevoMes === mes) return;

    setMes(nuevoMes);
    setLoading(true);
    setError("");
    setDatos((previo) => ({
      mes: nuevoMes,
      topeEstandar: previo.topeEstandar,
      dias: [],
    }));
    setSelectedFecha("");
    setDatosDia(null);
    setDayLoading(false);
    setDayError("");
  }

  function reload() {
    setLoading(true);
    setError("");
    setReloadToken((valor) => valor + 1);
  }

  function reloadDay() {
    if (!selectedFecha) return;
    setDayLoading(true);
    setDayError("");
    setDayReloadToken((valor) => valor + 1);
  }

  function seleccionarDia(fecha) {
    if (fecha === selectedFecha) {
      reloadDay();
      return;
    }

    setSelectedFecha(fecha);
    setDatosDia(null);
    setDayLoading(true);
    setDayError("");
  }

  async function actualizarEstandar(maxFresas) {
    setSavingStandard(true);
    try {
      const respuesta = await capacityService.actualizarEstandar(maxFresas);
      setDatos((previo) => ({
        ...previo,
        topeEstandar: respuesta.maxFresas,
      }));
      setReloadToken((valor) => valor + 1);
      if (selectedFecha) {
        setDayLoading(true);
        setDayError("");
        setDayReloadToken((valor) => valor + 1);
      }
      return respuesta;
    } finally {
      setSavingStandard(false);
    }
  }

  async function actualizarTopeDia(maxFresas) {
    if (!selectedFecha) return null;

    setSavingDayLimit(true);
    try {
      const dia = await capacityService.actualizarDia(
        selectedFecha,
        maxFresas
      );
      setDatosDia(dia);
      setDayError("");
      setReloadToken((valor) => valor + 1);
      return dia;
    } finally {
      setSavingDayLimit(false);
    }
  }

  async function bloquearDia() {
    if (!selectedFecha) return null;

    setSavingAction(true);
    try {
      const dia = await capacityService.bloquearDia(selectedFecha);
      setDatosDia(dia);
      setReloadToken((valor) => valor + 1);
      return dia;
    } finally {
      setSavingAction(false);
    }
  }

  async function restablecerDia() {
    if (!selectedFecha) return null;

    setSavingAction(true);
    try {
      const dia = await capacityService.restablecerDia(selectedFecha);
      setDatosDia(dia);
      setReloadToken((valor) => valor + 1);
      return dia;
    } finally {
      setSavingAction(false);
    }
  }

  return {
    mes,
    cambiarMes,
    datosMes: datos,
    topeEstandar: datos.topeEstandar,
    loading,
    error,
    reload,

    selectedFecha,
    seleccionarDia,
    datosDia,
    dayLoading,
    dayError,
    reloadDay,

    savingStandard,
    savingDayLimit,
    savingAction,
    actualizarEstandar,
    actualizarTopeDia,
    bloquearDia,
    restablecerDia,
  };
}
