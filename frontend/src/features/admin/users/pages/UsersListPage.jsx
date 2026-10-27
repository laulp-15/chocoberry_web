// src/features/admin/users/pages/UsersListPage.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../shared/components/DataTable";
import StatusToggle from "../../../../shared/components/StatusToggle";
import FormSelect from "../../../../shared/components/FormSelect";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import OrderNotification from "../../orders/components/OrderNotification";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useUsersAdmin from "../hooks/useUsersAdmin";
import useRoleOptions from "../hooks/useRoleOptions";
import UserFormModal from "../components/UserFormModal";
import RoleBadge from "../components/RoleBadge";
import { roleLabel } from "../utils/roles";
import "./UsersListPage.css";

const STATUS_OPTIONS = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];

export default function UsersListPage() {
  const { users, loading, error, reload, createUser, updateUser, setActive, removeUser } =
    useUsersAdmin();
  const { can } = usePermissions();
  const roleOptions = useRoleOptions();
  const navigate = useNavigate();

  const canCreate = can("Usuarios", "Crear");
  const canEdit = can("Usuarios", "Editar");
  const canDelete = can("Usuarios", "Eliminar");
  const canToggle = can("Usuarios", "Cambiar estado");
  const canManage = canCreate || canEdit || canDelete || canToggle;

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [notification, setNotification] = useState(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === "activo" && u.active === false) return false;
      if (statusFilter === "inactivo" && u.active !== false) return false;
      return true;
    });
  }, [users, roleFilter, statusFilter]);

  function openCreate() {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setFormOpen(true);
  }

  async function handleFormSubmit(payload) {
    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        setNotification({
          message: `Los datos de ${payload.fullName} se guardaron correctamente.`,
        });
      } else {
        await createUser(payload);
        setNotification({
          message: `${payload.fullName} ya puede iniciar sesión con el correo registrado.`,
        });
      }
      setFormOpen(false);
    } finally {
      setSubmitting(false);
    }
    // Los errores (ej. EMAIL_TAKEN) los captura el propio modal y no
    // deben cerrarlo, por eso no hay catch aquí — se relanzan solas.
  }

  async function handleToggleActive(user, value) {
    try {
      await setActive(user.id, value);
      setNotification({
        message: value
          ? `${user.fullName} ya puede acceder al sistema.`
          : `${user.fullName} no podrá iniciar sesión hasta que se vuelva a habilitar.`,
      });
    } catch (err) {
      setNotification({
        message: err.message || "No se pudo cambiar el estado del usuario.",
        variant: "error",
      });
    }
  }

  // La regla "no eliminar con pedidos asociados" la valida el backend: si
  // rechaza el borrado, confirmDelete() muestra su mensaje.
  function askDelete(user) {
    setConfirmTarget(user);
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    try {
      await removeUser(confirmTarget.id);
      setNotification({
        message: `${confirmTarget.fullName} perdió su acceso al sistema.`,
      });
    } catch (err) {
      setNotification({
        message: err.message,
        variant: "error",
      });
    } finally {
      setConfirmTarget(null);
    }
  }

  const columns = [
    { key: "idNumber", label: "N. Identificación", render: (row) => row.idNumber || "—" },
    { key: "fullName", label: "Usuario" },
    { key: "email", label: "Correo" },
    { key: "phone", label: "Teléfono", render: (row) => row.phone || "—" },
    { key: "address", label: "Dirección", render: (row) => row.address || "—" },
    {
      key: "role",
      label: "Rol",
      render: (row) => <RoleBadge role={row.role} options={roleOptions} />,
    },
    {
      key: "active",
      label: "Estado",
      render: (row) => (
        <div className="users-status-cell">
          <StatusToggle
            checked={row.active !== false}
            onChange={(v) => handleToggleActive(row, v)}
            disabled={!canToggle}
          />
        </div>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="users-actions-cell">
          <i
            className="fa-solid fa-eye"
            title="Ver detalle"
            onClick={() => navigate(`/admin/usuarios/${row.id}`)}
          />
          {canEdit && (
            <i
              className="fa-solid fa-pen users-action-edit"
              title="Editar"
              onClick={() => openEdit(row)}
            />
          )}
          {canDelete && (
            <i
              className="fa-solid fa-trash users-action-delete"
              title="Eliminar"
              onClick={() => askDelete(row)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="users-page">
        <DataTable
          title="Usuarios"
          description="Administra el personal autorizado y sus roles de acceso al sistema."
          createLabel={canCreate ? "Crear usuario" : undefined}
          onCreate={canCreate ? openCreate : undefined}
          columns={columns}
          data={filtered}
          searchPlaceholder="Buscar usuario por nombre o correo..."
          emptyMessage={
            loading
              ? "Cargando usuarios..."
              : "No se encontraron usuarios con esos criterios."
          }
          extraFilter={
            <div className="users-extra-filters">
              <FormSelect
                value={roleFilter}
                onChange={setRoleFilter}
                placeholder="Todos los roles"
                options={roleOptions}
              />
              <FormSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Todos los estados"
                options={STATUS_OPTIONS}
              />
            </div>
          }
        />

        {error && (
          <p className="users-readonly-hint users-error-hint">
            <i className="fa-solid fa-triangle-exclamation" /> {error}
            <button type="button" className="users-retry" onClick={reload}>
              Reintentar
            </button>
          </p>
        )}

        {!canManage && (
          <p className="users-readonly-hint">
            <i className="fa-solid fa-circle-info" /> Tu rol solo puede consultar el
            listado de usuarios.
          </p>
        )}
      </div>

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingUser}
        submitting={submitting}
        roleOptions={roleOptions}
      />

      <ConfirmModal
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
        variant="danger"
        title="¿Eliminar este usuario?"
        description={
          confirmTarget
            ? `${confirmTarget.fullName} (${roleLabel(
                confirmTarget.role,
                roleOptions
              )}) perderá su acceso al sistema de inmediato. Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Sí, eliminar"
      />

      {/* Notificación flotante de éxito */}
      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        message={notification?.message}
        variant={notification?.variant}
      />
    </>
  );
}