// src/services/dashboard.service.js
// Reglas de negocio del Dashboard. Los KPIs son una foto actual del negocio
// (pendientes, entregados, ingresos del mes y producto más vendido); los
// parámetros `semana` y `mes` mueven las gráficas de ventas para que el
// frontend pueda navegar a períodos anteriores.
import { ESTADOS_VENTA } from './venta.service.js';
import * as dashboardModel from '../models/dashboard.model.js';
import { redondear2 } from '../utils/number.js';
import {
  fechaActualLocal,
  fechaHora,
  formatearFecha,
  formatearMes,
  inicioMes,
  inicioSemana,
  parseFecha,
  parseMes,
  sumarDias,
  sumarMeses,
} from '../utils/dates.js';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES_CORTOS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function variacion(actual, anterior) {
  if (anterior === 0) return null;
  return redondear2(((actual - anterior) / anterior) * 100);
}

function buscarEstado(filas, nombre) {
  return filas.find((fila) => fila.estado === nombre)?.pedidos ?? 0;
}

function serializarCalificaciones(fila) {
  const total = numero(fila?.total);
  const distribucion = [5, 4, 3, 2, 1].map((estrellas) => ({
    estrellas,
    cantidad: numero(fila?.[`estrellas_${estrellas}`]),
  }));

  return {
    promedio: total === 0 ? 0 : redondear2(fila.promedio),
    total,
    distribucion,
  };
}

export async function obtenerResumen(filtros = {}) {
  const hoy = fechaActualLocal();
  const semanaActualInicio = inicioSemana(hoy);
  const mesActualInicio = inicioMes(hoy);

  const semanaReferencia = parseFecha(filtros.semana) ?? hoy;
  const mesReferencia = parseMes(filtros.mes) ?? mesActualInicio;

  const semanaDesde = inicioSemana(semanaReferencia);
  const semanaHasta = sumarDias(semanaDesde, 6);
  const siguienteSemana = sumarDias(semanaDesde, 7);
  const semanaEsActual = formatearFecha(semanaDesde) === formatearFecha(semanaActualInicio);

  const mesDesde = sumarMeses(mesReferencia, -11);
  const mesHasta = mesReferencia;
  const siguienteMes = sumarMeses(mesReferencia, 12);
  const siguienteSemanaPermitida =
    siguienteSemana <= semanaActualInicio ? formatearFecha(siguienteSemana) : null;
  const siguienteMesPermitido =
    siguienteMes <= mesActualInicio ? formatearMes(siguienteMes) : null;

  const rangoMesActual = {
    desde: fechaHora(mesActualInicio),
    hastaExclusiva: fechaHora(sumarMeses(mesActualInicio, 1)),
    estados: ESTADOS_VENTA,
  };
  const rangoMesAnterior = {
    desde: fechaHora(sumarMeses(mesActualInicio, -1)),
    hastaExclusiva: fechaHora(mesActualInicio),
    estados: ESTADOS_VENTA,
  };

  const [
    filasSemana,
    filasMes,
    filasEstado,
    filasMunicipio,
    filaResenas,
    filasTopProductos,
    filaRango,
    ingresosMes,
    ingresosMesAnterior,
  ] = await Promise.all([
    dashboardModel.ingresosPorDia({
      desde: fechaHora(semanaDesde),
      hastaExclusiva: fechaHora(sumarDias(semanaHasta, 1)),
      estados: ESTADOS_VENTA,
    }),
    dashboardModel.ingresosPorMes({
      desde: fechaHora(mesDesde),
      hastaExclusiva: fechaHora(sumarMeses(mesHasta, 1)),
      estados: ESTADOS_VENTA,
    }),
    dashboardModel.contarPedidosPorEstado(),
    dashboardModel.contarPedidosPorMunicipio(),
    dashboardModel.resumenResenas(),
    dashboardModel.topProductos({ estados: ESTADOS_VENTA, limite: 5 }),
    dashboardModel.obtenerRangoPedidos(),
    dashboardModel.ingresosTotales(rangoMesActual),
    dashboardModel.ingresosTotales(rangoMesAnterior),
  ]);

  const porDia = new Map(filasSemana.map((fila) => [fila.periodo, fila]));
  const porMes = new Map(filasMes.map((fila) => [fila.periodo, fila]));

  const ventasSemana = Array.from({ length: 7 }, (_, indice) => {
    const fecha = sumarDias(semanaDesde, indice);
    const clave = formatearFecha(fecha);
    const fila = porDia.get(clave);
    const esFuturo = semanaEsActual && fecha > hoy;

    return {
      dia: DIAS_SEMANA[indice],
      fecha: clave,
      total: esFuturo ? 0 : redondear2(numero(fila?.total)),
      pedidos: esFuturo ? 0 : numero(fila?.pedidos),
    };
  });

  const ventasMes = Array.from({ length: 12 }, (_, indice) => {
    const fecha = sumarMeses(mesDesde, indice);
    const clave = formatearMes(fecha);
    const fila = porMes.get(clave);

    return {
      mes: clave,
      label: MESES_CORTOS[fecha.getUTCMonth()],
      total: redondear2(numero(fila?.total)),
      pedidos: numero(fila?.pedidos),
    };
  });

  const topProductos = filasTopProductos.map((fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    unidades: numero(fila.unidades),
    ingresos: redondear2(numero(fila.ingresos)),
  }));

  const pedidosPorEstado = filasEstado.map((fila) => ({
    id: fila.id,
    estado: fila.estado,
    pedidos: numero(fila.pedidos),
  }));

  const pedidosPorMunicipio = filasMunicipio.map((fila) => ({
    id: fila.id,
    municipio: fila.municipio,
    pedidos: numero(fila.pedidos),
  }));

  const totalMes = redondear2(numero(ingresosMes.total));
  const totalMesAnterior = redondear2(numero(ingresosMesAnterior.total));

  return {
    kpis: {
      pedidosPendientes: numero(buscarEstado(filasEstado, 'Pendiente')),
      pedidosEntregados: numero(buscarEstado(filasEstado, 'Entregado')),
      ingresosMes: totalMes,
      ingresosMesAnterior: totalMesAnterior,
      variacionPorcentual: variacion(totalMes, totalMesAnterior),
      productoMasVendido: topProductos[0]?.nombre ?? null,
    },
    ventasSemana: {
      desde: formatearFecha(semanaDesde),
      hasta: formatearFecha(semanaHasta),
      anterior: formatearFecha(sumarDias(semanaDesde, -7)),
      siguiente: siguienteSemanaPermitida,
      data: ventasSemana,
    },
    ventasMes: {
      desde: formatearMes(mesDesde),
      hasta: formatearMes(mesHasta),
      anterior: formatearMes(sumarMeses(mesReferencia, -12)),
      siguiente: siguienteMesPermitido,
      data: ventasMes,
    },
    topProductos,
    pedidosPorMunicipio,
    pedidosPorEstado,
    calificaciones: serializarCalificaciones(filaResenas),
    disponibilidad: {
      primerPedido: filaRango?.primer_pedido ?? null,
      ultimoPedido: filaRango?.ultimo_pedido ?? null,
    },
  };
}
