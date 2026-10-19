// src/features/login/hooks/useAuthTheme.js
import { useTheme } from "../../../shared/context/ThemeContext";

/**
 * Tema claro/oscuro para las vistas de acceso (login, registro,
 * recuperar y cambiar contraseña).
 *
 * Delega en el ThemeContext unificado para que todo el sitio
 * (login, perfil, admin, tienda) comparta el mismo estado de tema.
 */
export default function useAuthTheme() {
  return useTheme();
}
