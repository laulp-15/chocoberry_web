// src/features/admin/roles/hooks/useRoles.js
// Estado del módulo de Roles contra /api/roles y /api/permisos.

import { useEffect, useState } from "react";
import useDebouncedValue from "../../../../shared/hooks/useDebouncedValue";
import {
  actualizarRol,
  crearRol,
  eliminarRol,
  listarPermisos,
  listarRoles,
  obtenerPermisosDeRol,
} from "../services/roleService";

const PAGE_SIZE = 10;

export default function useRoles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setError("");

      try {
        const [respuestaRoles, permisosApi] = await Promise.all([
          listarRoles({
            page,
            limit: PAGE_SIZE,
            nombre: debouncedSearch.trim() || undefined,
          }),
          listarPermisos(),
        ]);

        const rolesApi = respuestaRoles.data;
        const metaApi = respuestaRoles.meta;

        const permisosPorRol = await Promise.all(
          rolesApi.map((rol) => obtenerPermisosDeRol(rol.id))
        );

        if (!activo) return;

        setPermissions(permisosApi);
        setMeta(metaApi);
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

        if (metaApi && page > metaApi.totalPages) {
          setPage(metaApi.totalPages);
        }
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
  }, [reloadKey, page, debouncedSearch]);

  function reload() {
    setReloadKey((current) => current + 1);
  }

  function handleSearchChange(value) {
    setSearchTerm(value);
    setPage(1);
  }

  async function createRole(data) {
    const nuevoRol = await crearRol(data);
    setPage(1);
    reload();
    return nuevoRol;
  }

  async function updateRole(id, data) {
    const rolActualizado = await actualizarRol(id, data);
    reload();
    return rolActualizado;
  }

  async function deleteRole(id) {
    await eliminarRol(id);
    reload();
  }

  return {
    roles,
    permissions,
    activePermissions: permissions,
    searchTerm,
    handleSearchChange,
    page,
    setPage,
    meta,
    loading,
    error,
    reload,
    createRole,
    updateRole,
    deleteRole,
  };
}
