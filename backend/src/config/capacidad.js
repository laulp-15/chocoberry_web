// src/config/capacidad.js
// Reglas de capacidad diaria de producción. Los números viven aquí para que
// sean fáciles de ajustar; el tope estándar también se guarda en `configuracion`.
export const CLAVE_TOPE_ESTANDAR = 'capacidad_dia_max_fresas';

// Se usa si la fila de configuración no existe o no es un entero válido.
export const CAPACIDAD_ESTANDAR_DEFAULT = 200;

// Un pedido de la tienda con más fresas que este umbral requiere cotización.
// El panel queda exento de esta regla (puede registrar pedidos telefónicos).
export const UMBRAL_COTIZACION_FRESAS = 200;

// Ventana máxima de programación: hoy + 20 días.
export const VENTANA_MAXIMA_DIAS = 20;

// Anticipación mínima según las fresas totales del pedido (tramos inclusivos).
export const ANTICIPACION_POR_FRESAS = [
  { hasta: 40, dias: 2 },
  { hasta: 150, dias: 10 },
  { hasta: Infinity, dias: 15 },
];

// Estados que ocupan cupo. Solo "Rechazado" libera la fecha.
export const ESTADOS_OCUPAN_CUPO = [
  'Pendiente',
  'En preparación',
  'Despachado',
  'Entregado',
  'Cancelado',
];

/** Días mínimos de anticipación para un pedido con `fresas` totales. */
export function diasAnticipacionParaFresas(fresas) {
  const total = Number(fresas) || 0;
  const tramo = ANTICIPACION_POR_FRESAS.find(({ hasta }) => total <= hasta);
  return tramo ? tramo.dias : ANTICIPACION_POR_FRESAS.at(-1).dias;
}
