// src/features/admin/roles/pages/RolesListPage.jsx
import { useState } from "react";
import DataTable from "../../../../shared/components/DataTable";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import OrderNotification from "../../orders/components/OrderNotification";
import { useRolesContext } from "../context/RolesContext";
import { getRoleIcon } from "../data/Permissions";
import RoleDetailModal from "../components/RoleDetailModal";
import RoleFormModal from "../components/RoleFormModal";
import { slugify } from "../services/roleMappers";
import { usePermissions } from "../../../../shared/hooks/usePermissions";

import "./RolesListPage.css";

export default function RolesListPage() {
  const {
    roles,
    permissions,
    loading,
    error,
    reload,
    deleteRole,
  } = useRolesContext();
  const { can } = usePermissions();

  const canCreate = can("Roles", "Crear");
  const canEdit = can("Roles", "Editar");
  const canDelete = can("Roles", "Eliminar");

  const [detailRole, setDetailRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);

  // Estado para la notificación flotante
  const [notification, setNotification] = useState(null);

  // Crear/Editar rol: un solo modal (RoleFormModal)
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const openCreate = () => {
    setEditingRole(null);
    setFormOpen(true);
  };

  const openEdit = (role) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleSaved = (message) => {
    setFormOpen(false);
    setNotification({
      title: "Gestión de Roles",
      message: message || "Rol guardado correctamente.",
    });
  };

  const confirmDelete = async () => {
    try {
      await deleteRole(deletingRole.id);
      setNotification({
        title: "Gestión de Roles",
        message: "Rol eliminado correctamente.",
        variant: "success",
      });
      setDeletingRole(null);
    } catch (err) {
      setNotification({
        title: "No se pudo eliminar el rol",
        message:
          err?.status === 409
            ? err.message ||
              "No puedes eliminar este rol porque varios usuarios lo están usando."
            : err?.message || "No se pudo eliminar el rol.",
        variant: "error",
      });
    }
  };

  const columns = [
    {
      key: "name",
      label: "Nombre del rol",
      render: (row) => (
        <span className="roles-name-cell">
          <i className={`fa-solid ${getRoleIcon(row.name)}`} />
          {row.name}
        </span>
      ),
    },
    {
      key: "permissionsCount",
      label: "Permisos",
      render: (row) => (
        <span className="roles-permission-count">{row.permissionsCount}</span>
      ),
    },
    { key: "usersCount", label: "Usuarios" },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => {
        const isAdminRole =
          row.id === 1 || slugify(row.name) === "administrador";

        return (
          <div className="roles-row-actions">
            <i
              className="fa-solid fa-eye"
              title="Ver detalle"
              onClick={() => setDetailRole(row)}
            />
            {canEdit && (
              <i
                className="fa-solid fa-pen"
                title="Editar"
                onClick={() => openEdit(row)}
              />
            )}
            {canDelete && (
              <i
                className={`fa-solid fa-trash ${isAdminRole ? "disabled" : ""}`}
                title={
                  isAdminRole
                    ? "El rol de Administrador no se puede eliminar"
                    : "Eliminar"
                }
                aria-disabled={isAdminRole}
                onClick={() => {
                  if (isAdminRole) return;
                  setDeletingRole(row);
                }}
              />
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="roles-state" role="status">
        <i className="fa-solid fa-spinner fa-spin" />
        <p>Cargando roles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="roles-state roles-state--error" role="alert">
        <i className="fa-solid fa-circle-exclamation" />
        <p>{error}</p>
        <button type="button" className="btn-save" onClick={reload}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="roles-page-container">
      <DataTable
        title="Roles"
        description="Define y administra los niveles de acceso para tu equipo de ChocoBerry."
        createLabel={canCreate ? "Crear rol" : undefined}
        onCreate={canCreate ? openCreate : undefined}
        columns={columns}
        data={roles}
        searchPlaceholder="Buscar rol por nombre..."
        emptyMessage="No se encontraron roles."
      />

      <RoleFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editingRole}
        onSaved={handleSaved}
      />

      <RoleDetailModal
        open={Boolean(detailRole)}
        onClose={() => setDetailRole(null)}
        role={detailRole}
        permissions={permissions}
      />

      {/* Modal de confirmación con diseño rojo de advertencia */}
      <ConfirmModal
        open={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="¿Eliminar este rol?"
        description={`El rol "${deletingRole?.name}" será eliminado y esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar rol"
        cancelLabel="Volver"
      />

      {/* Notificación flotante de éxito */}
      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        title={notification?.title}
        message={notification?.message}
        variant={notification?.variant}
      />
    </div>
  );
}