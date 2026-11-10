// src/shared/permissions/panelPermissions.js
//
// Configuración única de acceso al panel: permisos por ruta, menú filtrado y
// primera ruta permitida. El backend sigue siendo la autoridad final; esto
// solo evita mostrar rutas y acciones que el usuario no puede usar. Cualquier
// rol distinto del Cliente entra al panel si tiene al menos un módulo visible;
// el Cliente siempre permanece en la tienda.

export const DASHBOARD_ACCESS = { modulo: "Dashboard", accion: "Ver" };

// El rol Cliente es el único perfil de tienda. Se identifica por id (robusto
// ante renombres) y por slug como respaldo para sesiones antiguas.
const CLIENT_ROLE_ID = 3;

export const ADMIN_NAV_ITEMS = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: "fa-chart-line",
    end: true,
    permissions: [DASHBOARD_ACCESS],
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
    permissions: [{ modulo: "Reseñas", accion: "Ver" }],
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

/**
 * Hay acceso al panel si el rol no es Cliente y puede ver al menos un módulo
 * del menú, aunque solo tenga permisos de lectura compartidos con la tienda.
 */
export function canEnterPanel(permissions, role = "", roleId = null) {
  if (!Array.isArray(permissions)) return false;

  const esCliente =
    Number(roleId) === CLIENT_ROLE_ID ||
    String(role).trim().toLowerCase() === "cliente";

  if (esCliente) return false;

  return allowedNavItems(permissions).length > 0;
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

function normalizarRuta(path) {
  const valor = String(path ?? "").trim();
  if (!valor) return "";
  return valor.length > 1 ? valor.replace(/\/+$/, "") : valor;
}

function itemMatchesPath(item, path) {
  const destino = normalizarRuta(item.to);
  if (!destino) return false;
  return path === destino || path.startsWith(`${destino}/`);
}

/** Indica si una ruta /admin concreta está habilitada para los permisos dados. */
export function isAllowedAdminPath(path, permissions) {
  const destino = normalizarRuta(path);
  if (!destino.startsWith("/admin")) return false;

  return allowedNavItems(permissions).some((item) => {
    if (item.children) {
      return item.children.some((child) => itemMatchesPath(child, destino));
    }
    return itemMatchesPath(item, destino);
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
