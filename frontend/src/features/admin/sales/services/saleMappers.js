// src/features/admin/sales/services/saleMappers.js
//
// Ventas reutiliza el contrato de pedidos: el backend devuelve el mismo shape
// que /api/pedidos. Aquí se adapta a la forma que espera SaleReceipt, sin
// duplicar la traducción de estados, fechas ni precios.
import { mapPedidoAdmin } from "../../orders/services/orderMappers";

function mapProducto(linea) {
  return {
    lineId: linea.id,
    productId: linea.productoId,
    productName: linea.productoNombre,
    productImage: linea.productoImagen,
    quantity: linea.cantidadFresas,
    color: linea.colorNombre,
    colorHex: linea.colorHex,
    decorativeMessage: linea.mensajePersonalizado,
    extraCustomization: linea.personalizacionAdicional,
    units: linea.unidades,
    unitPrice: linea.precioUnitario,
    subtotal: linea.subtotal,
  };
}

export function mapVentaAdmin(venta) {
  const pedido = mapPedidoAdmin(venta);
  if (!pedido) return null;

  return {
    ...pedido,
    fechaVenta: pedido.fecha,
    municipioNombre: pedido.municipio,
    products: pedido.lineas.map(mapProducto),
  };
}

export function mapVentasAdmin(ventas) {
  return Array.isArray(ventas) ? ventas.map(mapVentaAdmin) : [];
}
