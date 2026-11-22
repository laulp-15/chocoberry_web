function hoyISO() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function compararPorIdDesc(a, b) {
  return Number(b.id ?? 0) - Number(a.id ?? 0);
}

function compararPorCreacionDesc(a, b) {
  const fechaA = String(a.fecha ?? "");
  const fechaB = String(b.fecha ?? "");

  if (fechaA !== fechaB) return fechaB.localeCompare(fechaA);
  return compararPorIdDesc(a, b);
}

function compararPorEntregaDesc(a, b) {
  const fechaA = String(a.fechaEntrega ?? "");
  const fechaB = String(b.fechaEntrega ?? "");

  if (!fechaA && !fechaB) return compararPorCreacionDesc(a, b);
  if (!fechaA) return 1;
  if (!fechaB) return -1;

  const porFecha = fechaB.localeCompare(fechaA);
  return porFecha !== 0 ? porFecha : compararPorCreacionDesc(a, b);
}

function compararActivos(a, b) {
  const hoy = hoyISO();
  const fechaA = String(a.fechaEntrega ?? "");
  const fechaB = String(b.fechaEntrega ?? "");

  if (!fechaA && !fechaB) return compararPorCreacionDesc(a, b);
  if (!fechaA) return 1;
  if (!fechaB) return -1;

  const vencidaA = fechaA < hoy;
  const vencidaB = fechaB < hoy;
  if (vencidaA !== vencidaB) return vencidaA ? -1 : 1;

  const porFecha = vencidaA
    ? fechaB.localeCompare(fechaA)
    : fechaA.localeCompare(fechaB);
  return porFecha !== 0 ? porFecha : compararPorCreacionDesc(a, b);
}

function fechaCancelacionTimestamp(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
}

function compararPorCancelacionDesc(a, b) {
  const fechaA = fechaCancelacionTimestamp(a.fechaCancelacion);
  const fechaB = fechaCancelacionTimestamp(b.fechaCancelacion);

  if (fechaA === null && fechaB === null) return compararPorCreacionDesc(a, b);
  if (fechaA === null) return 1;
  if (fechaB === null) return -1;

  if (fechaA !== fechaB) return fechaB - fechaA;
  return compararPorCreacionDesc(a, b);
}

export function sortOrdersByStatus(lista, estado) {
  const pedidos = Array.isArray(lista) ? [...lista] : [];

  switch (estado) {
    case "en_preparacion":
    case "despachado":
      return pedidos.sort(compararActivos);
    case "entregado":
      return pedidos.sort(compararPorEntregaDesc);
    case "cancelado":
      return pedidos.sort(compararPorCancelacionDesc);
    case "rechazado":
    case "pendiente":
    case "todos":
    default:
      return pedidos.sort(compararPorCreacionDesc);
  }
}
