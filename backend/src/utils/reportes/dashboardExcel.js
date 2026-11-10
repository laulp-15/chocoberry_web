// src/utils/reportes/dashboardExcel.js
// Libro Excel del Dashboard con hojas separadas, estilo ChocoBerry y formatos de moneda/fecha.
import ExcelJS from 'exceljs';
import {
  fechaHoyCorta,
  formatearMesLargo,
} from './formatos.js';

// Formatos numéricos
const MONEDA_FMT = '"$"#,##0';
const ENTERO_FMT = '#,##0';

// Paleta ChocoBerry (shared/css/tokens.css)
const COLOR_PRIMARIO = 'FFE63946';
const COLOR_PRIMARIO_OSCURO = 'FFC92F3C';
const COLOR_SECUNDARIO_1 = 'FFFAD2E1';
const COLOR_SECUNDARIO_2 = 'FFFCE8EF';
const COLOR_SECUNDARIO_3 = 'FFFEF7F9';
const COLOR_TEXTO = 'FF2A231D';
const COLOR_TEXTO_MUTED = 'FF675A51';
const COLOR_TEXTO_SUAVE = 'FFA4968B';
const COLOR_BORDE = 'FFE9D9DE';
const COLOR_BLANCO = 'FFFFFFFF';

const FUENTE = 'Calibri';
const FILA_ENCABEZADO = 4;

const BORDE_FINO = { style: 'thin', color: { argb: COLOR_BORDE } };
const BORDES = {
  top: BORDE_FINO,
  left: BORDE_FINO,
  bottom: BORDE_FINO,
  right: BORDE_FINO,
};

function relleno(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function formatoDe(tipo) {
  if (tipo === 'moneda') return MONEDA_FMT;
  if (tipo === 'entero') return ENTERO_FMT;
  return undefined;
}

/**
 * Crea una hoja con la estructura común:
 *  fila 1: banner de marca
 *  fila 2: título de la hoja · periodo · fecha de generación
 *  fila 3: espacio
 *  fila 4: encabezado de la tabla (si conTabla)
 */
function crearHoja(workbook, { nombre, titulo, periodo, columnas, conTabla = true }) {
  const hoja = workbook.addWorksheet(nombre, {
    properties: { tabColor: { argb: COLOR_PRIMARIO } },
    views: [
      {
        showGridLines: false,
        state: 'frozen',
        ySplit: conTabla ? FILA_ENCABEZADO : 2,
      },
    ],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
    },
  });

  hoja.columns = columnas.map(({ key, width }) => ({ key, width }));
  const total = columnas.length;

  // Banner de marca
  hoja.mergeCells(1, 1, 1, total);
  const banner = hoja.getCell(1, 1);
  banner.value = 'ChocoBerry · Reporte de ventas';
  banner.font = { name: FUENTE, bold: true, size: 16, color: { argb: COLOR_BLANCO } };
  banner.fill = relleno(COLOR_PRIMARIO);
  banner.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  hoja.getRow(1).height = 34;

  // Subtítulo
  hoja.mergeCells(2, 1, 2, total);
  const subtitulo = hoja.getCell(2, 1);
  subtitulo.value = `${titulo} · ${periodo} · Generado el ${fechaHoyCorta()}`;
  subtitulo.font = { name: FUENTE, size: 10, color: { argb: COLOR_TEXTO_MUTED } };
  subtitulo.fill = relleno(COLOR_SECUNDARIO_2);
  subtitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  hoja.getRow(2).height = 22;

  hoja.getRow(3).height = 8;

  if (conTabla) {
    const encabezado = hoja.getRow(FILA_ENCABEZADO);
    columnas.forEach((columna, indice) => {
      const cell = encabezado.getCell(indice + 1);
      cell.value = columna.header;
      cell.font = { name: FUENTE, bold: true, color: { argb: COLOR_BLANCO } };
      cell.fill = relleno(COLOR_PRIMARIO_OSCURO);
      cell.border = BORDES;
      cell.alignment = {
        vertical: 'middle',
        horizontal: columna.align === 'right' ? 'right' : columna.align ?? 'left',
        indent: 1,
      };
    });
    encabezado.height = 24;

    hoja.autoFilter = {
      from: { row: FILA_ENCABEZADO, column: 1 },
      to: { row: FILA_ENCABEZADO, column: total },
    };
  }

  return hoja;
}

function estiloFilaDatos(row, columnas, indice) {
  const fondo = indice % 2 === 0 ? COLOR_BLANCO : COLOR_SECUNDARIO_3;
  columnas.forEach((columna, i) => {
    const cell = row.getCell(i + 1);
    cell.font = { name: FUENTE, size: 11, color: { argb: COLOR_TEXTO } };
    cell.fill = relleno(fondo);
    cell.border = BORDES;
    cell.alignment = {
      vertical: 'middle',
      horizontal: columna.align ?? 'left',
      indent: 1,
    };
    const formato = formatoDe(columna.tipo);
    if (formato) cell.numFmt = formato;
  });
  row.height = 20;
}

function estiloFilaTotal(row, columnas) {
  columnas.forEach((columna, i) => {
    const cell = row.getCell(i + 1);
    cell.font = { name: FUENTE, bold: true, size: 11, color: { argb: COLOR_TEXTO } };
    cell.fill = relleno(COLOR_SECUNDARIO_1);
    cell.border = {
      ...BORDES,
      top: { style: 'medium', color: { argb: COLOR_PRIMARIO } },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: columna.align ?? 'left',
      indent: 1,
    };
    const formato = formatoDe(columna.tipo);
    if (formato) cell.numFmt = formato;
  });
  row.height = 24;
}

function agregarFilaVacia(hoja, columnas, mensaje) {
  const fila = hoja.addRow([mensaje]);
  hoja.mergeCells(fila.number, 1, fila.number, columnas.length);
  const cell = fila.getCell(1);
  cell.font = { name: FUENTE, italic: true, color: { argb: COLOR_TEXTO_SUAVE } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = BORDES;
  fila.height = 28;
}

/* ------------------------------ Resumen ------------------------------ */

function agregarResumen(workbook, datos) {
  const columnas = [
    { key: 'concepto', width: 38 },
    { key: 'valor', width: 30 },
  ];

  const hoja = crearHoja(workbook, {
    nombre: 'Resumen',
    titulo: 'Resumen general',
    periodo: formatearMesLargo(datos.periodo.mes),
    columnas,
    conTabla: false,
  });

  const secciones = [
    {
      titulo: 'Mes consultado',
      filas: [
        ['Mes consultado', formatearMesLargo(datos.periodo.mes), 'texto'],
        ['Producto más vendido del mes', datos.productoMasVendido ?? 'Sin ventas', 'texto'],
        ['Ventas del mes', datos.totales.totalMesSeleccionado, 'moneda'],
        ['Pedidos del mes', datos.totales.pedidosMesSeleccionado, 'entero'],
      ],
    },
    {
      titulo: `Año ${datos.ventasMes.anio}`,
      filas: [
        ['Año del gráfico mensual', String(datos.ventasMes.anio), 'texto'],
        ['Ventas del año', datos.totales.totalAnio, 'moneda'],
        ['Pedidos del año', datos.totales.pedidosAnio, 'entero'],
      ],
    },
  ];

  let fila = 4;
  for (const seccion of secciones) {
    // Encabezado de sección
    hoja.mergeCells(fila, 1, fila, 2);
    const cabecera = hoja.getCell(fila, 1);
    cabecera.value = seccion.titulo;
    cabecera.font = { name: FUENTE, bold: true, color: { argb: COLOR_BLANCO } };
    cabecera.fill = relleno(COLOR_PRIMARIO_OSCURO);
    cabecera.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    hoja.getRow(fila).height = 24;
    fila += 1;

    seccion.filas.forEach(([concepto, valor, tipo], indice) => {
      const actual = hoja.getRow(fila);
      const fondo = indice % 2 === 0 ? COLOR_BLANCO : COLOR_SECUNDARIO_3;

      const celdaConcepto = actual.getCell(1);
      celdaConcepto.value = concepto;
      celdaConcepto.font = { name: FUENTE, bold: true, color: { argb: COLOR_TEXTO_MUTED } };
      celdaConcepto.fill = relleno(fondo);
      celdaConcepto.border = BORDES;
      celdaConcepto.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      const celdaValor = actual.getCell(2);
      celdaValor.value = valor;
      celdaValor.font = { name: FUENTE, bold: true, color: { argb: COLOR_TEXTO } };
      celdaValor.fill = relleno(fondo);
      celdaValor.border = BORDES;
      celdaValor.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
      const formato = formatoDe(tipo);
      if (formato) celdaValor.numFmt = formato;

      actual.height = 22;
      fila += 1;
    });

    // Espacio entre secciones
    hoja.getRow(fila).height = 10;
    fila += 1;
  }
}

/* -------------------------- Ventas por semana -------------------------- */

function agregarSemana(workbook, datos) {
  const columnas = [
    { key: 'semana', header: 'Semana', width: 18, align: 'left' },
    { key: 'rango', header: 'Rango', width: 20, align: 'left' },
    { key: 'pedidos', header: 'Pedidos', width: 14, align: 'right', tipo: 'entero' },
    { key: 'total', header: 'Total', width: 20, align: 'right', tipo: 'moneda' },
  ];

  const hoja = crearHoja(workbook, {
    nombre: 'Ventas por semana',
    titulo: 'Ventas por semana',
    periodo: formatearMesLargo(datos.periodo.mes),
    columnas,
  });

  const filas = datos.semanasMes.data;
  if (!filas.length) {
    agregarFilaVacia(hoja, columnas, 'Sin semanas para el mes seleccionado');
    return;
  }

  filas.forEach((fila, indice) => {
    const actual = hoja.addRow([fila.label, fila.rango, fila.pedidos, fila.total]);
    estiloFilaDatos(actual, columnas, indice);
  });

  const total = hoja.addRow([
    'Total',
    '',
    datos.totales.pedidosMesSeleccionado,
    datos.totales.totalMesSeleccionado,
  ]);
  estiloFilaTotal(total, columnas);
}

/* --------------------------- Ventas por mes --------------------------- */

function agregarMes(workbook, datos) {
  const columnas = [
    { key: 'mes', header: 'Mes', width: 26, align: 'left' },
    { key: 'pedidos', header: 'Pedidos', width: 14, align: 'right', tipo: 'entero' },
    { key: 'total', header: 'Total', width: 20, align: 'right', tipo: 'moneda' },
  ];

  const hoja = crearHoja(workbook, {
    nombre: 'Ventas por mes',
    titulo: 'Ventas por mes',
    periodo: `Año ${datos.ventasMes.anio}`,
    columnas,
  });

  datos.ventasMes.data.forEach((fila, indice) => {
    const actual = hoja.addRow([formatearMesLargo(fila.mes), fila.pedidos, fila.total]);
    estiloFilaDatos(actual, columnas, indice);

    // Los meses sin ventas se muestran atenuados
    if (!fila.total && !fila.pedidos) {
      actual.eachCell((cell) => {
        cell.font = { name: FUENTE, size: 11, color: { argb: COLOR_TEXTO_SUAVE } };
      });
    }
  });

  const total = hoja.addRow([
    'Total del año',
    datos.totales.pedidosAnio,
    datos.totales.totalAnio,
  ]);
  estiloFilaTotal(total, columnas);
}

/* ------------------------ Productos más vendidos ------------------------ */

function agregarTopProductos(workbook, datos) {
  const columnas = [
    { key: 'posicion', header: '#', width: 8, align: 'center', tipo: 'entero' },
    { key: 'producto', header: 'Producto', width: 36, align: 'left' },
    { key: 'unidades', header: 'Unidades', width: 14, align: 'right', tipo: 'entero' },
    { key: 'ingresos', header: 'Ingresos', width: 20, align: 'right', tipo: 'moneda' },
  ];

  const hoja = crearHoja(workbook, {
    nombre: 'Productos más vendidos',
    titulo: 'Productos más vendidos',
    periodo: formatearMesLargo(datos.periodo.mes),
    columnas,
  });

  if (!datos.topProductos.length) {
    agregarFilaVacia(hoja, columnas, 'Sin ventas en el mes seleccionado');
    return;
  }

  datos.topProductos.forEach((producto, indice) => {
    const actual = hoja.addRow([
      indice + 1,
      producto.nombre,
      producto.unidades,
      producto.ingresos,
    ]);
    estiloFilaDatos(actual, columnas, indice);

    // Los 3 primeros puestos resaltan en el color primario
    if (indice < 3) {
      actual.getCell(1).font = {
        name: FUENTE,
        bold: true,
        size: 11,
        color: { argb: COLOR_PRIMARIO },
      };
      actual.getCell(2).font = {
        name: FUENTE,
        bold: true,
        size: 11,
        color: { argb: COLOR_TEXTO },
      };
    }
  });
}

/* ------------------------------ Exportar ------------------------------ */

export async function generarExcelDashboard(datos) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ChocoBerry';
  workbook.created = new Date();

  agregarResumen(workbook, datos);
  agregarSemana(workbook, datos);
  agregarMes(workbook, datos);
  agregarTopProductos(workbook, datos);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}