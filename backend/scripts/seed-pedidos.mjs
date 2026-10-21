// scripts/seed-pedidos.mjs
// Genera un lote de pedidos de demostración con los catálogos reales:
// 15 pedidos recientes + pedidos históricos repartidos en los últimos 12 meses.
//
// - Usa los services de pedidos para calcular precios, domicilios y estados.
// - Ajusta la fecha de creación para que el listado quede ordenado como una
//   línea de tiempo real: los más recientes primero.
// - No genera archivos de comprobante: `comprobante_pago` queda en NULL.
// - No escribe etiquetas [SEED] en los pedidos. El lote se identifica con el
//   manifiesto local scripts/.seed-pedidos.json (ignorado por git).
// - `npm run seed:pedidos -- --reset` elimina el lote anterior (incluidos los
//   seeds viejos con etiqueta [SEED-xx]) y vuelve a crear el lote completo.
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

// `pedidoService.crear` exige un comprobante. El seed no genera archivos: usa
// una ruta ficticia y después deja `comprobante_pago` en NULL.
const COMPROBANTE_DUMMY = '/uploads/seed-sin-comprobante.svg';

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
    comprobante: false,
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
    comprobante: false,
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
    comprobante: false,
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
    comprobante: false,
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
    comprobante: false,
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
    comprobante: false,
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
    comprobante: false,
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
    comprobante: false,
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

const CLIENTES_HISTORICOS = [
  'carla.restrepo@gmail.com',
  'paula.jimenez@gmail.com',
  'miguel.suarez@gmail.com',
  'carlos.ruiz@gmail.com',
  'carolina.duarte@gmail.com',
  'felipe.castro@hotmail.com',
  'isabella.morales@gmail.com',
  'daniel.vargas@outlook.com',
  'camila.torres@gmail.com',
  'santiago.ramirez@hotmail.com',
  'valentina.lopez@gmail.com',
  'carlos.hernandez@outlook.com',
  'ana.martinez@gmail.com',
  'juan.rodriguez@hotmail.com',
  'maria.gonzalez@gmail.com',
];

const MUNICIPIOS_HISTORICOS = [
  'medellin',
  'medellin',
  'bello',
  'itagui',
  'envigado',
  'medellin',
  'copacabana',
  'sabaneta',
  'la estrella',
  'barbosa',
];

// Combinaciones producto/presentación que ya usa el lote reciente.
const PRODUCTOS_HISTORICOS = [
  ['detalle sorpresa', 8],
  ['caja aniversario', 12],
  ['combo antojo doble', 16],
  ['mini antojo', 6],
  ['caja fiesta', 30],
  ['torre cumpleanos', 16],
  ['fresas elegancia', 12],
  ['detalle poder', 8],
  ['caja clasica papa', 16],
  ['set fuerza papa', 12],
  ['ramo dulce mama', 30],
  ['caja romance', 16],
  ['detalle sorpresa', 6],
  ['mini antojo', 8],
  ['caja aniversario', 30],
  ['combo antojo doble', 8],
  ['caja fiesta', 16],
  ['detalle poder', 6],
];

const COLORES_HISTORICOS = ['amarillo', 'azul', 'blanco', 'chocolate', 'morado', 'rosa', 'verde'];
const HORAS_HISTORICAS = ['09:15:22', '11:40:10', '14:05:45', '16:30:18', '18:55:03', '20:10:37'];
const MENSAJES_HISTORICOS = [
  'Con cariño.',
  'Para consentirte.',
  'Un detalle especial.',
  'Gracias por tanto.',
  'Para compartir.',
];
const INSTRUCCIONES_HISTORICAS = [
  null,
  null,
  'Entregar en portería.',
  'Llamar al llegar.',
  'Dejar en recepción.',
];

function diferenciaEnDias(desde, hasta) {
  const MS_DIA = 24 * 60 * 60 * 1000;
  return Math.round((desde.getTime() - hasta.getTime()) / MS_DIA);
}

function fechaEnMesAtras(hoy, mesesAtras, dia) {
  return new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, dia, 12, 0, 0, 0);
}

function lunesDeSemana(hoy) {
  const lunes = new Date(hoy);
  const desplazamiento = (hoy.getDay() + 6) % 7;
  lunes.setDate(hoy.getDate() - desplazamiento);
  return lunes;
}

function fechaDeSemanaAtras(hoy, semanasAtras, diaSemana) {
  const fecha = lunesDeSemana(hoy);
  fecha.setDate(fecha.getDate() - semanasAtras * 7 + diaSemana);
  return fecha;
}

function fechaDeSemanaActual(hoy, diaSemana) {
  const fecha = lunesDeSemana(hoy);
  fecha.setDate(fecha.getDate() + diaSemana);
  return fecha;
}

function lineasHistoricas(indice) {
  const cantidadLineas = indice % 6 === 0 ? 2 : 1;
  return Array.from({ length: cantidadLineas }, (_, variante) => {
    const [producto, presentacion] = PRODUCTOS_HISTORICOS[
      (indice * 2 + variante) % PRODUCTOS_HISTORICOS.length
    ];
    return {
      producto,
      presentacion,
      color: COLORES_HISTORICOS[(indice + variante) % COLORES_HISTORICOS.length],
      cantidad: 1 + ((indice + variante * 2) % 4),
      mensaje: (indice + variante) % 3 === 0 ? 'AMOR' : null,
      extra: null,
    };
  });
}

function estadoHistorico(diasCreacion, indice) {
  if (Math.abs(diasCreacion) > 14) {
    const resto = indice % 12;
    if (resto === 0) return 'cancelado';
    if (resto === 1) return 'rechazado';
    return 'entregado';
  }

  const resto = indice % 10;
  if (resto <= 1) return 'pendiente';
  if (resto <= 3) return 'en_preparacion';
  if (resto <= 5) return 'despachado';
  if (resto <= 8) return 'entregado';
  return 'cancelado';
}

function definicionHistorica({ fecha, indice, estado, hoy }) {
  const diasCreacion = diferenciaEnDias(fecha, hoy);
  const enCurso = estado === 'en_preparacion' || estado === 'despachado';
  const diasEntrega = estado === 'pendiente'
    ? diasCreacion + 7
    : enCurso
      ? Math.max(diasCreacion + 3, 1)
      : diasCreacion + 3;
  const definicion = {
    cliente: CLIENTES_HISTORICOS[indice % CLIENTES_HISTORICOS.length],
    municipio: MUNICIPIOS_HISTORICOS[indice % MUNICIPIOS_HISTORICOS.length],
    diasCreacion,
    hora: HORAS_HISTORICAS[indice % HORAS_HISTORICAS.length],
    diasEntrega,
    estado,
    comprobante: false,
    mensajeTarjeta: MENSAJES_HISTORICOS[indice % MENSAJES_HISTORICOS.length],
    instrucciones: INSTRUCCIONES_HISTORICAS[indice % INSTRUCCIONES_HISTORICAS.length],
    lineas: lineasHistoricas(indice),
  };
  if (estado === 'rechazado') {
    definicion.motivoRechazo = 'No se confirmó el pago.';
  }
  return definicion;
}

function crearPedidosHistoricos() {
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  const pedidos = [];
  let indice = 0;

  // Meses anteriores: 3 pedidos en los últimos 6 meses y 2 en los 5 más antiguos.
  for (let mesesAtras = 1; mesesAtras <= 11; mesesAtras += 1) {
    const dias = mesesAtras <= 6 ? [5, 14, 23] : [8, 20];
    for (const dia of dias) {
      const fecha = fechaEnMesAtras(hoy, mesesAtras, dia);
      pedidos.push(
        definicionHistorica({
          fecha,
          indice,
          estado: estadoHistorico(diferenciaEnDias(fecha, hoy), indice),
          hoy,
        })
      );
      indice += 1;
    }
  }

  // Refuerzo de las semanas 6 y 7 para que la navegación semanal tenga datos.
  for (const semanasAtras of [6, 7]) {
    for (const diaSemana of [2, 5]) {
      const fecha = fechaDeSemanaAtras(hoy, semanasAtras, diaSemana);
      pedidos.push(
        definicionHistorica({
          fecha,
          indice,
          estado: estadoHistorico(diferenciaEnDias(fecha, hoy), indice),
          hoy,
        })
      );
      indice += 1;
    }
  }

  // Dos pedidos de la semana actual, sin superar el día de hoy.
  const diaActual = diferenciaEnDias(hoy, lunesDeSemana(hoy));
  const diasSemanaActual = [...new Set([0, Math.min(6, diaActual)])];
  for (const diaSemana of diasSemanaActual) {
    const fecha = fechaDeSemanaActual(hoy, diaSemana);
    pedidos.push(
      definicionHistorica({
        fecha,
        indice,
        estado: diaSemana === 0 ? 'despachado' : 'en_preparacion',
        hoy,
      })
    );
    indice += 1;
  }

  return pedidos;
}

PEDIDOS_SEED.push(...crearPedidosHistoricos());
PEDIDOS_SEED.sort((a, b) => b.diasCreacion - a.diasCreacion);

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
  borrarArchivoSubido('/uploads/comprobante-pago.svg');

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
      pedidoCreado = await pedidoService.crear(datos, admin, COMPROBANTE_DUMMY);
      await aplicarEstado(pedidoCreado.id, definicion.estado, definicion.motivoRechazo);

      // El seed no genera archivos: el comprobante queda siempre en blanco.
      await query('UPDATE pedido SET fecha = ?, comprobante_pago = NULL WHERE id = ?', [
        fecha,
        pedidoCreado.id,
      ]);

      const item = {
        id: pedidoCreado.id,
        clienteId: cliente.id,
        fecha,
        comprobante: null,
      };
      nuevoManifiesto.orders.push(item);
      guardarManifiesto(nuevoManifiesto);
      creados += 1;

      console.log(
        `[ok] #${pedidoCreado.id} | ${fecha} | entrega ${datos.fechaEntrega} | ` +
          `${definicion.estado} | ${datos.nombreReceptor} | ${municipio.nombre} | ` +
          'sin comprobante'
      );
    } catch (error) {
      if (pedidoCreado?.id) {
        try {
          await pedidoService.eliminar(pedidoCreado.id);
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

  const pedidosFinales = await pedidoService.listar({}, admin);
  const idsNuevos = new Set(nuevoManifiesto.orders.map((item) => item.id));
  const nuevos = pedidosFinales.filter((pedido) => idsNuevos.has(pedido.id));

  const resumenEstados = {};
  for (const pedido of nuevos) {
    const nombre = pedido.estado?.nombre ?? 'Sin estado';
    resumenEstados[nombre] = (resumenEstados[nombre] ?? 0) + 1;
  }

  const conComprobante = nuevos.filter((pedido) => pedido.comprobantePago).length;
  if (conComprobante > 0) {
    throw new Error(`El seed no debe generar comprobantes y hay ${conComprobante} pedido(s) con archivo.`);
  }

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
  console.log(`  Comprobantes de pago:         ${conComprobante} (todos en blanco)`);
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
