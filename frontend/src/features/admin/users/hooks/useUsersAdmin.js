// src/features/admin/users/hooks/useUsersAdmin.js
//
// Gestión de usuarios del panel administrador contra el API real
// (/api/usuarios). El estado vive aquí; las llamadas HTTP, en
// features/admin/users/services/userService.js, y la traducción de
// nombres/errores, en features/admin/users/services/userMappers.js.
//
// Regla de negocio: no se puede eliminar un usuario con pedidos asociados.
// Eso lo valida el BACKEND (409 con el conteo real de pedidos); el hook solo
// propaga el mensaje. Ya no se cruza contra pedidos mock.

import { useEffect, useState } from "react";

import * as userService from "../services/userService";

export default function useUsersAdmin({ autoLoad = true } = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState("");

  // Token que fuerza volver a consultar el API (lo usa el botón "Reintentar").
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // Si no se pide autoload, se salta la primera carga; tras un reload()
    // (token > 0) siempre se consulta el API.
    if (!autoLoad && reloadToken === 0) return undefined;

    let activo = true;

    userService
      .listar()
      .then((lista) => {
        if (!activo) return;
        setUsers(lista);
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || "No se pudieron cargar los usuarios.");
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [autoLoad, reloadToken]);

  /** Vuelve a pedir la lista al API (mantiene el estado de carga visible). */
  function reload() {
    setLoading(true);
    setError("");
    setReloadToken((valor) => valor + 1);
  }

  function getUserById(id) {
    return users.find((user) => String(user.id) === String(id)) ?? null;
  }

  // ---------------------------------------------------------------------------
  // MUTACIONES
  // Los cambios se reflejan en el estado con la respuesta del backend, que es
  // la fuente de verdad (no se "adivina" el resultado en el front).
  // ---------------------------------------------------------------------------

  async function createUser(payload) {
    const nuevo = await userService.crear(payload);
    setUsers((prev) => [nuevo, ...prev]);
    return nuevo;
  }

  async function updateUser(id, payload) {
    const actualizado = await userService.actualizar(id, payload);
    setUsers((prev) =>
      prev.map((user) => (String(user.id) === String(id) ? actualizado : user))
    );
    return actualizado;
  }

  async function setActive(id, active) {
    const actualizado = await userService.cambiarEstado(id, active);
    setUsers((prev) =>
      prev.map((user) => (String(user.id) === String(id) ? actualizado : user))
    );
    return actualizado;
  }

  async function removeUser(id) {
    await userService.eliminar(id);
    setUsers((prev) => prev.filter((user) => String(user.id) !== String(id)));
  }

  return {
    users,
    loading,
    error,

    reload,

    createUser,
    updateUser,
    setActive,
    removeUser,
    getUserById,
  };
}
