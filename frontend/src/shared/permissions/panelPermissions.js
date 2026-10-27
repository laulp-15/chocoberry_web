// src/shared/permissions/panelPermissions.js
//
// Configuración única de acceso al panel: permisos por ruta, menú filtrado y
// primera ruta permitida. El backend sigue siendo la autoridad final; esto
// solo evita mostrar rutas y acciones que el usuario no puede usar.

export const PANEL_ACCESS = { modulo: "Dashboard", accion: "Ver" };

export const ADMIN_NAV_ITEMS = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: "fa-chart-line",
    end: true,
    permissions: [PANEL_ACCESS],
  },
  {
    to: "/admin/roles",
    label: "Roles",
    icon: "fa-shield-halved",
    permissions: [{ modulo: "Roles", accion: "Ver" }],
  },
  {
    to: "/admin/usuarios",
    label: "Usuarios",
    icon: "fa-users",
    permissions: [{ modulo: "Usuarios", accion: "Ver" }],
  },
  {
    to: "/admin/categorias",
    label: "Categorías",
    icon: "fa-tag",
    permissions: [{ modulo: "Categorías", accion: "Ver" }],
  },
  {
    to: "/admin/productos",
    label: "Productos",
    icon: "fa-store",
    permissions: [{ modulo: "Productos", accion: "Ver" }],
  },
  {
    to: "/admin/pedidos",
    label: "Pedidos",
    icon: "fa-box",
    permissions: [{ modulo: "Pedidos", accion: "Ver" }],
  },
  {
    to: "/admin/ventas",
    label: "Ventas",
    icon: "fa-credit-card",
    permissions: [{ modulo: "Ventas", accion: "Ver" }],
  },
  {
    to: "/admin/resenas",
    label: "Reseñas",
    icon: "fa-star",
    permissions: [
      { modulo: "Reseñas", accion: "Ver" },
      { modulo: "Reseñas", accion: "Cambiar estado" },
    ],
  },
  {
    label: "Configuraciones",
    icon: "fa-sliders",
    children: [
      {
        to: "/admin/presentaciones",
        label: "Presentaciones",
        icon: "fa-layer-group",
        permissions: [{ modulo: "Productos", accion: "Ver" }],
      },
      {
        to: "/admin/municipios",
        label: "Municipios",
        icon: "fa-location-dot",
        permissions: [{ modulo: "Productos", accion: "Ver" }],
      },
      {
        to: "/admin/glaseados",
        label: "Glaseados",
        icon: "fa-palette",
        permissions: [{ modulo: "Productos", accion: "Ver" }],
      },
    ],
  },
];

export function hasPermission(permissions, modulo, accion) {
  return (
    Array.isArray(permissions) &&
    permissions.some(
      (permiso) => permiso.modulo === modulo && permiso.accion === accion
    )
  );
}

export function hasAllPermissions(permissions, requirements = []) {
  return requirements.every(({ modulo, accion }) =>
    hasPermission(permissions, modulo, accion)
  );
}

export function canEnterPanel(permissions) {
  return hasPermission(permissions, PANEL_ACCESS.modulo, PANEL_ACCESS.accion);
}

function itemAllowed(item, permissions) {
  return hasAllPermissions(permissions, item.permissions ?? []);
}

export function allowedNavItems(permissions) {
  return ADMIN_NAV_ITEMS.flatMap((item) => {
    if (item.children) {
      const children = item.children.filter((child) =>
        itemAllowed(child, permissions)
      );
      return children.length > 0 ? [{ ...item, children }] : [];
    }

    return itemAllowed(item, permissions) ? [item] : [];
  });
}

export function firstAllowedAdminPath(permissions) {
  const items = allowedNavItems(permissions);

  for (const item of items) {
    if (item.children) {
      if (item.children[0]) return item.children[0].to;
    } else if (item.to) {
      return item.to;
    }
  }

  return null;
}
