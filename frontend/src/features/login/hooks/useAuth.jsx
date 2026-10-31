// src/features/login/hooks/useAuth.jsx
//
// Gestión de acceso contra el API real (Express + JWT).
//
// La forma en que las páginas llaman a useAuth() NO cambia:
//   user, isAuthenticated, role, login, register, requestPasswordReset,
//   changePassword, logout, updateUser
//
// Toda la traducción de nombres y de errores vive en
// features/login/services/mappers.js, y las llamadas HTTP en
// features/login/services/authService.js. Este hook solo mantiene el
// estado de la sesión y la sincroniza con el almacenamiento.

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  SESSION_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  clearSession,
  getToken,
  readSession,
  refreshSessionUser,
} from "../../../shared/api/session";

import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readSession());
  const [isInitializing, setIsInitializing] = useState(() => Boolean(getToken()));

  // Al montar: si hay token, revalida la sesión contra el backend para
  // reflejar cambios de rol o de estado (deshabilitado) hechos por un
  // administrador. Si el token ya no sirve (401/403) se cierra la sesión;
  // si el backend no responde, se conserva la sesión local.
  useEffect(() => {
    if (!getToken()) return undefined;

    let activo = true;

    authService
      .me()
      .then((sesion) => {
        if (activo) setUser(refreshSessionUser(sesion));
      })
      .catch((error) => {
        if (!activo) return;
        if (error?.status === 401 || error?.status === 403) {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (activo) setIsInitializing(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Sincroniza la sesión entre pestañas del mismo navegador.
  useEffect(() => {
    function onStorage(event) {
      if (
        event.key === SESSION_STORAGE_KEY ||
        event.key === TOKEN_STORAGE_KEY
      ) {
        setUser(readSession());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function login({ email, password, remember }) {
    const sesion = await authService.login({ email, password, remember });
    setUser(sesion);
    return sesion;
  }

  function register(datos) {
    return authService.register(datos);
  }

  function requestPasswordReset(email) {
    return authService.requestPasswordReset(email);
  }

  function resetPassword(datos) {
    return authService.resetPassword(datos);
  }

  function changePassword(datos) {
    return authService.changePassword(datos);
  }

  async function logout() {
    try {
      await authService.logout();
    } catch {
      // Aunque el backend falle, la sesión local se cierra igual.
    }
    clearSession();
    setUser(null);
  }

  async function updateUser(updates) {
    const sesion = await authService.updateProfile(updates);
    setUser(refreshSessionUser(sesion));
    return sesion;
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isInitializing,
    role: user?.role ?? null,
    roleName: user?.roleName ?? null,
    permissions: user?.permissions ?? [],
    login,
    register,
    requestPasswordReset,
    resetPassword,
    changePassword,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }

  return ctx;
}
