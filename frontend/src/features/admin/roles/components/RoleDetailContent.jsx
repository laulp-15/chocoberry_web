// src/features/admin/roles/components/RoleDetailContent.jsx
import { groupPermissionsByModule } from "../data/Permissions";
import "./RoleDetailContent.css";

/**
 * Contenido de "ver detalle" de un rol. Solo lectura.
 */
export default function RoleDetailContent({ role, permissions }) {
  const rolePermissions = permissions.filter((p) => role.permissionIds.includes(p.id));
  const groups = groupPermissionsByModule(rolePermissions);

  // Total de acciones disponibles por módulo (para el contador "concedidas/total").
  const totalByModule = permissions.reduce((acc, p) => {
    acc[p.module] = (acc[p.module] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="role-detail-content">
      {/* Resumen del rol */}
      <div className="detail-section role-detail-summary">
        <div className="role-detail-summary-head">
          <h3 className="role-detail-name">{role.name}</h3>
        </div>

        <div className="role-detail-stats">
          <div className="role-detail-stat">
            <span className="role-detail-stat-value">{role.usersCount}</span>
            <span className="role-detail-stat-label">
              <i className="fa-solid fa-users" /> Usuarios asignados
            </span>
          </div>
          <div className="role-detail-stat">
            <span className="role-detail-stat-value">{rolePermissions.length}</span>
            <span className="role-detail-stat-label">
              <i className="fa-solid fa-key" /> Permisos
            </span>
          </div>
        </div>
      </div>

      {/* Módulos y acciones con acceso */}
      <div className="detail-section">
        <div className="role-detail-title">
          <i className="fa-solid fa-shield-halved" />
          Módulos y acciones con acceso ({groups.length})
        </div>

        {groups.length === 0 ? (
          <div className="role-detail-muted">Este rol no tiene módulos asignados.</div>
        ) : (
          <div className="role-modules-grid">
            {groups.map((group) => (
              <div key={group.module} className="role-module">
                <div className="role-module-header">
                  <span className="role-module-icon">
                    <i className={`fa-solid ${group.moduleIcon}`} />
                  </span>
                  <span className="role-module-name">{group.moduleLabel}</span>
                  <span className="role-module-count">
                    {group.permissions.length}/{totalByModule[group.module] || group.permissions.length}
                  </span>
                </div>

                <div className="role-module-actions">
                  {group.permissions.map((perm) => (
                    <span key={perm.id} className="role-action-chip">
                      <i className="fa-solid fa-check" /> {perm.actionLabel}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
