// src/services/exportacion.service.js
// Orquesta la generación de reportes descargables. Los controllers solo
// reciben el buffer y lo envían al cliente.
import { NotFoundError } from '../errors/index.js';
import { fechaActualLocal, formatearFecha } from '../utils/dates.js';
import { generarExcelDashboard } from '../utils/reportes/dashboardExcel.js';
import { generarPdfDashboard } from '../utils/reportes/dashboardPdf.js';
import { generarPdfVenta } from '../utils/reportes/ventaPdf.js';
import * as dashboardService from './dashboard.service.js';
import * as ventaService from './venta.service.js';

const TIPOS = {
  pdf: {
    extension: 'pdf',
    contentType: 'application/pdf',
  },
  excel: {
    extension: 'xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
};

function fechaArchivo() {
  return formatearFecha(fechaActualLocal());
}

export async function generarReporteDashboard({ formato, filtros = {} }) {
  const tipo = TIPOS[formato];
  if (!tipo) {
    throw new NotFoundError('Formato de reporte no encontrado.');
  }

  const datos = await dashboardService.obtenerReporte(filtros);
  const buffer =
    formato === 'excel'
      ? await generarExcelDashboard(datos)
      : await generarPdfDashboard(datos);

  return {
    buffer,
    filename: `reporte-ventas-${fechaArchivo()}.${tipo.extension}`,
    contentType: tipo.contentType,
  };
}

export async function generarComprobanteVentaPdf(id, usuario) {
  const venta = await ventaService.obtener(id, usuario);

  if (!Array.isArray(venta.lineas) || venta.lineas.length === 0) {
    throw new NotFoundError('La venta no tiene datos para exportar.');
  }

  return {
    buffer: await generarPdfVenta(venta),
    filename: `venta-${venta.id}-${fechaArchivo()}.pdf`,
    contentType: TIPOS.pdf.contentType,
  };
}
