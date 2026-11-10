// src/features/admin/users/hooks/useRoleOptions.js
// Carga el catálogo de roles del backend para los selectores y badges.

import { useEffect, useState } from "react";
import { listarOpcionesRoles } from "../services/userService";
import { FALLBACK_ROLE_OPTIONS } from "../utils/roles";

export default function useRoleOptions() {
  const [options, setOptions] = useState(FALLBACK_ROLE_OPTIONS);

  useEffect(() => {
    let activo = true;

    listarOpcionesRoles()
      .then((roles) => {
        if (activo && roles.length > 0) setOptions(roles);
      })
      .catch(() => {
        // Se conservan las opciones base si el catálogo no está disponible.
      });

    return () => {
      activo = false;
    };
  }, []);

  return options;
}
