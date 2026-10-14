// src/features/admin/roles/components/PermissionsChecklist.jsx
import React, { useState } from "react";
import { Checkbox } from "@mui/material";
import { groupPermissionsByModule } from "../data/Permissions";
import "./PermissionsChecklist.css";

/**
 * Checklist de permisos por módulo con acciones individuales.
 * Cada módulo tiene un header expandible con checkbox "seleccionar todo"
 * y lista de 4 acciones (Ver, Crear, Editar, Eliminar).
 *
 * @param {object} props
 * @param {object[]} props.permissions - catálogo de permisos activos
 * @param {number[]} props.selectedIds
 * @param {(ids: number[]) => void} props.onChange
 * @param {string} [props.error]
 */
export default function PermissionsChecklist({ permissions, selectedIds, onChange, error }) {
  const groups = groupPermissionsByModule(permissions);
  const [expandedModules, setExpandedModules] = useState(
    // Por defecto expandir los primeros 3 módulos para mejor UX
    groups.slice(0, 3).map((g) => g.module)
  );

  const isModuleExpanded = (moduleKey) => expandedModules.includes(moduleKey);

  const toggleModuleExpansion = (moduleKey) => {
    setExpandedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const toggleModule = (groupPermissions, allSelected) => {
    const ids = groupPermissions.map((p) => p.id);
    if (allSelected) {
      onChange(selectedIds.filter((id) => !ids.includes(id)));
    } else {
      onChange([...new Set([...selectedIds, ...ids])]);
    }
  };

  const toggleAction = (actionId) => {
    onChange(
      selectedIds.includes(actionId)
        ? selectedIds.filter((id) => id !== actionId)
        : [...selectedIds, actionId]
    );
  };

  return (
    <div className="permissions-checklist">
      <div className="form-label">
        <i className="fa-solid fa-shield-halved" /> Configuración de Permisos *
      </div>

      <div className="permissions-grid">
        {groups.map((group) => {
          const ids = group.permissions.map((p) => p.id);
          const selectedCount = ids.filter((id) => selectedIds.includes(id)).length;
          const allSelected = selectedCount === ids.length && ids.length > 0;
          const someSelected = selectedCount > 0 && !allSelected;
          const expanded = isModuleExpanded(group.module);

          return (
            <div
              key={group.module}
              className={`permission-module ${expanded ? "is-expanded" : ""}`}
            >
              {/* Header del módulo (div, no label: así el clic en el texto
                  solo despliega y no marca todos los permisos) */}
              <div
                className="permission-module-header"
                onClick={() => toggleModuleExpansion(group.module)}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleModuleExpansion(group.module);
                  }
                }}
              >
                <Checkbox
                  size="small"
                  disableRipple
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={() => toggleModule(group.permissions, allSelected)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="module-checkbox"
                  inputProps={{ "aria-label": `Seleccionar todo en ${group.moduleLabel}` }}
                />
                {group.moduleIcon && (
                  <i className={`fa-solid ${group.moduleIcon} module-icon`} />
                )}
                <span className="module-label">{group.moduleLabel}</span>
                <i
                  className={`fa-solid fa-chevron-down expand-icon ${expanded ? "expanded" : ""}`}
                />
              </div>

              {/* Acciones del módulo (expandible) */}
              <div className={`permission-actions ${expanded ? "expanded" : ""}`}>
                <div className="permission-actions-inner">
                  {group.permissions.map((perm) => (
                    <label key={perm.id} className="permission-action">
                      <Checkbox
                        size="small"
                        disableRipple
                        checked={selectedIds.includes(perm.id)}
                        onChange={() => toggleAction(perm.id)}
                      />
                      <span className="action-label">{perm.actionLabel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && <div className="form-error">{error}</div>}
    </div>
  );
}