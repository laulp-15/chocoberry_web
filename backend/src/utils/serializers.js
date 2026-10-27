// src/utils/serializers.js
// Transforman las filas crudas de MySQL (snake_case) a la forma que devuelve
// la API (camelCase). Así la BD queda desacoplada del contrato de la API.
import { redondear2 } from './number.js';
import { slugify } from './text.js';

/** Convierte una fila de `usuario` (con nombre_rol) al objeto público. */
export function serializarUsuario(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    nombreCompleto: `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim(),
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    correo: row.correo,
    telefono: row.telefono,
    barrio: row.barrio,
    direccion: row.direccion,
    fechaRegistro: row.fecha,
    estado: Boolean(row.estado),
    rol: row.nombre_rol
      ? { id: row.id_rol, nombre: row.nombre_rol, slug: slugify(row.nombre_rol) }
      : { id: row.id_rol },
  };
}

/** Convierte una fila de `rol` (con conteos) al objeto público. */
export function serializarRol(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre_rol,
    permisos: Number(row.total_permisos ?? 0),
    usuarios: Number(row.total_usuarios ?? 0),
  };
}

export function serializarModulo(row) {
  if (!row) return null;
  return { id: row.id, nombre: row.nombre };
}

export function serializarAccion(row) {
  if (!row) return null;
  return { id: row.id, nombre: row.nombre };
}

/** Convierte una fila de `permiso` (con módulo y acción) al objeto público. */
export function serializarPermiso(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    modulo: row.modulo ? { id: row.id_modulo, nombre: row.modulo } : { id: row.id_modulo },
    accion: row.accion ? { id: row.id_accion, nombre: row.accion } : { id: row.id_accion },
  };
}

/** Convierte una fila de `categoria` al objeto público. */
export function serializarCategoria(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    estado: Boolean(row.estado),
  };
}

/**
 * Convierte una fila de `producto` (con nombre de categoría) y sus imágenes al
 * objeto público. `imagen` se conserva como la portada (orden 1) para no
 * romper a los consumidores que ya esperaban una sola ruta.
 */
export function serializarProducto(row, imagenes = []) {
  if (!row) return null;

  const lista = Array.isArray(imagenes) ? imagenes : [];

  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    imagen: lista[0]?.url ?? null,
    imagenes: lista.map((imagen) => ({
      id: imagen.id,
      url: imagen.url,
      orden: imagen.orden,
    })),
    estado: Boolean(row.estado),
    categoria: row.categoria
      ? { id: row.id_categoria, nombre: row.categoria }
      : { id: row.id_categoria },
  };
}

/** Convierte una fila de `presentacion` al objeto público. */
export function serializarPresentacion(row) {
  if (!row) return null;
  return {
    id: row.id,
    cantidadFresas: row.cantidad_fresas,
    // DECIMAL llega como texto desde MySQL; se normaliza a número.
    precio: Number(row.precio),
    estado: Boolean(row.estado),
  };
}

/** Convierte una fila de `municipio` al objeto público. */
export function serializarMunicipio(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    precioDomicilio: Number(row.precio_domicilio),
    estado: Boolean(row.estado),
  };
}

/** Convierte una fila de `colorGlaseado` al objeto público. */
export function serializarColorGlaseado(row) {
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    codigoHex: row.codigo_hex,
    estado: Boolean(row.estado),
  };
}

/** Convierte una fila de `resena` (con datos del usuario) al objeto público. */
export function serializarResena(row) {
  if (!row) return null;

  const cliente = `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim();

  return {
    id: row.id,
    calificacion: Number(row.calificacion),
    comentario: row.comentario ?? '',
    fecha: formatearFecha(row.fecha),
    estado: Boolean(row.estado),
    usuarioId: row.id_usuario,
    cliente: cliente || 'Cliente ChocoBerry',
  };
}

/** Fecha (Date de MySQL o texto) en formato YYYY-MM-DD. */
function formatearFecha(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor.slice(0, 10);

  const anio = valor.getFullYear();
  const mes = String(valor.getMonth() + 1).padStart(2, '0');
  const dia = String(valor.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Convierte una línea de `productoPedido` al objeto público. */
export function serializarLineaPedido(row) {
  if (!row) return null;
  return {
    id: row.id,
    producto: {
      id: row.id_producto,
      nombre: row.producto,
      imagen: row.producto_imagen,
    },
    presentacion: {
      id: row.id_presentacion,
      cantidadFresas: row.cantidad_fresas,
      precio: Number(row.presentacion_precio),
    },
    cantidadProductos: row.cantidad_productos,
    // DECIMAL llega como texto desde MySQL; se normaliza a número.
    precioUnitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
    mensajePersonalizado: row.mensaje_personalizado,
    colorGlaseado: row.id_color_glaseado
      ? { id: row.id_color_glaseado, nombre: row.color_nombre, codigoHex: row.color_hex }
      : null,
    personalizacionAdicional: row.personalizacion_adicional,
  };
}

/**
 * Convierte una fila de `pedido` (con cliente, estado y municipio) más sus
 * líneas al objeto público. El total se deriva: no existe columna en la BD.
 */
export function serializarPedido(row, lineas = []) {
  if (!row) return null;

  const lineasSerializadas = lineas.map(serializarLineaPedido);
  const subtotal = redondear2(
    lineasSerializadas.reduce((acumulado, linea) => acumulado + linea.subtotal, 0)
  );
  const precioDomicilio = Number(row.precio_domicilio);

  return {
    id: row.id,
    mensajeTarjeta: row.mensaje_tarjeta,
    fecha: row.fecha,
    fechaEntrega: formatearFecha(row.fecha_entrega),
    estado: { id: row.id_estado, nombre: row.estado },
    cliente: {
      id: row.id_usuario,
      nombres: row.nombres,
      apellidos: row.apellidos,
      nombreCompleto: `${row.nombres ?? ''} ${row.apellidos ?? ''}`.trim(),
      tipoDocumento: row.tipo_documento,
      numeroDocumento: row.numero_documento,
      correo: row.correo,
      telefono: row.telefono,
    },
    municipio: { id: row.id_municipio, nombre: row.municipio },
    direccion: row.direccion,
    barrio: row.barrio,
    precioDomicilio,
    nombreReceptor: row.nombre_receptor,
    telefonoReceptor: row.telefono_receptor,
    comprobantePago: row.comprobante_pago,
    motivoRechazo: row.motivo_rechazo,
    fechaCancelacion: row.fecha_cancelacion,
    instruccionesEntrega: row.instrucciones_entrega,
    observacionesEntrega: row.observaciones_entrega,
    evidenciaEntrega: row.evidencia_entrega,
    lineas: lineasSerializadas,
    subtotal,
    total: redondear2(subtotal + precioDomicilio),
  };
}
