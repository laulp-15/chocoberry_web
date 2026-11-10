// src/utils/reportes/dashboardPdf.js
// Reporte PDF del Dashboard: indicadores y tablas, sin gráficas.
import {
  COLORES,
  ESTILOS,
  cajaKpi,
  crearPdf,
  encabezadoReporte,
  franjaInfo,
  piePagina,
  sinDatos,
  tabla,
  tituloSeccion,
} from './pdfBase.js';
import {
  fechaHoyCorta,
  formatearMesLargo,
  formatearMoneda,
} from './formatos.js';

export async function generarPdfDashboard(datos) {
  const { periodo, semanasMes, ventasMes, topProductos, totales } = datos;

  const filasSemana = semanasMes.data.map((fila) => [
    fila.label,
    fila.rango,
    String(fila.pedidos),
    formatearMoneda(fila.total),
  ]);

  const filasMes = ventasMes.data.map((fila) => {
    const sinVentas = !fila.total && !fila.pedidos;
    const atenuado = sinVentas ? { color: COLORES.textoSuave } : {};
    return [
      { text: formatearMesLargo(fila.mes), ...atenuado },
      { text: String(fila.pedidos), ...atenuado },
      { text: formatearMoneda(fila.total), ...atenuado },
    ];
  });

  const filasTop = topProductos.map((fila, indice) => [
    // Los 3 primeros puestos resaltan en el color primario
    indice < 3
      ? { text: String(indice + 1), bold: true, color: COLORES.primario }
      : String(indice + 1),
    indice < 3 ? { text: fila.nombre, bold: true } : fila.nombre,
    String(fila.unidades),
    formatearMoneda(fila.ingresos),
  ]);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 55],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORES.texto },
    styles: ESTILOS,
    info: {
      title: 'Reporte de ventas - ChocoBerry',
      author: 'ChocoBerry',
    },
    footer: piePagina,
    content: [
      encabezadoReporte({
        titulo: 'Reporte de ventas',
        subtitulo: `Generado el ${fechaHoyCorta()}`,
      }),

      franjaInfo([
        { etiqueta: 'Mes consultado', valor: formatearMesLargo(periodo.mes) },
        { etiqueta: 'Año del gráfico mensual', valor: String(ventasMes.anio) },
        {
          etiqueta: 'Producto más vendido del mes',
          valor: datos.productoMasVendido ?? 'Sin ventas',
        },
      ]),

      {
        columns: [
          {
            width: '*',
            ...cajaKpi({
              etiqueta: 'Ventas del mes',
              valor: formatearMoneda(totales.totalMesSeleccionado),
            }),
          },
          {
            width: '*',
            ...cajaKpi({
              etiqueta: 'Pedidos del mes',
              valor: String(totales.pedidosMesSeleccionado),
            }),
          },
          {
            width: '*',
            ...cajaKpi({
              etiqueta: 'Ventas del año',
              valor: formatearMoneda(totales.totalAnio),
            }),
          },
          {
            width: '*',
            ...cajaKpi({
              etiqueta: 'Pedidos del año',
              valor: String(totales.pedidosAnio),
            }),
          },
        ],
        columnGap: 8,
      },

      tituloSeccion('Ventas por semana'),
      filasSemana.length
        ? tabla({
            headers: ['Semana', 'Rango', 'Pedidos', 'Total'],
            rows: filasSemana,
            widths: ['*', 'auto', 'auto', 'auto'],
            aligns: ['left', 'left', 'right', 'right'],
            totales: [
              'Total del mes',
              '',
              String(totales.pedidosMesSeleccionado),
              formatearMoneda(totales.totalMesSeleccionado),
            ],
          })
        : sinDatos('Sin semanas para el mes seleccionado'),

      tituloSeccion('Ventas por mes'),
      tabla({
        headers: ['Mes', 'Pedidos', 'Total'],
        rows: filasMes,
        widths: ['*', 'auto', 'auto'],
        aligns: ['left', 'right', 'right'],
        totales: [
          'Total del año',
          String(totales.pedidosAnio),
          formatearMoneda(totales.totalAnio),
        ],
      }),

      tituloSeccion('Productos más vendidos del mes seleccionado'),
      filasTop.length
        ? tabla({
            headers: ['#', 'Producto', 'Unidades', 'Ingresos'],
            rows: filasTop,
            widths: ['auto', '*', 'auto', 'auto'],
            aligns: ['left', 'left', 'right', 'right'],
          })
        : sinDatos('Sin ventas en el mes seleccionado'),
    ],
  };

  return crearPdf(docDefinition);
}