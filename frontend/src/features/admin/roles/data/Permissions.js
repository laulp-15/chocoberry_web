// src/features/admin/roles/data/Permissions.js
// Metadata visual del catálogo de permisos. El catálogo real viene de
// /api/permisos; aquí solo viven iconos y el orden de los módulos.

const MODULE_ORDER = [
  "Dashboard",
  "Roles",
  "Usuarios",
  "Categorías",
  "Productos",
  "Carrito",
  "Reseñas",
  "Pedidos",
  "Ventas",
];

const MODULE_ICONS = {
  dashboard: "fa-chart-line",
  roles: "fa-shield-halved",
  usuarios: "fa-users",
  categorias: "fa-tag",
  productos: "fa-store",
  carrito: "fa-cart-shopping",
  resenas: "fa-star",
  pedidos: "fa-box",
  ventas: "fa-credit-card",
};

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getModuleIcon(moduleName) {
  return MODULE_ICONS[normalizar(moduleName)] || "fa-key";
}

/** Agrupa permisos por módulo respetando el orden conocido del panel. */
export function groupPermissionsByModule(permissions) {
  const groups = new Map();

  for (const permiso of permissions) {
    if (!groups.has(permiso.module)) {
      groups.set(permiso.module, {
        module: permiso.module,
        moduleLabel: permiso.moduleLabel,
        moduleIcon: getModuleIcon(permiso.module),
        permissions: [],
      });
    }
    groups.get(permiso.module).permissions.push(permiso);
  }

  return [...groups.values()].sort((a, b) => {
    const indexA = MODULE_ORDER.indexOf(a.module);
    const indexB = MODULE_ORDER.indexOf(b.module);

    if (indexA === -1 && indexB === -1) return a.module.localeCompare(b.module);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}

// Icono sugerido por nombre de rol, para el badge del listado (fallback:
// fa-user-shield para roles nuevos que el admin cree).
const ROLE_ICONS = {
  administrador: "fa-shield-halved",
  repartidor: "fa-truck-fast",
  cliente: "fa-user",
};

export function getRoleIcon(roleName) {
  return ROLE_ICONS[normalizar(roleName)] || "fa-user-shield";
}
