// src/features/admin/dashboard/services/dashboardMappers.js
//
// Adapta la respuesta de /api/dashboard/resumen a la forma que esperan los
// componentes visuales del Dashboard. No recalcula reglas de negocio.
import { ORDER_STATUSES } from "../../orders/data/orderStatus";

const COLORES_CALIFICACION = {
  5: "var(--success-100)",
  4: "var(--success-80)",
  3: "var(--warning-80)",
  2: "var(--error-80)",
  1: "var(--error-100)",
};

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function colorEstado(nombre) {
  return ORDER_STATUSES.find((estado) => estado.label === nombre)?.color;
}

export function mapDashboardResumen(resumen) {
  if (!resumen) return null;

  const kpis = resumen.kpis ?? {};
  const calificaciones = resumen.calificaciones ?? {};
  const distribucion = Array.isArray(calificaciones.distribucion)
    ? calificaciones.distribucion
    : [];

  return {
    kpis: {
      pedidosPendientes: numero(kpis.pedidosPendientes),
      pedidosEntregados: numero(kpis.pedidosEntregados),
      ingresosMes: numero(kpis.ingresosMes),
      variacionPorcentual:
        kpis.variacionPorcentual === null || kpis.variacionPorcentual === undefined
          ? null
          : Number(kpis.variacionPorcentual),
      productoMasVendido: kpis.productoMasVendido ?? null,
    },
    ventasSemana: (resumen.ventasSemana?.data ?? []).map((fila) => ({
      label: fila.dia,
      value: numero(fila.total),
    })),
    ventasMes: (resumen.ventasMes?.data ?? []).map((fila) => ({
      label: fila.label,
      value: numero(fila.total),
    })),
    topProductos: (resumen.topProductos ?? []).map((fila) => ({
      name: fila.nombre,
      sold: numero(fila.unidades),
    })),
    pedidosPorMunicipio: (resumen.pedidosPorMunicipio ?? [])
      .map((fila) => ({
        label: fila.municipio,
        value: numero(fila.pedidos),
      }))
      .filter((fila) => fila.value > 0)
      .sort((a, b) => b.value - a.value),
    pedidosPorEstado: (resumen.pedidosPorEstado ?? [])
      .map((fila) => ({
        label: fila.estado,
        value: numero(fila.pedidos),
        color: colorEstado(fila.estado),
      }))
      .filter((fila) => fila.value > 0),
    calificaciones: {
      total: numero(calificaciones.total),
      promedio: numero(calificaciones.promedio),
      data: distribucion.map((fila) => ({
        label: `${fila.estrellas} ${fila.estrellas === 1 ? "estrella" : "estrellas"}`,
        value: numero(fila.cantidad),
        color: COLORES_CALIFICACION[fila.estrellas],
      })),
    },
  };
}
