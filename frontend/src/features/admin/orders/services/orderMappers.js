// src/features/admin/orders/services/orderMappers.js
//
// Traduce entre el contrato real de /api/pedidos y la forma que usa el panel
// administrador. El backend entrega el estado como { id, nombre } (nombre con
// tilde), el municipio como { id, nombre } y las líneas con objetos anidados;
// el panel trabaja con slugs, campos planos y fechas YYYY-MM-DD.

import { imageUrl } from "../../../../shared/utils/imageUrl";

const ESTADO_SLUGS = {
  pendiente: "pendiente",
  "en preparacion": "en_preparacion",
  despachado: "despachado",
  rechazado: "rechazado",
  entregado: "entregado",
  cancelado: "cancelado",
};

function normalizarEstado(nombre) {
  return String(nombre ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function mapEstadoSlug(nombre) {
  const clave = normalizarEstado(nombre);
  return ESTADO_SLUGS[clave] ?? clave.replace(/\s+/g, "_");
}

function mapLinea(linea) {
  if (!linea) return null;

  return {
    id: linea.id,
    productoId: linea.producto?.id ?? null,
    productoNombre: linea.producto?.nombre ?? "",
    productoImagen: imageUrl(linea.producto?.imagen),
    presentacionId: linea.presentacion?.id ?? null,
    cantidadFresas: Number(linea.presentacion?.cantidadFresas ?? 0),
    unidades: Number(linea.cantidadProductos ?? 0),
    precioUnitario: Number(linea.precioUnitario ?? 0),
    subtotal: Number(linea.subtotal ?? 0),
    mensajePersonalizado: linea.mensajePersonalizado ?? "",
    colorId: linea.colorGlaseado?.id ?? null,
    colorNombre: linea.colorGlaseado?.nombre ?? "",
    colorHex: linea.colorGlaseado?.codigoHex ?? "",
    personalizacionAdicional: linea.personalizacionAdicional ?? "",
  };
}

function fechaISO(valor) {
  if (!valor) return "";
  if (typeof valor === "string") return valor.slice(0, 10);

  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function mapPedidoAdmin(pedido) {
  if (!pedido) return null;

  const nombreCompleto =
    pedido.cliente?.nombreCompleto ||
    `${pedido.cliente?.nombres ?? ""} ${pedido.cliente?.apellidos ?? ""}`.trim();
  const precioDomicilio = Number(pedido.precioDomicilio ?? 0);

  return {
    id: pedido.id,
    fecha: fechaISO(pedido.fecha),
    fechaEntrega: fechaISO(pedido.fechaEntrega),
    estadoId: pedido.estado?.id ?? null,
    estado: mapEstadoSlug(pedido.estado?.nombre),
    estadoNombre: pedido.estado?.nombre ?? "",
    mensajeTarjeta: pedido.mensajeTarjeta ?? "",
    cardMessage: pedido.mensajeTarjeta ?? "",
    clienteId: pedido.cliente?.id ?? null,
    cliente: nombreCompleto || "Cliente",
    clienteIdentificacion: pedido.cliente?.numeroDocumento ?? "",
    clienteCorreo: pedido.cliente?.correo ?? "",
    clienteTelefono: pedido.cliente?.telefono ?? "",
    municipioId: pedido.municipio?.id ?? null,
    municipio: pedido.municipio?.nombre ?? "",
    direccion: pedido.direccion ?? "",
    barrio: pedido.barrio ?? "",
    precioDomicilio,
    shippingCost: precioDomicilio,
    nombreReceptor: pedido.nombreReceptor ?? "",
    recipientName: pedido.nombreReceptor ?? "",
    telefonoReceptor: pedido.telefonoReceptor ?? "",
    recipientPhone: pedido.telefonoReceptor ?? "",
    comprobante: pedido.comprobantePago ?? null,
    motivoRechazo: pedido.motivoRechazo ?? "",
    instruccionesEntrega: pedido.instruccionesEntrega ?? "",
    instrucciones: pedido.instruccionesEntrega ?? "",
    observacionesEntrega: pedido.observacionesEntrega ?? "",
    evidenciaEntrega: pedido.evidenciaEntrega ?? null,
    lineas: Array.isArray(pedido.lineas) ? pedido.lineas.map(mapLinea) : [],
    subtotal: Number(pedido.subtotal ?? 0),
    total: Number(pedido.total ?? 0),
  };
}

export function mapPedidosAdmin(pedidos) {
  return Array.isArray(pedidos) ? pedidos.map(mapPedidoAdmin) : [];
}

function toLineaPayload(linea) {
  const payload = {
    idProducto: Number(linea.productoId),
    idPresentacion: Number(linea.presentacionId),
    cantidadProductos: Number(linea.unidades),
    idColorGlaseado: Number(linea.colorId),
  };

  const mensaje = String(linea.mensajePersonalizado ?? "").trim();
  if (mensaje) payload.mensajePersonalizado = mensaje;

  const extra = String(linea.personalizacionAdicional ?? "").trim();
  if (extra) payload.personalizacionAdicional = extra;

  return payload;
}

/** POST /pedidos: multipart con el comprobante y las líneas en JSON. */
export function toCrearPedidoFormData(datos = {}) {
  const formData = new FormData();

  formData.append("comprobante", datos.comprobante);
  formData.append("fechaEntrega", datos.fechaEntrega);
  formData.append("direccion", String(datos.direccion ?? "").trim());
  formData.append("barrio", String(datos.barrio ?? "").trim());
  formData.append("idMunicipio", String(datos.idMunicipio));
  formData.append("nombreReceptor", String(datos.nombreReceptor ?? "").trim());
  formData.append("telefonoReceptor", String(datos.telefonoReceptor ?? "").trim());
  formData.append("idUsuario", String(datos.idUsuario));

  const instrucciones = String(datos.instruccionesEntrega ?? "").trim();
  if (instrucciones) formData.append("instruccionesEntrega", instrucciones);

  const mensaje = String(datos.mensajeTarjeta ?? "").trim();
  if (mensaje) formData.append("mensajeTarjeta", mensaje);

  formData.append("lineas", JSON.stringify((datos.lineas ?? []).map(toLineaPayload)));
  return formData;
}

/** PUT /pedidos/:id: solo cabecera; las líneas y el comprobante no se editan. */
export function toActualizarPedidoPayload(datos = {}) {
  return {
    fechaEntrega: datos.fechaEntrega,
    direccion: String(datos.direccion ?? "").trim(),
    barrio: String(datos.barrio ?? "").trim(),
    idMunicipio: Number(datos.idMunicipio),
    nombreReceptor: String(datos.nombreReceptor ?? "").trim(),
    telefonoReceptor: String(datos.telefonoReceptor ?? "").trim(),
    // Se envían siempre para permitir dejar el campo vacío.
    instruccionesEntrega: String(datos.instruccionesEntrega ?? "").trim(),
    mensajeTarjeta: String(datos.mensajeTarjeta ?? "").trim(),
  };
}
