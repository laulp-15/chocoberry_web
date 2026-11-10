// src/utils/reportes/ventaPdf.js
// Comprobante PDF de una venta. Reutiliza los totales ya serializados.
import {
  COLORES,
  ESTILOS,
  crearPdf,
  obtenerLogoDataUrl,
} from './pdfBase.js';
import {
  fechaHoyCorta,
  formatearFechaCorta,
  formatearFechaHora,
  formatearMoneda,
} from './formatos.js';

// Datos de contacto que se muestran en el pie de página
const CONTACTO_NEGOCIO = {
  nombre: 'ChocoBerry · Fresas Medellín',
  telefono: '316 499 8627',
  correo: 'leidyfigueroab@gmail.com',
};

const COLOR_LINEA = COLORES.textoSuave;
const ALTO_BANDA = 16;

/* ----------------------------- Helpers ----------------------------- */

// Barra rosada de sección (como "INFORMACIÓN DE CONTACTO" de la plantilla)
function barraSeccion(texto) {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: texto.toUpperCase(),
            bold: true,
            fontSize: 9,
            characterSpacing: 0.8,
            color: COLORES.texto,
            fillColor: COLORES.secundario1,
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
    margin: [0, 14, 0, 0],
  };
}

// "Etiqueta: valor" en una sola línea
function campoTexto(etiqueta, valor, extra = {}) {
  return {
    text: [
      { text: `${etiqueta}: `, color: COLORES.textoMuted, fontSize: 8 },
      { text: valor || '—', bold: true, fontSize: 9, ...extra },
    ],
  };
}

// Campos en filas subrayadas. Cada fila es un arreglo de 1 campo (ancho
// completo) o de 2 campos (dos columnas). Un campo es [etiqueta, valor, extra?]
function gridCampos(filas) {
  const body = filas.map((fila) => {
    if (fila.length === 1) {
      return [{ ...campoTexto(...fila[0]), colSpan: 2 }, {}];
    }
    return [campoTexto(...fila[0]), campoTexto(...fila[1])];
  });

  return {
    table: { widths: ['*', '*'], body },
    layout: {
      hLineWidth: (i) => (i === 0 ? 0 : 0.5),
      hLineColor: () => COLOR_LINEA,
      vLineWidth: () => 0,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 5,
      paddingBottom: () => 4,
    },
  };
}

// Tabla con encabezado rosado y cuadrícula completa
function tablaCuadricula({ headers, widths, aligns = [], rows, vacio }) {
  const encabezado = headers.map((header, indice) => ({
    text: header.toUpperCase(),
    bold: true,
    fontSize: 8,
    characterSpacing: 0.8,
    color: COLORES.texto,
    fillColor: COLORES.secundario1,
    alignment: aligns[indice] ?? 'left',
  }));

  const cuerpo = rows.length
    ? rows
    : [
        [
          {
            text: vacio ?? 'Sin registros',
            colSpan: headers.length,
            italics: true,
            color: COLORES.textoSuave,
            alignment: 'center',
            fontSize: 9,
          },
          ...Array(headers.length - 1).fill({}),
        ],
      ];

  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths,
      body: [encabezado, ...cuerpo],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLOR_LINEA,
      vLineColor: () => COLOR_LINEA,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
    margin: [0, 8, 0, 0],
  };
}

function celda(texto, alignment = 'left', extra = {}) {
  return { text: texto, fontSize: 8, color: COLORES.texto, alignment, ...extra };
}

function enlace(texto, url) {
  return url
    ? {
        text: texto,
        link: url,
        fontSize: 8,
        color: COLORES.primarioOscuro,
        decoration: 'underline',
      }
    : celda('—');
}

function filaTotales(etiqueta, valor, { total = false, saldo = false } = {}) {
  return [
    total
      ? {
          text: 'TOTAL',
          bold: true,
          fontSize: 9,
          characterSpacing: 1,
          alignment: 'center',
          fillColor: COLORES.secundario1,
          color: COLORES.texto,
        }
      : { text: etiqueta, fontSize: 8, color: COLORES.textoMuted, bold: saldo },
    {
      text: formatearMoneda(valor),
      alignment: 'right',
      bold: total || saldo,
      fontSize: total ? 11 : 9,
      color: saldo ? COLORES.primarioOscuro : COLORES.texto,
    },
  ];
}

function encabezadoComprobante(venta) {
  const numero = String(venta.id).padStart(5, '0');

  return {
    columns: [
      { image: obtenerLogoDataUrl(), width: 105 },
      {
        width: '*',
        alignment: 'right',
        stack: [
          {
            text: 'COMPROBANTE DE VENTA',
            fontSize: 11,
            bold: true,
            characterSpacing: 3,
            color: COLORES.texto,
          },
          {
            text: `N° ${numero}`,
            fontSize: 15,
            color: COLORES.primarioOscuro,
            margin: [0, 4, 0, 0],
          },
          { text: `Generado el ${fechaHoyCorta()}`, style: 'subtitulo' },
        ],
      },
    ],
    columnGap: 16,
    margin: [0, 0, 0, 4],
  };
}

// Pie con datos de contacto centrados + banda rosada al final de la hoja
function piePaginaComprobante(currentPage, pageCount) {
  return {
    alignment: 'center',
    margin: [40, 0, 40, 0],
    stack: [
      { text: CONTACTO_NEGOCIO.nombre, bold: true, fontSize: 8, color: COLORES.texto },
      {
        text: `${CONTACTO_NEGOCIO.telefono} · ${CONTACTO_NEGOCIO.correo}`,
        fontSize: 8,
        color: COLORES.textoMuted,
        margin: [0, 2, 0, 0],
      },
      { text: CONTACTO_NEGOCIO.direccion, fontSize: 8, color: COLORES.textoMuted },
      {
        text: `Página ${currentPage} de ${pageCount}`,
        fontSize: 7,
        color: COLORES.textoSuave,
        margin: [0, 4, 0, 0],
      },
    ],
  };
}

function bandaInferior(currentPage, pageSize) {
  return {
    canvas: [
      {
        type: 'rect',
        x: 0,
        y: pageSize.height - ALTO_BANDA,
        w: pageSize.width,
        h: ALTO_BANDA,
        color: COLORES.secundario1,
      },
    ],
  };
}

/* ------------------------------ Documento ------------------------------ */

export async function generarPdfVenta(venta) {
  const cliente = venta.cliente ?? {};
  const lineas = Array.isArray(venta.lineas) ? venta.lineas : [];
  const comprobantes = Array.isArray(venta.comprobantes) ? venta.comprobantes : [];

  const filasProductos = lineas.map((linea) => {
    const personalizacion = [
      linea.colorGlaseado?.nombre ? `Color ${linea.colorGlaseado.nombre}` : null,
      linea.mensajePersonalizado ? `“${linea.mensajePersonalizado}”` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return [
      {
        stack: [
          { text: linea.producto?.nombre ?? 'Producto', bold: true, fontSize: 9 },
          ...(personalizacion
            ? [
                {
                  text: personalizacion,
                  fontSize: 8,
                  color: COLORES.textoMuted,
                  margin: [0, 2, 0, 0],
                },
              ]
            : []),
        ],
      },
      celda(`${linea.presentacion?.cantidadFresas ?? '—'} fresas`, 'center'),
      celda(String(linea.cantidadProductos ?? 0), 'center'),
      celda(formatearMoneda(linea.precioUnitario), 'right'),
      celda(formatearMoneda(linea.subtotal), 'right', { bold: true }),
    ];
  });

  const filasComprobantes = comprobantes.map((comprobante, indice) => [
    celda(String(indice + 1), 'center'),
    celda(formatearFechaHora(comprobante.fecha)),
    celda(comprobante.estado?.nombre ?? '—'),
    celda(
      comprobante.monto === null || comprobante.monto === undefined
        ? 'Pendiente'
        : formatearMoneda(comprobante.monto),
      'right'
    ),
    enlace('Ver comprobante', comprobante.url),
    celda(comprobante.motivoRechazo || '—'),
  ]);

  const contenido = [
    encabezadoComprobante(venta),

    // Información del cliente
    barraSeccion('Información de contacto'),
    gridCampos([
      [['Nombre y apellido', cliente.nombreCompleto]],
      [
        [
          'Documento',
          `${cliente.tipoDocumento ?? ''} ${cliente.numeroDocumento ?? ''}`.trim(),
        ],
        ['Teléfono', cliente.telefono],
      ],
      [['Correo', cliente.correo]],
    ]),

    // Venta y entrega
    barraSeccion('Información de la venta y entrega'),
    gridCampos([
      [
        ['Fecha de venta', formatearFechaHora(venta.fecha)],
        ['Estado', venta.estado?.nombre],
      ],
      [
        ['Fecha de entrega', formatearFechaCorta(venta.fechaEntrega)],
        ['Municipio', venta.municipio?.nombre],
      ],
      [['Dirección', venta.direccion]],
      [
        ['Receptor', venta.nombreReceptor],
        ['Teléfono receptor', venta.telefonoReceptor],
      ],
    ]),

    // Productos
    tablaCuadricula({
      headers: ['Descripción', 'Presentación', 'Cantidad', 'Precio unit.', 'Subtotal'],
      widths: ['*', 'auto', 'auto', 'auto', 'auto'],
      aligns: ['left', 'center', 'center', 'right', 'right'],
      rows: filasProductos,
      vacio: 'Sin productos registrados',
    }),

    // Totales (caja de TOTAL como en la plantilla)
    {
      margin: [0, 12, 0, 0],
      columns: [
        { width: '*', text: '' },
        {
          width: 230,
          table: {
            widths: ['*', 'auto'],
            body: [
              filaTotales('Subtotal', venta.subtotal),
              filaTotales('Domicilio', venta.precioDomicilio),
              filaTotales('Total', venta.total, { total: true }),
              filaTotales('Pagado', venta.totalPagado),
              filaTotales('Saldo', venta.saldo, { saldo: true }),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            hLineColor: () => COLORES.borde,
            vLineWidth: () => 0,
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
      ],
    },
  ];

  // Información adicional (solo los campos que existan)
  const detalles = [
    venta.mensajeTarjeta ? ['Mensaje de la tarjeta', venta.mensajeTarjeta] : null,
    venta.instruccionesEntrega
      ? ['Instrucciones de entrega', venta.instruccionesEntrega]
      : null,
    venta.observacionesEntrega
      ? ['Observaciones de entrega', venta.observacionesEntrega]
      : null,
    venta.motivoRechazo ? ['Motivo de rechazo', venta.motivoRechazo] : null,
    venta.fechaCancelacion
      ? ['Fecha de cancelación', formatearFechaHora(venta.fechaCancelacion)]
      : null,
    venta.evidenciaEntrega
      ? [
          'Evidencia de entrega',
          'Ver evidencia',
          {
            link: venta.evidenciaEntrega,
            color: COLORES.primarioOscuro,
            decoration: 'underline',
          },
        ]
      : null,
  ].filter(Boolean);

  if (detalles.length) {
    contenido.push(barraSeccion('Información adicional'));
    contenido.push(gridCampos(detalles.map((detalle) => [detalle])));
  }

  if (filasComprobantes.length) {
    contenido.push(barraSeccion('Comprobantes de pago'));
    contenido.push(
      tablaCuadricula({
        headers: ['#', 'Fecha', 'Estado', 'Monto', 'Archivo', 'Motivo de rechazo'],
        widths: ['auto', 'auto', 'auto', 'auto', '*', '*'],
        aligns: ['center', 'left', 'left', 'right', 'left', 'left'],
        rows: filasComprobantes,
      })
    );
  }

  return crearPdf({
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 75],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: COLORES.texto },
    styles: ESTILOS,
    info: {
      title: `Comprobante de venta #${venta.id} - ChocoBerry`,
      author: 'ChocoBerry',
    },
    background: bandaInferior,
    footer: piePaginaComprobante,
    content: contenido,
  });
}