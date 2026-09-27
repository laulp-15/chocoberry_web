// src/features/admin/roles/components/RoleDetailContent.jsx
import React from "react";
import { groupPermissionsByModule } from "../data/Permissions";
import "./RoleDetailContent.css";

function formatDisplayDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Contenido de "ver detalle" de un rol. Solo lectura.
 */
export default function RoleDetailContent({ role, permissions }) {
  const rolePermissions = permissions.filter((p) => role.permissionIds.includes(p.id));
  const groups = groupPermissionsByModule(rolePermissions);

  return (
    <div className="role-detail-content">
      <div className="role-detail-top">
        <span className="role-detail-date">
          <i className="fa-solid fa-calendar" /> Creado el {formatDisplayDate(role.createdAt)}
        </span>
      </div>

      <div className="detail-section">
        <div className="role-detail-label">Nombre del rol</div>
        <div className="role-detail-value">{role.name}</div>
      </div>

      <div className="detail-section">
        <div className="role-detail-label">Usuarios asignados</div>
        <div className="role-detail-value">{role.usersCount}</div>
      </div>

      <div className="detail-section">
        <div className="role-detail-title">
          <i className="fa-solid fa-shield-halved" />
          Módulos con acceso ({groups.length})
        </div>

        {groups.length === 0 ? (
          <div className="role-detail-muted">Este rol no tiene módulos asignados.</div>
        ) : (
          <div className="role-detail-permission-groups">
            <div className="role-detail-permission-chips">
              {groups.map((group) => (
                <span key={group.module} className="role-detail-chip">
                  {group.moduleLabel}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}