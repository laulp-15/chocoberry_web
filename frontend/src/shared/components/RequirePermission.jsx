// src/shared/components/RequirePermission.jsx
// Guards de autorización del panel basados en permisos efectivos.

import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";

function PermissionLoading() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      Cargando permisos...
    </div>
  );
}

export function RequirePanelAccess({ children }) {
  const { canEnterPanel, isInitializing } = usePermissions();

  if (isInitializing) return <PermissionLoading />;
  if (!canEnterPanel) return <Navigate to="/productos" replace />;

  return children;
}

/**
 * Protege una ruta del panel con uno o varios permisos del mismo módulo.
 * Si el usuario no puede entrar al panel, vuelve a la tienda; si puede
 * entrar pero no tiene el módulo, se muestra la pantalla de sin acceso.
 */
export default function RequirePermission({
  module,
  actions = ["Ver"],
  children,
}) {
  const { canAll, canEnterPanel, isInitializing } = usePermissions();
  const location = useLocation();

  if (isInitializing) return <PermissionLoading />;
  if (!canEnterPanel) return <Navigate to="/productos" replace />;

  const requirements = module
    ? actions.map((accion) => ({ modulo: module, accion }))
    : [];

  if (!canAll(requirements)) {
    return (
      <Navigate
        to="/admin/sin-acceso"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
