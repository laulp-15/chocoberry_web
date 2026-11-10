// src/utils/reportes/pdfBase.js
// Configuración compartida de pdfmake para los reportes del backend.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pdfMake from 'pdfmake';

const ASSETS_DIR = fileURLToPath(new URL('../../../assets/', import.meta.url));
const LOGO_PATH = path.join(ASSETS_DIR, 'logo.png');

// Ancho útil de la página A4 con márgenes de 40
const ANCHO_UTIL = 515;

// Paleta ChocoBerry (shared/css/tokens.css)
export const COLORES = {
  primario: '#E63946',
  primarioOscuro: '#C92F3C',
  secundario1: '#FAD2E1',
  secundario2: '#FCE8EF',
  secundario3: '#FEF7F9',
  texto: '#2A231D',
  textoMuted: '#675A51',
  textoSuave: '#A4968B',
  borde: '#E9D9DE',
  blanco: '#FFFFFF',
};

let configurado = false;
let logoDataUrl = null;

function configurar() {
  if (configurado) return;

  pdfMake.setFonts({
    Roboto: {
      normal: path.join(ASSETS_DIR, 'fonts', 'Roboto-Regular.ttf'),
      bold: path.join(ASSETS_DIR, 'fonts', 'Roboto-Medium.ttf'),
      italics: path.join(ASSETS_DIR, 'fonts', 'Roboto-Italic.ttf'),
      bolditalics: path.join(ASSETS_DIR, 'fonts', 'Roboto-MediumItalic.ttf'),
    },
  });
  pdfMake.setLocalAccessPolicy((ruta) => path.resolve(ruta).startsWith(ASSETS_DIR));
  pdfMake.setUrlAccessPolicy(() => false);
  configurado = true;
}

export function obtenerLogoDataUrl() {
  if (!logoDataUrl) {
    logoDataUrl = `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
  }
  return logoDataUrl;
}

export async function crearPdf(docDefinition) {
  configurar();
  const documento = pdfMake.createPdf(docDefinition);
  return documento.getBuffer();
}

export const ESTILOS = {
  marca: { fontSize: 16, bold: true, color: COLORES.primario },
  marcaSub: { fontSize: 9, color: COLORES.textoMuted, margin: [0, 1, 0, 8] },
  titulo: { fontSize: 18, bold: true, color: COLORES.texto },
  subtitulo: { fontSize: 9, color: COLORES.textoMuted, margin: [0, 2, 0, 0] },
  seccion: {
    fontSize: 11,
    bold: true,
    color: COLORES.primarioOscuro,
    margin: [0, 16, 0, 4],
  },
  etiqueta: { fontSize: 8, color: COLORES.textoMuted },
  valor: { fontSize: 10, bold: true, color: COLORES.texto, margin: [0, 2, 0, 0] },
  kpiValor: { fontSize: 14, bold: true, color: COLORES.primarioOscuro },
  celda: { fontSize: 8, color: COLORES.texto },
  celdaSuave: { fontSize: 8, color: COLORES.textoSuave },
  celdaTotal: { fontSize: 8, bold: true, color: COLORES.texto },
  vacio: { fontSize: 9, italics: true, color: COLORES.textoSuave, alignment: 'center' },
};

function linea({ color, grosor = 1 }) {
  return {
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: ANCHO_UTIL,
        y2: 0,
        lineWidth: grosor,
        lineColor: color,
      },
    ],
  };
}

export function encabezadoReporte({ titulo, subtitulo }) {
  return {
    stack: [
      {
        columns: [
          { image: obtenerLogoDataUrl(), width: 105 },
          {
            width: '*',
            alignment: 'right',
            stack: [
              { text: 'ChocoBerry', style: 'marca' },
              { text: 'Fresas Medellín', style: 'marcaSub' },
              { text: titulo, style: 'titulo' },
              { text: subtitulo, style: 'subtitulo' },
            ],
          },
        ],
        columnGap: 16,
        margin: [0, 0, 0, 10],
      },
      linea({ color: COLORES.primario, grosor: 2 }),
    ],
    margin: [0, 0, 0, 14],
  };
}

// Título de sección con línea fina debajo
export function tituloSeccion(texto) {
  return {
    stack: [
      { text: texto, style: 'seccion' },
      linea({ color: COLORES.borde, grosor: 0.75 }),
    ],
    margin: [0, 0, 0, 6],
  };
}

// Franja informativa (p. ej. mes consultado, año, producto más vendido)
export function franjaInfo(items) {
  return {
    table: {
      widths: items.map(() => '*'),
      body: [
        items.map(({ etiqueta, valor }) => ({
          fillColor: COLORES.secundario2,
          stack: [
            { text: etiqueta, style: 'etiqueta' },
            { text: valor, style: 'valor' },
          ],
        })),
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 8,
      paddingBottom: () => 8,
    },
    margin: [0, 0, 0, 10],
  };
}

export function tabla({ headers, rows, widths, aligns = [], totales }) {
  const celdaDato = (valor, indice) => {
    const base = {
      text: valor,
      style: 'celda',
      alignment: aligns[indice] ?? 'left',
    };
    // Permite pasar una celda con estilos propios: { text, bold, color... }
    return valor !== null && typeof valor === 'object' ? { ...base, ...valor } : base;
  };

  const body = [
    headers.map((header, indice) => ({
      text: header,
      bold: true,
      color: COLORES.blanco,
      fillColor: COLORES.primarioOscuro,
      fontSize: 8,
      alignment: aligns[indice] ?? 'left',
    })),
    ...rows.map((row) => row.map(celdaDato)),
  ];

  if (totales) {
    body.push(
      totales.map((valor, indice) => ({
        text: valor,
        style: 'celdaTotal',
        fillColor: COLORES.secundario1,
        alignment: aligns[indice] ?? 'left',
      }))
    );
  }

  return {
    table: {
      headerRows: 1,
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      widths,
      body,
    },
    layout: {
      hLineWidth: (i, node) => (i === node.table.body.length ? 1 : 0.5),
      hLineColor: (i, node) =>
        i === node.table.body.length ? COLORES.primario : COLORES.borde,
      vLineWidth: () => 0,
      // Filas alternadas (la cabecera y el total llevan su propio color)
      fillColor: (rowIndex) =>
        rowIndex > 0 && rowIndex % 2 === 0 ? COLORES.secundario3 : null,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
  };
}

// Mensaje cuando una tabla no tiene datos
export function sinDatos(mensaje) {
  return {
    table: {
      widths: ['*'],
      body: [[{ text: mensaje, style: 'vacio', fillColor: COLORES.secundario3 }]],
    },
    layout: {
      hLineColor: () => COLORES.borde,
      vLineColor: () => COLORES.borde,
      paddingTop: () => 12,
      paddingBottom: () => 12,
    },
  };
}

export function cajaKpi({ etiqueta, valor }) {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            fillColor: COLORES.secundario3,
            stack: [
              { text: etiqueta, style: 'etiqueta' },
              { text: valor, style: 'kpiValor', margin: [0, 3, 0, 0] },
            ],
          },
        ],
      ],
    },
    layout: {
      // Acento rojo a la izquierda y borde suave alrededor
      hLineWidth: () => 0.5,
      hLineColor: () => COLORES.borde,
      vLineWidth: (i) => (i === 0 ? 3 : 0.5),
      vLineColor: (i) => (i === 0 ? COLORES.primario : COLORES.borde),
      paddingLeft: () => 10,
      paddingRight: () => 8,
      paddingTop: () => 8,
      paddingBottom: () => 8,
    },
  };
}

export function piePagina(currentPage, pageCount) {
  return {
    stack: [
      linea({ color: COLORES.borde, grosor: 0.75 }),
      {
        columns: [
          { text: 'ChocoBerry · Fresas Medellín', style: 'celdaSuave' },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: 'right',
            style: 'celdaSuave',
          },
        ],
        margin: [0, 6, 0, 0],
      },
    ],
    margin: [40, 0, 40, 0],
  };
}