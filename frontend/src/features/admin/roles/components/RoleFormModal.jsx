// src/features/admin/roles/components/RoleFormModal.jsx
import { useEffect, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import PermissionsChecklist from "./PermissionsChecklist";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import { useRolesContext } from "../context/RolesContext";
import "../../../../shared/css/buttons.css";
import "./RoleFormModal.css";

const EMPTY_ROLE = { name: "", permissionIds: [] };

export default function RoleFormModal({ open, onClose, initialData, onSaved }) {
  const { activePermissions, createRole, updateRole } = useRolesContext();
  const isEditing = Boolean(initialData);

  const { values: role, errors, setField, handleBlur, validateAll, reset } = useFormValidation({
    initialValues: EMPTY_ROLE,
    validators: {
      name: (r) => {
        const nombre = r.name.trim();
        if (!nombre) return "El nombre del rol es obligatorio.";
        if (nombre.length < 3) {
          return "El nombre del rol debe tener al menos 3 caracteres.";
        }
        if (nombre.length > 50) {
          return "El nombre del rol no puede superar los 50 caracteres.";
        }
        return "";
      },
      permissionIds: (r) =>
        r.permissionIds.length > 0
          ? ""
          : "Debes asignar como mínimo un permiso.",
    },
    immediate: ["permissionIds"],
  });

  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    reset(
      initialData
        ? {
            name: initialData.name,
            permissionIds: initialData.permissionIds,
          }
        : EMPTY_ROLE
    );
  }, [open, initialData]);

  const update = (field, value) => setField(field, value);

  const handleClose = () => {
    setSaveError("");
    onClose();
  };

  const handleSave = async () => {
    if (!validateAll()) return;
    setSaving(true);
    setSaveError("");
    try {
      if (isEditing) {
        await updateRole(initialData.id, role);
        onSaved("Rol actualizado correctamente.");
      } else {
        await createRole(role);
        onSaved("Rol creado correctamente.");
      }
    } catch (err) {
      setSaveError(err.message || "No se pudo completar la operación.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar Rol" : "Crear Nuevo Rol"}
      maxWidth="md"
      footer={
        <>
          <button type="button" className="btn-cancel" onClick={handleClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      {!isEditing && (
        <p className="role-form-subtitle">
          Define y administra los niveles de acceso para tu equipo de ChocoBerry.
        </p>
      )}

      {saveError && (
        <div className="form-error" style={{ marginBottom: 14 }}>
          {saveError}
        </div>
      )}

      <FormTextField
        label="Nombre del Rol"
        required
        value={role.name}
        onChange={(v) => update("name", v)}
        onBlur={() => handleBlur("name")}
        placeholder="Ej. Gestor de inventario"
        error={errors.name}
      />

      <PermissionsChecklist
        permissions={activePermissions}
        selectedIds={role.permissionIds}
        onChange={(ids) => update("permissionIds", ids)}
        error={errors.permissionIds}
      />
    </Modal>
  );
}