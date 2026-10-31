// src/validators/pedido.validator.js
// Esquemas de validación del módulo de pedidos. Los precios NUNCA llegan del
// cliente: se calculan en el service con los datos de la BD.
import { z } from 'zod';

const vacioAUndefined = (valor) => (valor === '' || valor === null ? undefined : valor);

const enteroPositivo = (mensaje) =>
  z.coerce
    .number({ required_error: mensaje, invalid_type_error: mensaje })
    .int(mensaje)
    .positive(mensaje);

const idOpcional = (mensaje) =>
  z.preprocess(vacioAUndefined, enteroPositivo(mensaje).optional());

/** Una fecha de calendario real en formato YYYY-MM-DD. */
function esFechaValida(texto) {
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

const fechaEntregaField = z
  .string({ required_error: 'La fecha de entrega es obligatoria.' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de entrega debe tener el formato YYYY-MM-DD.')
  .refine(esFechaValida, 'La fecha de entrega no es una fecha válida.');

const fechaFiltroField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD.')
  .refine(esFechaValida, 'La fecha no es válida.')
  .optional();

const telefonoReceptorField = z
  .string({ required_error: 'El teléfono del receptor es obligatorio.' })
  .trim()
  .max(20, 'El teléfono del receptor no puede superar los 20 caracteres.')
  .regex(/^[\d\s-]+$/, 'El teléfono del receptor solo debe contener números.')
  .refine(
    (valor) => valor.replace(/\D/g, '').length === 10,
    'El teléfono del receptor debe tener 10 dígitos.'
  );

const mensajeField = (maximo, etiqueta) =>
  z
    .string()
    .trim()
    .max(maximo, `${etiqueta} no puede superar los ${maximo} caracteres.`)
    .optional();

/**
 * Una línea de pedido. En creación el `id` no se usa; al actualizar identifica
 * una línea existente para conservar su precio histórico.
 */
const lineaPedidoSchema = z.object({
  id: idOpcional('El id de la línea debe ser un número entero positivo.'),
  idProducto: enteroPositivo('El producto es obligatorio.'),
  idPresentacion: enteroPositivo('La presentación es obligatoria.'),
  cantidadProductos: z.coerce
    .number({
      required_error: 'La cantidad de productos es obligatoria.',
      invalid_type_error: 'La cantidad de productos debe ser un número.',
    })
    .int('La cantidad de productos debe ser un número entero.')
    .positive('La cantidad de productos debe ser mayor que cero.')
    .max(100, 'La cantidad de productos es demasiado alta.'),
  mensajePersonalizado: mensajeField(255, 'El mensaje personalizado'),
  idColorGlaseado: enteroPositivo('El color del glaseado es obligatorio.'),
  personalizacionAdicional: mensajeField(255, 'La personalización adicional'),
});

/**
 * Las líneas llegan como un array (JSON) o como texto JSON cuando el pedido se
 * envía en multipart (para adjuntar el comprobante).
 */
const lineasField = z.preprocess((valor) => {
  if (typeof valor === 'string') {
    try {
      return JSON.parse(valor);
    } catch {
      return valor;
    }
  }
  return valor;
}, z.array(lineaPedidoSchema, {
  required_error: 'El pedido debe tener al menos un producto.',
  invalid_type_error: 'El formato de las líneas del pedido no es válido.',
})
  .min(1, 'El pedido debe tener al menos un producto.')
  .max(50, 'El pedido no puede tener más de 50 líneas.'));

export const crearPedidoSchema = z.object({
  mensajeTarjeta: mensajeField(255, 'El mensaje de la tarjeta'),
  fechaEntrega: fechaEntregaField,
  direccion: z
    .string({ required_error: 'La dirección es obligatoria.' })
    .trim()
    .min(5, 'La dirección es demasiado corta.')
    .max(200, 'La dirección no puede superar los 200 caracteres.'),
  barrio: z
    .string({ required_error: 'El barrio es obligatorio.' })
    .trim()
    .min(2, 'El barrio es demasiado corto.')
    .max(100, 'El barrio no puede superar los 100 caracteres.'),
  idMunicipio: enteroPositivo('El municipio es obligatorio.'),
  nombreReceptor: z
    .string({ required_error: 'El nombre del receptor es obligatorio.' })
    .trim()
    .min(2, 'El nombre del receptor es demasiado corto.')
    .max(100, 'El nombre del receptor no puede superar los 100 caracteres.'),
  telefonoReceptor: telefonoReceptorField,
  instruccionesEntrega: mensajeField(255, 'Las instrucciones de entrega'),
  lineas: lineasField,
  // Solo lo usa un administrador para crear el pedido a nombre de un cliente.
  idUsuario: idOpcional('El usuario debe ser un id numérico.'),
});

// Al actualizar, todos los campos de cabecera son opcionales (parcial). Si
// llega `lineas`, se interpreta como la lista completa resultante del pedido y
// reemplaza a las líneas anteriores. Cada línea existente envía su `id`.
export const actualizarPedidoSchema = z.object({
  mensajeTarjeta: mensajeField(255, 'El mensaje de la tarjeta'),
  fechaEntrega: fechaEntregaField.optional(),
  direccion: z.string().trim().min(5, 'La dirección es demasiado corta.').max(200).optional(),
  barrio: z.string().trim().min(2, 'El barrio es demasiado corto.').max(100).optional(),
  idMunicipio: idOpcional('El municipio debe ser un id numérico.'),
  nombreReceptor: z
    .string()
    .trim()
    .min(2, 'El nombre del receptor es demasiado corto.')
    .max(100)
    .optional(),
  telefonoReceptor: telefonoReceptorField.optional(),
  instruccionesEntrega: mensajeField(255, 'Las instrucciones de entrega'),
  lineas: lineasField.optional(),
});

export const cambiarEstadoPedidoSchema = z.object({
  estado: z
    .string({ required_error: 'El estado es obligatorio.' })
    .trim()
    .min(1, 'El estado es obligatorio.'),
  observacionesEntrega: mensajeField(255, 'El motivo de cancelación'),
});

export const reprogramarPedidoSchema = z.object({
  fechaEntrega: fechaEntregaField,
});

export const rechazarPedidoSchema = z.object({
  motivo: z
    .string({ required_error: 'El motivo de rechazo es obligatorio.' })
    .trim()
    .min(5, 'El motivo de rechazo debe tener al menos 5 caracteres.')
    .max(255, 'El motivo de rechazo no puede superar los 255 caracteres.'),
});

export const registrarEntregaSchema = z.object({
  observacionesEntrega: mensajeField(255, 'Las observaciones de entrega'),
});

export const filtrosPedidoSchema = z.object({
  estado: z.string().trim().optional(),
  idEstado: idOpcional('El estado debe ser un id numérico.'),
  idMunicipio: idOpcional('El municipio debe ser un id numérico.'),
  idUsuario: idOpcional('El usuario debe ser un id numérico.'),
  cliente: z.string().trim().optional(),
  fechaDesde: fechaFiltroField,
  fechaHasta: fechaFiltroField,
});
