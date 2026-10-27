// src/shared/hooks/usePermissions.js
// Lee los permisos efectivos de la sesión y expone helpers para rutas,
// navegación y acciones. No consulta la API: el backend los envía en
// login y /auth/me.

import { useAuth } from "../../features/login/hooks/useAuth";
import {
  canEnterPanel,
  firstAllowedAdminPath,
  hasAllPermissions,
  hasPermission,
} from "../permissions/panelPermissions";

export function usePermissions() {
  const { permissions, isInitializing, role, roleName } = useAuth();

  return {
    permissions,
    isInitializing,
    role,
    roleName,
    can: (modulo, accion) => hasPermission(permissions, modulo, accion),
    canAll: (requirements) => hasAllPermissions(permissions, requirements),
    canEnterPanel: canEnterPanel(permissions),
    firstAllowedPath: firstAllowedAdminPath(permissions),
  };
}
