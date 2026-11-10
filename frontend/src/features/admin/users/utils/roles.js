// src/features/admin/users/utils/roles.js
//
// Opciones de respaldo para pintar roles mientras llega /api/roles/opciones.
// Los roles reales (incluidos los creados en el panel) se cargan con
// useRoleOptions; este archivo no es la fuente de verdad.

export const FALLBACK_ROLE_OPTIONS = [
  { value: "cliente", label: "Cliente" },
  { value: "repartidor", label: "Repartidor" },
  { value: "administrador", label: "Administrador" },
];

export function roleLabel(role, options = FALLBACK_ROLE_OPTIONS) {
  if (!role) return "Sin rol";
  return options.find((option) => option.value === role)?.label ?? role;
}
