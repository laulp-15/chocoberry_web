// src/services/dashboard.service.js
// Reglas de negocio del Dashboard. El período mensual (`mes`) gobierna los
// ingresos del mes, el producto más vendido, el top y las gráficas de semanas
// y meses. Los pedidos pendientes/entregados y los demás agregados siguen
// siendo una foto global del negocio.
import { NotFoundError } from '../errors/index.js';
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

function formatearDiaMes(fecha) {
  return `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(
    fecha.getUTCMonth() + 1
  ).padStart(2, '0')}`;
}

function rangoCorto(desde, hasta) {
  if (formatearFecha(desde) === formatearFecha(hasta)) {
    return formatearDiaMes(desde);
  }
  return `${formatearDiaMes(desde)} – ${formatearDiaMes(hasta)}`;
}

/**
 * Agrupa los días del mes en semanas de lunes a domingo. La primera y la
 * última semana se recortan al mes: nunca se agregan días externos.
 */
function construirSemanasMes(mesInicio, filasDias) {
  const porDia = new Map(filasDias.map((fila) => [fila.periodo, fila]));
  const grupos = new Map();
  const finExclusivo = sumarMeses(mesInicio, 1);

  for (let fecha = mesInicio; fecha < finExclusivo; fecha = sumarDias(fecha, 1)) {
    const claveSemana = formatearFecha(inicioSemana(fecha));
    let grupo = grupos.get(claveSemana);

    if (!grupo) {
      grupo = { desde: fecha, hasta: fecha, dias: [] };
      grupos.set(claveSemana, grupo);
    }

    grupo.hasta = fecha;
    const claveDia = formatearFecha(fecha);
    const fila = porDia.get(claveDia);

    grupo.dias.push({
      fecha: claveDia,
      dia: DIAS_SEMANA[(fecha.getUTCDay() + 6) % 7],
      total: redondear2(numero(fila?.total)),
      pedidos: numero(fila?.pedidos),
    });
  }

  return Array.from(grupos.values()).map((grupo, indice) => ({
    semana: indice + 1,
    label: `Semana ${indice + 1}`,
    rango: rangoCorto(grupo.desde, grupo.hasta),
    desde: formatearFecha(grupo.desde),
    hasta: formatearFecha(grupo.hasta),
    total: redondear2(grupo.dias.reduce((total, dia) => total + dia.total, 0)),
    pedidos: grupo.dias.reduce((total, dia) => total + dia.pedidos, 0),
    dias: grupo.dias,
  }));
}

function anioAnteriorDisponible(anios, anio) {
  const anteriores = anios.filter((valor) => valor < anio);
  return anteriores.length ? Math.max(...anteriores) : null;
}

function anioSiguienteDisponible(anios, anio, anioActual) {
  const siguientes = anios.filter((valor) => valor > anio && valor <= anioActual);
  return siguientes.length ? Math.min(...siguientes) : null;
}

export async function obtenerResumen(filtros = {}) {
  const hoy = fechaActualLocal();
  const anioActual = hoy.getUTCFullYear();
  const mesActualInicio = inicioMes(hoy);
  const mesReferencia = parseMes(filtros.mes) ?? mesActualInicio;
  const mesInicio = inicioMes(mesReferencia);
  const mesFinExclusivo = sumarMeses(mesInicio, 1);
  const anio = mesInicio.getUTCFullYear();
  const anioInicio = new Date(Date.UTC(anio, 0, 1));
  const anioFinExclusivo = new Date(Date.UTC(anio + 1, 0, 1));

  const rangoMesSeleccionado = {
    desde: fechaHora(mesInicio),
    hastaExclusiva: fechaHora(mesFinExclusivo),
    estados: ESTADOS_VENTA,
  };
  const rangoMesAnterior = {
    desde: fechaHora(sumarMeses(mesInicio, -1)),
    hastaExclusiva: fechaHora(mesInicio),
    estados: ESTADOS_VENTA,
  };

  const [
    filasDiasMes,
    filasMes,
    filasEstado,
    filasMunicipio,
    filaResenas,
    filasTopProductos,
    filaRango,
    ingresosMes,
    ingresosMesAnterior,
    filasAnios,
  ] = await Promise.all([
    dashboardModel.ingresosPorDia({
      desde: fechaHora(mesInicio),
      hastaExclusiva: fechaHora(mesFinExclusivo),
      estados: ESTADOS_VENTA,
    }),
    dashboardModel.ingresosPorMes({
      desde: fechaHora(anioInicio),
      hastaExclusiva: fechaHora(anioFinExclusivo),
      estados: ESTADOS_VENTA,
    }),
    dashboardModel.contarPedidosPorEstado(),
    dashboardModel.contarPedidosPorMunicipio(),
    dashboardModel.resumenResenas(),
    dashboardModel.topProductos({
      estados: ESTADOS_VENTA,
      limite: 5,
      desde: fechaHora(mesInicio),
      hastaExclusiva: fechaHora(mesFinExclusivo),
    }),
    dashboardModel.obtenerRangoPedidos(),
    dashboardModel.ingresosTotales(rangoMesSeleccionado),
    dashboardModel.ingresosTotales(rangoMesAnterior),
    dashboardModel.aniosConPedidos(),
  ]);

  const porMes = new Map(filasMes.map((fila) => [fila.periodo, fila]));
  const aniosDisponibles = [
    ...new Set(
      filasAnios
        .map((fila) => numero(fila.anio))
        .filter((valor) => valor > 0 && valor <= anioActual)
    ),
  ].sort((a, b) => a - b);

  const semanasMes = construirSemanasMes(mesInicio, filasDiasMes);

  const ventasMes = Array.from({ length: 12 }, (_, indice) => {
    const fecha = sumarMeses(anioInicio, indice);
    const clave = formatearMes(fecha);
    const fila = porMes.get(clave);

    return {
      mes: clave,
      label: `${MESES_CORTOS[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`,
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
    periodo: {
      mes: formatearMes(mesInicio),
      anio,
    },
    kpis: {
      pedidosPendientes: numero(buscarEstado(filasEstado, 'Pendiente')),
      pedidosEntregados: numero(buscarEstado(filasEstado, 'Entregado')),
      ingresosMes: totalMes,
      ingresosMesAnterior: totalMesAnterior,
      variacionPorcentual: variacion(totalMes, totalMesAnterior),
      productoMasVendido: topProductos[0]?.nombre ?? null,
    },
    semanasMes: {
      mes: formatearMes(mesInicio),
      data: semanasMes,
    },
    ventasMes: {
      anio,
      desde: formatearMes(anioInicio),
      hasta: formatearMes(sumarMeses(anioInicio, 11)),
      anterior: anioAnteriorDisponible(aniosDisponibles, anio),
      siguiente: anioSiguienteDisponible(aniosDisponibles, anio, anioActual),
      data: ventasMes,
    },
    topProductos,
    pedidosPorMunicipio,
    pedidosPorEstado,
    calificaciones: serializarCalificaciones(filaResenas),
    disponibilidad: {
      primerPedido: filaRango?.primer_pedido ?? null,
      ultimoPedido: filaRango?.ultimo_pedido ?? null,
      aniosDisponibles,
    },
  };
}

/**
 * Datos para los reportes exportables. Reutiliza el resumen del Dashboard,
 * incluido el top de productos del mes seleccionado.
 */
export async function obtenerReporte(filtros = {}) {
  const resumen = await obtenerResumen(filtros);
  const { periodo, semanasMes, ventasMes } = resumen;

  const mesSeleccionado =
    ventasMes.data.find((fila) => fila.mes === periodo.mes) ?? {
      total: 0,
      pedidos: 0,
    };
  const totalMesSeleccionado = redondear2(numero(mesSeleccionado.total));
  const pedidosMesSeleccionado = numero(mesSeleccionado.pedidos);
  const totalAnio = redondear2(
    ventasMes.data.reduce((total, fila) => total + fila.total, 0)
  );
  const pedidosAnio = ventasMes.data.reduce(
    (total, fila) => total + fila.pedidos,
    0
  );

  if (pedidosMesSeleccionado === 0 && pedidosAnio === 0) {
    throw new NotFoundError('No hay ventas para los filtros seleccionados.');
  }

  return {
    filtros: {
      mes: periodo.mes,
    },
    periodo,
    semanasMes,
    ventasMes,
    topProductos: resumen.topProductos,
    productoMasVendido: resumen.topProductos[0]?.nombre ?? null,
    totales: {
      totalMesSeleccionado,
      pedidosMesSeleccionado,
      totalAnio,
      pedidosAnio,
    },
  };
}
