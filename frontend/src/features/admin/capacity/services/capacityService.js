// src/features/admin/capacity/services/capacityService.js
//
// Llamadas reales al backend de capacidad diaria (/api/capacidad). Solo esta
// capa conoce las rutas; el hook y la página consumen datos ya normalizados.

import { api } from "../../../../shared/api/client";

function numero(valor, respaldo = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : respaldo;
}

function mapPedido(pedido) {
  return {
    id: pedido?.id ?? null,
    fresas: numero(pedido?.fresas),
  };
}

function mapDia(dia) {
  if (!dia) return null;

  return {
    fecha: String(dia.fecha ?? ""),
    tope: numero(dia.tope),
    fresasAgendadas: numero(dia.fresasAgendadas),
    disponible: numero(dia.disponible),
    tieneExcepcion: Boolean(dia.tieneExcepcion),
    bloqueado: Boolean(dia.bloqueado),
    pedidos: Array.isArray(dia.pedidos) ? dia.pedidos.map(mapPedido) : [],
  };
}

function mapMes(respuesta, mesSolicitado) {
  return {
    mes: respuesta?.mes ?? mesSolicitado,
    topeEstandar: numero(respuesta?.topeEstandar),
    dias: Array.isArray(respuesta?.dias) ? respuesta.dias.map(mapDia) : [],
  };
}

/** GET /capacidad?mes=YYYY-MM */
export async function listarMes(mes) {
  const respuesta = await api.get(`/capacidad?mes=${encodeURIComponent(mes)}`);
  return mapMes(respuesta, mes);
}

/** GET /capacidad/:fecha */
export async function obtenerDia(fecha) {
  const respuesta = await api.get(`/capacidad/${encodeURIComponent(fecha)}`);
  return mapDia(respuesta);
}

/** PUT /capacidad/estandar */
export async function actualizarEstandar(maxFresas) {
  const respuesta = await api.put("/capacidad/estandar", { maxFresas });
  return { maxFresas: numero(respuesta?.maxFresas) };
}

/** PUT /capacidad/:fecha */
export async function actualizarDia(fecha, maxFresas) {
  const respuesta = await api.put(
    `/capacidad/${encodeURIComponent(fecha)}`,
    { maxFresas }
  );
  return mapDia(respuesta);
}

/** PUT /capacidad/:fecha/bloqueo */
export async function bloquearDia(fecha) {
  const respuesta = await api.put(
    `/capacidad/${encodeURIComponent(fecha)}/bloqueo`
  );
  return mapDia(respuesta);
}

/** DELETE /capacidad/:fecha */
export async function restablecerDia(fecha) {
  const respuesta = await api.del(
    `/capacidad/${encodeURIComponent(fecha)}`
  );
  return mapDia(respuesta);
}
