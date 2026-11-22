// src/utils/reportes/ventasExcel.js
// Excel del reporte de Ventas. Reutiliza la estructura, la paleta y los
// formatos del reporte del Dashboard.
import ExcelJS from 'exceljs';
import {
  crearHoja,
  estiloFilaDatos,
  estiloFilaTotal,
  agregarSeccionResumen,
  FUENTE,
  COLOR_TEXTO_SUAVE,
} from './dashboardExcel.js';
import { formatearFechaCorta } from './formatos.js';

function formatearPeriodo(desde, hasta) {
  const inicio = formatearFechaCorta(desde);
  const fin = formatearFechaCorta(hasta);
  return inicio === fin ? inicio : `${inicio} al ${fin}`;
}

/* ------------------------------ Resumen ------------------------------ */

function agregarResumen(workbook, datos) {
  const columnas = [
    { key: 'concepto', width: 38 },
    { key: 'valor', width: 30 },
  ];
  const periodo = formatearPeriodo(datos.desde, datos.hasta);

  const hoja = crearHoja(workbook, {
    nombre: 'Resumen',
    titulo: 'Resumen de ventas',
    periodo,
    columnas,
    conTabla: false,
  });

  const { ventas, total, canceladas } = datos.resumen;
  const ticketPromedio =
    datos.resumen.ticketPromedio ?? (ventas > 0 ? Math.round(total / ventas) : 0);

  let fila = 4;
  fila = agregarSeccionResumen(hoja, fila, 'Periodo consultado', [
    ['Desde', formatearFechaCorta(datos.desde), 'texto'],
    ['Hasta', formatearFechaCorta(datos.hasta), 'texto'],
  ]);
  agregarSeccionResumen(hoja, fila, 'Ventas', [
    ['Número de ventas', ventas, 'entero'],
    ['Total vendido', total, 'moneda'],
    ['Ticket promedio', ticketPromedio, 'moneda'],
    ['Ventas canceladas', canceladas, 'entero'],
  ]);
}

/* ---------------------------- Por periodo ---------------------------- */

function agregarPeriodos(workbook, datos) {
  const columnas = [
    { key: 'periodo', header: 'Periodo', width: 36, align: 'left' },
    {
      key: 'ventas',
      header: 'Número de ventas',
      width: 18,
      align: 'right',
      tipo: 'entero',
    },
    { key: 'total', header: 'Total', width: 20, align: 'right', tipo: 'moneda' },
  ];

  const hoja = crearHoja(workbook, {
    nombre: 'Por periodo',
    titulo: 'Ventas por periodo',
    periodo: formatearPeriodo(datos.desde, datos.hasta),
    columnas,
  });

  datos.periodos.forEach((fila, indice) => {
    const actual = hoja.addRow([fila.periodo, fila.ventas, fila.total]);
    estiloFilaDatos(actual, columnas, indice);

    // Los periodos sin ventas se muestran atenuados
    if (!fila.ventas && !fila.total) {
      actual.eachCell((cell) => {
        cell.font = { name: FUENTE, size: 11, color: { argb: COLOR_TEXTO_SUAVE } };
      });
    }
  });

  const total = hoja.addRow([
    'Total',
    datos.resumen.ventas,
    datos.resumen.total,
  ]);
  estiloFilaTotal(total, columnas);
}

/* ------------------------------ Exportar ------------------------------ */

export async function generarExcelReporteVentas(datos) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ChocoBerry';
  workbook.created = new Date();

  agregarResumen(workbook, datos);
  agregarPeriodos(workbook, datos);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}