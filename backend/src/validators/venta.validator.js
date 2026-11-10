// src/validators/venta.validator.js
// Ventas reutiliza los filtros de pedidos. Se excluye idEstado porque Ventas
// trabaja con nombres de estado y solo acepta los estados de venta.
import { filtrosPedidoSchema } from './pedido.validator.js';

export const filtrosVentaSchema = filtrosPedidoSchema.omit({ idEstado: true });
