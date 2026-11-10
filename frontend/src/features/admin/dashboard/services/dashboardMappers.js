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
  const semanasMes = resumen.semanasMes ?? {};
  const ventasMes = resumen.ventasMes ?? {};
  const disponibilidad = resumen.disponibilidad ?? {};

  return {
    periodo: {
      mes: resumen.periodo?.mes ?? null,
      anio: numero(resumen.periodo?.anio),
    },
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
    semanasMes: {
      mes: semanasMes.mes ?? null,
      data: (semanasMes.data ?? []).map((fila) => ({
        semana: numero(fila.semana),
        label: fila.label,
        rango: fila.rango,
        desde: fila.desde,
        hasta: fila.hasta,
        total: numero(fila.total),
        pedidos: numero(fila.pedidos),
        dias: (fila.dias ?? []).map((dia) => ({
          label: dia.dia,
          value: numero(dia.total),
          pedidos: numero(dia.pedidos),
          fecha: dia.fecha,
        })),
      })),
    },
    ventasMes: {
      anio: numero(ventasMes.anio),
      desde: ventasMes.desde ?? null,
      hasta: ventasMes.hasta ?? null,
      anterior: ventasMes.anterior ?? null,
      siguiente: ventasMes.siguiente ?? null,
      data: (ventasMes.data ?? []).map((fila) => ({
        label: fila.label,
        value: numero(fila.total),
        pedidos: numero(fila.pedidos),
        mes: fila.mes,
      })),
    },
    topProductos: (resumen.topProductos ?? []).map((fila) => ({
      id: fila.id,
      name: fila.nombre,
      sold: numero(fila.unidades),
      revenue: numero(fila.ingresos),
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
    disponibilidad: {
      primerPedido: disponibilidad.primerPedido ?? null,
      ultimoPedido: disponibilidad.ultimoPedido ?? null,
      aniosDisponibles: (disponibilidad.aniosDisponibles ?? [])
        .map((anio) => numero(anio))
        .filter((anio) => anio > 0),
    },
  };
}
