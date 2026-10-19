// src/features/admin/roles/data/Permissions.js
// Catálogo de permisos disponibles en el sistema: cada permiso combina un
// módulo con una acción autorizada. Es la fuente para:
//  - el checklist de permisos al crear/editar un rol
//  - el panel "Administrar permisos" (crear, editar, consultar, cambiar estado)

export const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: "fa-chart-line" },
  { key: "roles", label: "Roles", icon: "fa-shield-halved" },
  { key: "usuarios", label: "Usuarios", icon: "fa-users" },
  { key: "categorias", label: "Categorías", icon: "fa-tag" },
  { key: "productos", label: "Productos", icon: "fa-store" },
  { key: "carrito", label: "Carrito", icon: "fa-cart-shopping" },
  { key: "resenas", label: "Reseñas", icon: "fa-star" },
  { key: "pedidos", label: "Pedidos", icon: "fa-box" },
  { key: "ventas", label: "Ventas", icon: "fa-credit-card" },
];

// Acciones por módulo (clave del módulo -> array de acciones)
const MODULE_ACTIONS = {
  dashboard: [
    { key: "ver", label: "Ver" },
    { key: "generar_reporte", label: "Generar reporte" },
    { key: "exportar_reporte", label: "Exportar reporte" },
  ],
  ventas: [
    { key: "ver", label: "Ver" },
    { key: "generar_reporte", label: "Generar reporte" },
    { key: "exportar_reporte", label: "Exportar reporte" },
  ],
  // Módulos con CRUD + Cambiar estado
  roles: [
    { key: "ver", label: "Ver" },
    { key: "crear", label: "Crear" },
    { key: "editar", label: "Editar" },
    { key: "eliminar", label: "Eliminar" },
    { key: "cambiar_estado", label: "Cambiar estado" },
  ],
  usuarios: [
    { key: "ver", label: "Ver" },
    { key: "crear", label: "Crear" },
    { key: "editar", label: "Editar" },
    { key: "eliminar", label: "Eliminar" },
    { key: "cambiar_estado", label: "Cambiar estado" },
  ],
  categorias: [
    { key: "ver", label: "Ver" },
    { key: "crear", label: "Crear" },
    { key: "editar", label: "Editar" },
    { key: "eliminar", label: "Eliminar" },
    { key: "cambiar_estado", label: "Cambiar estado" },
  ],
  productos: [
    { key: "ver", label: "Ver" },
    { key: "crear", label: "Crear" },
    { key: "editar", label: "Editar" },
    { key: "eliminar", label: "Eliminar" },
    { key: "cambiar_estado", label: "Cambiar estado" },
  ],
  carrito: [
    { key: "ver", label: "Ver" },
    { key: "crear", label: "Crear" },
    { key: "editar", label: "Editar" },
    { key: "eliminar", label: "Eliminar" },
    { key: "cambiar_estado", label: "Cambiar estado" },
  ],
  resenas: [
    { key: "ver", label: "Ver" },
    { key: "crear", label: "Crear" },
    { key: "editar", label: "Editar" },
    { key: "eliminar", label: "Eliminar" },
    { key: "cambiar_estado", label: "Cambiar estado" },
  ],
  pedidos: [
    { key: "ver", label: "Ver" },
    { key: "crear", label: "Crear" },
    { key: "editar", label: "Editar" },
    { key: "eliminar", label: "Eliminar" },
    { key: "cambiar_estado", label: "Cambiar estado" },
  ],
};

// Acciones por defecto para módulos no definidos explícitamente (CRUD + Cambiar estado)
const DEFAULT_ACTIONS = [
  { key: "ver", label: "Ver" },
  { key: "crear", label: "Crear" },
  { key: "editar", label: "Editar" },
  { key: "eliminar", label: "Eliminar" },
  { key: "cambiar_estado", label: "Cambiar estado" },
];

function buildInitialPermissions() {
  const permissions = [];
  let autoId = 1;
  for (const mod of MODULES) {
    const actions = MODULE_ACTIONS[mod.key] || DEFAULT_ACTIONS;
    for (const action of actions) {
      permissions.push({
        id: autoId++,
        module: mod.key,
        moduleLabel: mod.label,
        action: action.key,
        actionLabel: action.label,
        label: `${action.label} ${mod.label}`,
        status: "activo",
      });
    }
  }
  return permissions;
}

export const INITIAL_PERMISSIONS = buildInitialPermissions();

/** Agrupa un arreglo de permisos por módulo, en el orden definido en MODULES. */
export function groupPermissionsByModule(permissions) {
  return MODULES.map((mod) => ({
    module: mod.key,
    moduleLabel: mod.label,
    moduleIcon: mod.icon,
    permissions: permissions.filter((p) => p.module === mod.key),
  })).filter((group) => group.permissions.length > 0);
}

// Ícono sugerido por nombre de rol, para el badge del listado (fallback:
// fa-user-shield para roles nuevos que el admin cree).
const ROLE_ICONS = {
  administrador: "fa-shield-halved",
  repartidor: "fa-truck-fast",
  cliente: "fa-user",
};

export function getRoleIcon(roleName) {
  return ROLE_ICONS[roleName.trim().toLowerCase()] || "fa-user-shield";
}