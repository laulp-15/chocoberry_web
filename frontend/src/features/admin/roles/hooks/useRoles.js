// src/features/admin/roles/hooks/useRoles.js
// Estado del módulo de Roles contra /api/roles y /api/permisos.

import { useEffect, useState } from "react";
import {
  actualizarRol,
  crearRol,
  eliminarRol,
  listarPermisos,
  listarRoles,
  obtenerPermisosDeRol,
} from "../services/roleService";

export default function useRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setLoading(true);
      setError("");

      try {
        const [rolesApi, permisosApi] = await Promise.all([
          listarRoles(),
          listarPermisos(),
        ]);

        const permisosPorRol = await Promise.all(
          rolesApi.map((rol) => obtenerPermisosDeRol(rol.id))
        );

        if (!activo) return;

        setPermissions(permisosApi);
        setRoles(
          rolesApi.map((rol, index) => {
            const permisosRol = permisosPorRol[index] ?? [];
            return {
              ...rol,
              permissionIds: permisosRol.map((permiso) => permiso.id),
              permissionsCount: permisosRol.length,
            };
          })
        );
      } catch (err) {
        if (!activo) return;
        setError(
          err?.message ||
            "No se pudieron cargar los roles. Intenta nuevamente."
        );
      } finally {
        if (activo) setLoading(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [reloadKey]);

  function reload() {
    setReloadKey((current) => current + 1);
  }

  async function createRole(data) {
    const nuevoRol = await crearRol(data);
    setRoles((prev) => [...prev, nuevoRol].sort((a, b) => a.id - b.id));
    return nuevoRol;
  }

  async function updateRole(id, data) {
    const rolActualizado = await actualizarRol(id, data);
    setRoles((prev) =>
      prev.map((rol) => (rol.id === id ? rolActualizado : rol))
    );
    return rolActualizado;
  }

  async function deleteRole(id) {
    await eliminarRol(id);
    setRoles((prev) => prev.filter((rol) => rol.id !== id));
  }

  return {
    roles,
    permissions,
    activePermissions: permissions,
    loading,
    error,
    reload,
    createRole,
    updateRole,
    deleteRole,
  };
}
