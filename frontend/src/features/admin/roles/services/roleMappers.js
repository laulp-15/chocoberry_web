// src/features/admin/roles/services/roleMappers.js
// Traduce el contrato de /api/roles y /api/permisos a la forma que usan
// los componentes del módulo.

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function slugify(texto) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mapRolFromApi(rol, permissionIds = []) {
  if (!rol) return null;

  return {
    id: rol.id,
    name: rol.nombre ?? "",
    permissionIds: [...new Set(permissionIds.map(Number))],
    permissionsCount: Number(rol.permisos ?? permissionIds.length ?? 0),
    usersCount: Number(rol.usuarios ?? 0),
  };
}

export function mapPermisoFromApi(permiso) {
  if (!permiso) return null;

  const modulo = permiso.modulo?.nombre ?? "Sin módulo";
  const accion = permiso.accion?.nombre ?? "Sin acción";

  return {
    id: permiso.id,
    label: permiso.nombre ?? `${accion} ${modulo}`,
    module: modulo,
    moduleLabel: modulo,
    action: accion,
    actionLabel: accion,
  };
}

export function toRolPayload({ name, permissionIds }) {
  return {
    nombre: String(name ?? "").trim(),
    permisos: permissionIds.map(Number),
  };
}
