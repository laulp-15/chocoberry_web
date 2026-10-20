// scripts/seed-pedidos.mjs
// Genera un lote de 15 pedidos de demostración con los catálogos reales.
//
// - Usa los services de pedidos para calcular precios, domicilios y estados.
// - Ajusta la fecha de creación para que el listado quede ordenado como una
//   línea de tiempo real: los más recientes primero.
// - Deja varios pedidos sin comprobante para simular pagos pendientes.
// - No escribe etiquetas [SEED] en los pedidos. El lote se identifica con el
//   manifiesto local scripts/.seed-pedidos.json (ignorado por git).
// - `npm run seed:pedidos -- --reset` elimina el lote anterior (incluidos los
//   seeds viejos con etiqueta [SEED-xx]) y vuelve a crear los 15 pedidos.
//
// Uso:
//   npm run seed:pedidos
//   npm run seed:pedidos -- --reset
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from '../src/config/db.js';
import { uploadsDir } from '../src/middlewares/upload.js';
import * as colorGlaseadoModel from '../src/models/colorGlaseado.model.js';
import * as municipioModel from '../src/models/municipio.model.js';
import * as presentacionModel from '../src/models/presentacion.model.js';
import * as productoModel from '../src/models/producto.model.js';
import * as usuarioModel from '../src/models/usuario.model.js';
import * as pedidoService from '../src/services/pedido.service.js';

const DIR_SCRIPT = path.dirname(fileURLToPath(import.meta.url));
const MANIFIESTO_ARCHIVO = path.join(DIR_SCRIPT, '.seed-pedidos.json');
const PATRON_LEGACY = /\[SEED-\d{2}\]/;

const COMPROBANTE_GENERICO_RUTA = '/uploads/comprobante-pago.svg';
const COMPROBANTE_GENERICO_ARCHIVO = path.join(uploadsDir, 'comprobante-pago.svg');
const COMPROBANTE_LEGACY_ARCHIVO = path.join(uploadsDir, 'seed-comprobante.svg');

const COMPROBANTE_GENERICO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
  <rect width="720" height="960" fill="#F8FAFC"/>
  <rect x="40" y="40" width="640" height="880" rx="28" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3"/>
  <text x="360" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#0F172A">ChocoBerry</text>
  <text x="360" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#64748B">Comprobante de pago</text>
  <line x1="105" y1="280" x2="615" y2="280" stroke="#E2E8F0" stroke-width="2"/>
  <text x="360" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#24943C">Transferencia aprobada</text>
  <text x="360" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Documento generado automáticamente</text>
</svg>
`;

// Catálogos resueltos por correo/nombre/cantidad, no por IDs.
// Los pedidos están ordenados de más reciente a más antiguo.
const PEDIDOS_SEED = [
  {
    cliente: 'carla.restrepo@gmail.com',
    municipio: 'barbosa',
    direccion: 'Carrera 12 #8-45',
    barrio: 'Centro',
    diasCreacion: -1,
    hora: '18:42:10',
    diasEntrega: 10,
    estado: 'pendiente',
    comprobante: false,
    mensajeTarjeta: 'Gracias por estar siempre.',
    instrucciones: 'Entregar en portería.',
    lineas: [
      { producto: 'detalle sorpresa', presentacion: 8, color: 'amarillo', cantidad: 1, mensaje: 'TE AMO', extra: 'Incluye globo pequeño' },
    ],
  },
  {
    cliente: 'paula.jimenez@gmail.com',
    municipio: 'medellin',
    diasCreacion: -2,
    hora: '12:18:35',
    diasEntrega: 9,
    estado: 'pendiente',
    comprobante: false,
    mensajeTarjeta: 'Feliz aniversario, mi amor.',
    instrucciones: 'Llamar al llegar.',
    lineas: [
      { producto: 'caja aniversario', presentacion: 12, color: 'azul', cantidad: 1, mensaje: 'FELIZ DÍA' },
    ],
  },
  {
    cliente: 'miguel.suarez@gmail.com',
    municipio: 'medellin',
    diasCreacion: -3,
    hora: '09:07:22',
    diasEntrega: 8,
    estado: 'pendiente',
    comprobante: false,
    mensajeTarjeta: 'Para compartir en familia.',
    instrucciones: 'Dejar en recepción.',
    lineas: [
      { producto: 'combo antojo doble', presentacion: 16, color: 'blanco', cantidad: 2, mensaje: 'GRACIAS', extra: 'Dos cajas para compartir' },
    ],
  },
  {
    cliente: 'carlos.ruiz@gmail.com',
    municipio: 'medellin',
    diasCreacion: -4,
    hora: '20:05:48',
    diasEntrega: 7,
    estado: 'pendiente',
    comprobante: false,
    mensajeTarjeta: 'Un detalle para alegrar tu día.',
    instrucciones: null,
    lineas: [
      { producto: 'mini antojo', presentacion: 6, color: 'chocolate', cantidad: 1, mensaje: 'AMOR' },
    ],
  },
  {
    cliente: 'carolina.duarte@gmail.com',
    municipio: 'medellin',
    diasCreacion: -5,
    hora: '15:33:04',
    diasEntrega: 6,
    estado: 'pendiente',
    comprobante: false,
    mensajeTarjeta: '¡Feliz cumpleaños!',
    instrucciones: 'Coordinar con el cliente.',
    lineas: [
      { producto: 'caja fiesta', presentacion: 30, color: 'morado', cantidad: 1, mensaje: 'FELIZ CUMPLE', extra: 'Incluye velas y globos' },
    ],
  },
  {
    cliente: 'felipe.castro@hotmail.com',
    municipio: 'envigado',
    direccion: 'Carrera 43A #30 Sur-15',
    barrio: 'La Magnolia',
    diasCreacion: -6,
    hora: '11:26:51',
    diasEntrega: 3,
    estado: 'en_preparacion',
    comprobante: true,
    mensajeTarjeta: 'Que cumplas muchos más.',
    instrucciones: 'Confirmar horario de entrega.',
    lineas: [
      { producto: 'torre cumpleanos', presentacion: 16, color: 'rosa', cantidad: 1, mensaje: 'FELIZ DÍA' },
    ],
  },
  {
    cliente: 'isabella.morales@gmail.com',
    municipio: 'itagui',
    direccion: 'Carrera 50 #80-30',
    barrio: 'San Antonio',
    diasCreacion: -7,
    hora: '17:48:19',
    diasEntrega: 2,
    estado: 'en_preparacion',
    comprobante: false,
    mensajeTarjeta: 'Te amo mucho.',
    instrucciones: 'Enviar mensaje antes de salir.',
    lineas: [
      { producto: 'fresas elegancia', presentacion: 12, color: 'verde', cantidad: 1, mensaje: 'TE AMO' },
    ],
  },
  {
    cliente: 'daniel.vargas@outlook.com',
    municipio: 'itagui',
    direccion: 'Calle 80 #52-14',
    barrio: 'Santa María',
    diasCreacion: -8,
    hora: '08:55:37',
    diasEntrega: 1,
    estado: 'despachado',
    comprobante: true,
    mensajeTarjeta: '¡Mucha fuerza!',
    instrucciones: 'Entregar después de las 3 p. m.',
    lineas: [
      { producto: 'detalle poder', presentacion: 8, color: 'amarillo', cantidad: 2, mensaje: 'FUERZA' },
    ],
  },
  {
    cliente: 'camila.torres@gmail.com',
    municipio: 'medellin',
    diasCreacion: -10,
    hora: '14:12:06',
    diasEntrega: -7,
    estado: 'entregado',
    comprobante: true,
    mensajeTarjeta: 'Feliz día, papá.',
    instrucciones: null,
    lineas: [
      { producto: 'caja clasica papa', presentacion: 16, color: 'azul', cantidad: 1, mensaje: 'PAPÁ' },
    ],
  },
  {
    cliente: 'santiago.ramirez@hotmail.com',
    municipio: 'bello',
    direccion: 'Calle 50 #40-12',
    barrio: 'Niquía',
    diasCreacion: -14,
    hora: '10:41:29',
    diasEntrega: -11,
    estado: 'entregado',
    comprobante: true,
    mensajeTarjeta: 'Con todo mi cariño.',
    instrucciones: null,
    lineas: [
      { producto: 'set fuerza papa', presentacion: 12, color: 'blanco', cantidad: 1, mensaje: 'PAPÁ' },
    ],
  },
  {
    cliente: 'valentina.lopez@gmail.com',
    municipio: 'medellin',
    diasCreacion: -19,
    hora: '19:03:15',
    diasEntrega: -16,
    estado: 'entregado',
    comprobante: true,
    mensajeTarjeta: 'Feliz día, mamá.',
    instrucciones: null,
    lineas: [
      { producto: 'ramo dulce mama', presentacion: 30, color: 'chocolate', cantidad: 1, mensaje: 'MAMÁ', extra: 'Tarjeta con dedicatoria' },
    ],
  },
  {
    cliente: 'carlos.hernandez@outlook.com',
    municipio: 'medellin',
    diasCreacion: -24,
    hora: '13:27:44',
    diasEntrega: -21,
    estado: 'entregado',
    comprobante: true,
    mensajeTarjeta: 'Por muchos momentos juntos.',
    instrucciones: null,
    lineas: [
      { producto: 'caja romance', presentacion: 16, color: 'morado', cantidad: 1, mensaje: 'TE AMO' },
    ],
  },
  {
    cliente: 'ana.martinez@gmail.com',
    municipio: 'copacabana',
    direccion: 'Carrera 50 #50-20',
    barrio: 'Centro',
    diasCreacion: -29,
    hora: '16:58:02',
    diasEntrega: -26,
    estado: 'entregado',
    comprobante: true,
    mensajeTarjeta: 'Dos detalles para una persona especial.',
    instrucciones: 'Entregar en la portería principal.',
    lineas: [
      { producto: 'detalle sorpresa', presentacion: 6, color: 'rosa', cantidad: 1, mensaje: 'AMOR' },
      { producto: 'mini antojo', presentacion: 8, color: 'verde', cantidad: 1, mensaje: 'FELIZ' },
    ],
  },
  {
    cliente: 'juan.rodriguez@hotmail.com',
    municipio: 'sabaneta',
    direccion: 'Carrera 45 #70 Sur-20',
    barrio: 'Centro',
    diasCreacion: -32,
    hora: '09:36:18',
    diasEntrega: -29,
    estado: 'rechazado',
    comprobante: false,
    motivoRechazo: 'No se recibió el comprobante de pago.',
    mensajeTarjeta: 'Celebremos juntos.',
    instrucciones: 'Entregar en portería.',
    lineas: [
      { producto: 'caja aniversario', presentacion: 30, color: 'amarillo', cantidad: 1, mensaje: 'ANIVERSARIO' },
      { producto: 'fresas elegancia', presentacion: 12, color: 'azul', cantidad: 1, mensaje: 'TE AMO' },
    ],
  },
  {
    cliente: 'maria.gonzalez@gmail.com',
    municipio: 'la estrella',
    direccion: 'Calle 80 Sur #50-10',
    barrio: 'Centro',
    diasCreacion: -35,
    hora: '18:11:53',
    diasEntrega: -32,
    estado: 'cancelado',
    comprobante: true,
    mensajeTarjeta: 'Una sorpresa para consentirte.',
    instrucciones: 'El cliente canceló la entrega.',
    lineas: [
      { producto: 'combo antojo doble', presentacion: 8, color: 'blanco', cantidad: 1, mensaje: 'GRACIAS' },
      { producto: 'caja fiesta', presentacion: 16, color: 'chocolate', cantidad: 1, mensaje: 'FELIZ DÍA' },
      { producto: 'detalle poder', presentacion: 6, color: 'morado', cantidad: 3, mensaje: 'AMOR' },
    ],
  },
];

function normalizar(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function obtener(mapa, clave, mensaje) {
  const valor = mapa.get(clave);
  if (!valor) throw new Error(mensaje);
  return valor;
}

function escaparXml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatearFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function formatearFechaHora(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 19).replace('T', ' ');
  const anio = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  const hora = String(valor.getHours()).padStart(2, '0');
  const minuto = String(valor.getMinutes()).padStart(2, '0');
  const segundo = String(valor.getSeconds()).padStart(2, '0');
  return `${anio}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
}

function sumarDias(dias) {
  const fecha = new Date();
  fecha.setHours(12, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return formatearFecha(fecha);
}

function fechaCreacion(dias, hora) {
  return `${sumarDias(dias)} ${hora}`;
}

function leerManifiesto() {
  if (!fs.existsSync(MANIFIESTO_ARCHIVO)) return null;
  try {
    return JSON.parse(fs.readFileSync(MANIFIESTO_ARCHIVO, 'utf8'));
  } catch (error) {
    console.warn(`[warn] No se pudo leer ${MANIFIESTO_ARCHIVO}: ${error.message}`);
    return null;
  }
}

function guardarManifiesto(manifiesto) {
  fs.writeFileSync(MANIFIESTO_ARCHIVO, JSON.stringify(manifiesto, null, 2), 'utf8');
}

function borrarManifiesto() {
  if (fs.existsSync(MANIFIESTO_ARCHIVO)) fs.unlinkSync(MANIFIESTO_ARCHIVO);
}

function borrarArchivoSubido(ruta) {
  if (!ruta || !ruta.startsWith('/uploads/')) return;
  const archivo = path.join(uploadsDir, ruta.slice('/uploads/'.length));
  if (fs.existsSync(archivo)) {
    fs.unlinkSync(archivo);
    console.log(`[reset] Archivo eliminado: ${ruta}`);
  }
}

function crearComprobanteGenerico() {
  fs.writeFileSync(COMPROBANTE_GENERICO_ARCHIVO, COMPROBANTE_GENERICO_SVG, 'utf8');
}

function crearComprobanteSvg({ id, fecha, cliente, municipio, total }) {
  const valor = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(total);
  const fechaMostrar = String(fecha).slice(0, 10).split('-').reverse().join('/');
  const referencia = `CB-${String(id).padStart(6, '0')}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
  <rect width="720" height="960" fill="#F8FAFC"/>
  <rect x="40" y="40" width="640" height="880" rx="28" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="3"/>
  <text x="360" y="140" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="700" fill="#0F172A">ChocoBerry</text>
  <text x="360" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#64748B">Comprobante de transferencia</text>
  <line x1="105" y1="245" x2="615" y2="245" stroke="#E2E8F0" stroke-width="2"/>
  <text x="105" y="305" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Referencia</text>
  <text x="615" y="305" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0F172A">${escaparXml(referencia)}</text>
  <text x="105" y="360" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Pedido</text>
  <text x="615" y="360" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0F172A">#${id}</text>
  <text x="105" y="415" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Cliente</text>
  <text x="615" y="415" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0F172A">${escaparXml(cliente)}</text>
  <text x="105" y="470" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Municipio</text>
  <text x="615" y="470" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0F172A">${escaparXml(municipio)}</text>
  <text x="105" y="525" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Fecha</text>
  <text x="615" y="525" text-anchor="end" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#0F172A">${escaparXml(fechaMostrar)}</text>
  <line x1="105" y1="580" x2="615" y2="580" stroke="#E2E8F0" stroke-width="2"/>
  <text x="105" y="650" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Valor</text>
  <text x="615" y="650" text-anchor="end" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#0F172A">${escaparXml(valor)}</text>
  <rect x="105" y="700" width="510" height="62" rx="14" fill="#ECFDF5"/>
  <text x="360" y="739" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#24943C">Transferencia aprobada</text>
  <text x="360" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" fill="#94A3B8">Documento generado automáticamente por ChocoBerry.</text>
</svg>
`;
}

function coincideManifiesto(pedido, item) {
  if (pedido.cliente?.id !== item.clienteId) return false;
  const fechaPedido = formatearFechaHora(pedido.fecha);
  return fechaPedido?.slice(0, 10) === String(item.fecha ?? '').slice(0, 10);
}

async function eliminarPedido(pedido, motivo) {
  await pedidoService.eliminar(pedido.id);
  if (pedido.comprobantePago) borrarArchivoSubido(pedido.comprobantePago);
  console.log(`[reset] Eliminado #${pedido.id} (${motivo}).`);
}

async function aplicarEstado(id, estado, motivoRechazo) {
  if (estado === 'pendiente') return;

  if (estado === 'en_preparacion') {
    await pedidoService.cambiarEstado(id, 'en_preparacion');
    return;
  }

  if (estado === 'despachado') {
    await pedidoService.cambiarEstado(id, 'en_preparacion');
    await pedidoService.cambiarEstado(id, 'despachado');
    return;
  }

  if (estado === 'entregado') {
    await pedidoService.cambiarEstado(id, 'en_preparacion');
    await pedidoService.cambiarEstado(id, 'despachado');
    await pedidoService.cambiarEstado(id, 'entregado');
    return;
  }

  if (estado === 'cancelado') {
    await pedidoService.cambiarEstado(id, 'en_preparacion');
    await pedidoService.cambiarEstado(id, 'despachado');
    await pedidoService.cambiarEstado(id, 'cancelado');
    return;
  }

  if (estado === 'rechazado') {
    await pedidoService.rechazar(id, motivoRechazo ?? 'Pedido rechazado.');
    return;
  }

  throw new Error(`Estado no soportado en el seed: "${estado}".`);
}

async function main() {
  const reiniciar = process.argv.includes('--reset');

  const [clientes, municipios, productos, presentaciones, colores, administradores] =
    await Promise.all([
      usuarioModel.listar({ rol: 'Cliente', estado: true }),
      municipioModel.listar({ estado: true }),
      productoModel.listar({ estado: true }),
      presentacionModel.listar({ estado: true }),
      colorGlaseadoModel.listar({ estado: true }),
      usuarioModel.listar({ rol: 'Administrador', estado: true }),
    ]);

  if (clientes.length < 15 || municipios.length < 8 || productos.length < 12) {
    throw new Error(
      'Faltan catálogos para crear el lote. Ejecuta primero "npm run seed:catalogo".'
    );
  }
  if (presentaciones.length < 5 || colores.length < 7) {
    throw new Error(
      'Faltan presentaciones o glaseados. Ejecuta primero "npm run seed:catalogo".'
    );
  }

  const admin = administradores[0] ?? { id: 1, nombre_rol: 'Administrador' };
  if (!administradores.length) {
    console.warn('[warn] No hay un administrador activo; se usa un usuario ficticio para el seed.');
  }

  const clientesPorCorreo = new Map(
    clientes.map((cliente) => [String(cliente.correo ?? '').toLowerCase(), cliente])
  );
  const municipiosPorNombre = new Map(
    municipios.map((municipio) => [normalizar(municipio.nombre), municipio])
  );
  const productosPorNombre = new Map(
    productos.map((producto) => [normalizar(producto.nombre), producto])
  );
  const presentacionesPorFresas = new Map(
    presentaciones.map((presentacion) => [Number(presentacion.cantidad_fresas), presentacion])
  );
  const coloresPorNombre = new Map(
    colores.map((color) => [normalizar(color.nombre), color])
  );

  const pedidosActuales = await pedidoService.listar({}, admin);

  const legacy = pedidosActuales.filter((pedido) =>
    PATRON_LEGACY.test(String(pedido.instruccionesEntrega ?? ''))
  );
  if (legacy.length) {
    console.log(`[reset] Eliminando ${legacy.length} pedido(s) antiguos con etiqueta [SEED]...`);
    for (const pedido of legacy) {
      await eliminarPedido(pedido, 'lote anterior con etiqueta');
    }
    borrarArchivoSubido('/uploads/seed-comprobante.svg');
  }

  const manifiesto = leerManifiesto();
  if (manifiesto?.orders?.length) {
    if (!reiniciar) {
      console.log(
        `[skip] Ya existe un lote de ${manifiesto.orders.length} pedidos. ` +
          'Usa "npm run seed:pedidos -- --reset" para reemplazarlo.'
      );
      return;
    }

    console.log(`[reset] Eliminando ${manifiesto.orders.length} pedido(s) del manifiesto...`);
    const pedidosPorId = new Map(pedidosActuales.map((pedido) => [pedido.id, pedido]));
    for (const item of manifiesto.orders) {
      const pedido = pedidosPorId.get(item.id);
      if (!pedido) {
        console.log(`[reset] #${item.id} ya no existe; se omite.`);
        continue;
      }
      if (!coincideManifiesto(pedido, item)) {
        console.warn(`[reset] #${item.id} no coincide con el manifiesto; no se elimina.`);
        continue;
      }
      await eliminarPedido(pedido, 'manifiesto anterior');
    }
    borrarManifiesto();
  } else if (!reiniciar) {
    console.log('[info] No hay manifiesto; se creará un lote nuevo.');
  }

  borrarArchivoSubido('/uploads/seed-comprobante.svg');
  borrarArchivoSubido(COMPROBANTE_GENERICO_RUTA);
  crearComprobanteGenerico();

  const nuevoManifiesto = {
    version: 1,
    generatedAt: new Date().toISOString(),
    orders: [],
  };
  guardarManifiesto(nuevoManifiesto);

  let creados = 0;

  for (const definicion of PEDIDOS_SEED) {
    const cliente = obtener(
      clientesPorCorreo,
      definicion.cliente.toLowerCase(),
      `No se encontró el cliente "${definicion.cliente}" (activo). Ejecuta "npm run seed:catalogo".`
    );
    const municipio = obtener(
      municipiosPorNombre,
      normalizar(definicion.municipio),
      `No se encontró el municipio "${definicion.municipio}" (activo).`
    );

    const lineas = definicion.lineas.map((linea, indice) => {
      const numero = indice + 1;
      const producto = obtener(
        productosPorNombre,
        normalizar(linea.producto),
        `Pedido de ${cliente.nombres} línea ${numero}: no se encontró el producto "${linea.producto}" (activo).`
      );
      const presentacion = obtener(
        presentacionesPorFresas,
        Number(linea.presentacion),
        `Pedido de ${cliente.nombres} línea ${numero}: no se encontró la presentación de ${linea.presentacion} fresas (activa).`
      );
      const color = obtener(
        coloresPorNombre,
        normalizar(linea.color),
        `Pedido de ${cliente.nombres} línea ${numero}: no se encontró el glaseado "${linea.color}" (activo).`
      );

      if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1) {
        throw new Error(`Pedido de ${cliente.nombres} línea ${numero}: cantidad inválida.`);
      }

      return {
        idProducto: producto.id,
        idPresentacion: presentacion.id,
        idColorGlaseado: color.id,
        cantidadProductos: linea.cantidad,
        mensajePersonalizado: linea.mensaje ?? null,
        personalizacionAdicional: linea.extra ?? null,
      };
    });

    const fecha = fechaCreacion(definicion.diasCreacion, definicion.hora);
    const datos = {
      idUsuario: cliente.id,
      idMunicipio: municipio.id,
      fechaEntrega: sumarDias(definicion.diasEntrega),
      direccion: definicion.direccion ?? cliente.direccion ?? 'Dirección por confirmar',
      barrio: definicion.barrio ?? cliente.barrio ?? 'Centro',
      nombreReceptor: `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim(),
      telefonoReceptor: cliente.telefono || '3000000000',
      mensajeTarjeta: definicion.mensajeTarjeta ?? null,
      instruccionesEntrega: definicion.instrucciones ?? null,
      lineas,
    };

    let pedidoCreado;
    try {
      pedidoCreado = await pedidoService.crear(datos, admin, COMPROBANTE_GENERICO_RUTA);
      await aplicarEstado(pedidoCreado.id, definicion.estado, definicion.motivoRechazo);

      let comprobante = null;
      if (definicion.comprobante) {
        comprobante = `/uploads/comprobante-${pedidoCreado.id}.svg`;
        const archivoComprobante = path.join(uploadsDir, `comprobante-${pedidoCreado.id}.svg`);
        fs.writeFileSync(
          archivoComprobante,
          crearComprobanteSvg({
            id: pedidoCreado.id,
            fecha,
            cliente: datos.nombreReceptor,
            municipio: municipio.nombre,
            total: pedidoCreado.total,
          }),
          'utf8'
        );
      }

      await query('UPDATE pedido SET fecha = ?, comprobante_pago = ? WHERE id = ?', [
        fecha,
        comprobante,
        pedidoCreado.id,
      ]);

      const item = {
        id: pedidoCreado.id,
        clienteId: cliente.id,
        fecha,
        comprobante,
      };
      nuevoManifiesto.orders.push(item);
      guardarManifiesto(nuevoManifiesto);
      creados += 1;

      console.log(
        `[ok] #${pedidoCreado.id} | ${fecha} | entrega ${datos.fechaEntrega} | ` +
          `${definicion.estado} | ${datos.nombreReceptor} | ${municipio.nombre} | ` +
          `${comprobante ? 'con comprobante' : 'sin comprobante'}`
      );
    } catch (error) {
      if (pedidoCreado?.id) {
        try {
          await pedidoService.eliminar(pedidoCreado.id);
          borrarArchivoSubido(`/uploads/comprobante-${pedidoCreado.id}.svg`);
          console.error(`[rollback] Se eliminó el pedido parcial #${pedidoCreado.id}.`);
        } catch (rollbackError) {
          console.error(
            `[rollback] No se pudo eliminar el pedido parcial #${pedidoCreado.id}: ${rollbackError.message}`
          );
        }
      }
      throw new Error(`${datos.nombreReceptor}: ${error.message}`, { cause: error });
    }
  }

  borrarArchivoSubido(COMPROBANTE_GENERICO_RUTA);

  const pedidosFinales = await pedidoService.listar({}, admin);
  const idsNuevos = new Set(nuevoManifiesto.orders.map((item) => item.id));
  const nuevos = pedidosFinales.filter((pedido) => idsNuevos.has(pedido.id));

  const resumenEstados = {};
  for (const pedido of nuevos) {
    const nombre = pedido.estado?.nombre ?? 'Sin estado';
    resumenEstados[nombre] = (resumenEstados[nombre] ?? 0) + 1;
  }

  const conComprobante = nuevos.filter((pedido) => pedido.comprobantePago).length;
  const sinComprobante = nuevos.length - conComprobante;

  const clientesUsados = new Set(nuevos.map((pedido) => pedido.cliente?.id));
  const municipiosUsados = new Set(nuevos.map((pedido) => pedido.municipio?.id));
  const productosUsados = new Set(
    nuevos.flatMap((pedido) => pedido.lineas.map((linea) => linea.producto?.id))
  );
  const presentacionesUsadas = new Set(
    nuevos.flatMap((pedido) => pedido.lineas.map((linea) => linea.presentacion?.id))
  );
  const coloresUsados = new Set(
    nuevos.flatMap((pedido) => pedido.lineas.map((linea) => linea.colorGlaseado?.id))
  );

  console.log('\nResumen del lote');
  console.log(`  Pedidos creados:              ${creados}`);
  console.log(`  Pedidos nuevos en la base:    ${nuevos.length}`);
  console.log(`  Pedidos totales en la base:   ${pedidosFinales.length}`);
  console.log(`  Con comprobante:              ${conComprobante}`);
  console.log(`  Sin comprobante:              ${sinComprobante}`);
  console.log('  Estados:');
  for (const [estado, total] of Object.entries(resumenEstados)) {
    console.log(`    - ${estado}: ${total}`);
  }
  console.log('  Cobertura:');
  console.log(`    - Clientes:       ${clientesUsados.size}/${clientes.length}`);
  console.log(`    - Municipios:     ${municipiosUsados.size}/${municipios.length}`);
  console.log(`    - Productos:      ${productosUsados.size}/${productos.length}`);
  console.log(`    - Presentaciones: ${presentacionesUsadas.size}/${presentaciones.length}`);
  console.log(`    - Glaseados:      ${coloresUsados.size}/${colores.length}`);
  console.log('  Orden del listado (fecha de creación descendente):');
  for (const pedido of pedidosFinales.slice(0, 20)) {
    console.log(
      `    #${pedido.id} | ${formatearFechaHora(pedido.fecha)} | ${pedido.estado?.nombre} | ${pedido.cliente?.nombreCompleto}`
    );
  }

  const conEtiquetas = nuevos.filter((pedido) =>
    PATRON_LEGACY.test(String(pedido.instruccionesEntrega ?? ''))
  );
  if (conEtiquetas.length) {
    throw new Error('Se encontraron etiquetas [SEED] en los pedidos nuevos.');
  }

  if (nuevos.length !== PEDIDOS_SEED.length) {
    throw new Error(
      `Se esperaban ${PEDIDOS_SEED.length} pedidos nuevos y hay ${nuevos.length}.`
    );
  }
}

main()
  .catch((error) => {
    console.error('\n[error] No se pudo completar el seed de pedidos.');
    console.error(error?.stack ?? error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
