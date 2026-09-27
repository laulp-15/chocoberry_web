// src/features/admin/roles/pages/RolesListPage.jsx
import React, { useState } from "react";
import DataTable from "../../../../shared/components/DataTable";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import OrderNotification from "../../orders/components/OrderNotification";
import { useRolesContext } from "../context/RolesContext";
import { getRoleIcon } from "../data/Permissions";
import RoleDetailModal from "../components/RoleDetailModal";
import RoleFormModal from "../components/RoleFormModal";

import "./RolesListPage.css";

export default function RolesListPage() {
  const {
    roles,
    permissions,
    deleteRole,
  } = useRolesContext();

  const [detailRole, setDetailRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  
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
      });
      setDeletingRole(null);
      setDeleteError("");
    } catch (err) {
      setDeleteError(err.message || "No se pudo eliminar el rol.");
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
      key: "permissionIds",
      label: "Permisos",
      render: (row) => <span className="roles-permission-count">{row.permissionIds.length}</span>,
    },
    { key: "usersCount", label: "Usuarios" },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => {
        const isAdmin = row.name.toLowerCase() === "administrador";

        return (
          <div className="roles-row-actions">
            <i className="fa-solid fa-eye" title="Ver detalle" onClick={() => setDetailRole(row)} />
            <i className="fa-solid fa-pen" title="Editar" onClick={() => openEdit(row)} />
            <i
              className={`fa-solid fa-trash ${isAdmin ? "disabled" : ""}`}
              title={isAdmin ? "El rol de Administrador no se puede eliminar" : "Eliminar"}
              onClick={() => {
                if (isAdmin) return;
                setDeleteError("");
                setDeletingRole(row);
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="roles-page-container">
      <DataTable
        title="Roles"
        description="Define y administra los niveles de acceso para tu equipo de ChocoBerry."
        createLabel="Nuevo rol"
        onCreate={openCreate}
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
        description={
          deleteError ||
          `El rol "${deletingRole?.name}" será eliminado y esta acción no se puede deshacer.`
        }
        confirmLabel="Sí, eliminar rol"
        cancelLabel="Volver"
      />

      {/* Notificación flotante de éxito */}
      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        title={notification?.title}
        message={notification?.message}
      />
    </div>
  );
}