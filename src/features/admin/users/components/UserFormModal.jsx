// src/features/admin/users/components/UserFormModal.jsx
import React, { useEffect, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import FormSelect from "../../../../shared/components/FormSelect";
import StatusToggle from "../../../../shared/components/StatusToggle";
import { ROLE_OPTIONS } from "../utils/roles";
import {
  validateFullName,
  validateEmail,
  validateConfirmPassword,
  validateRole,
  validatePasswordForCreate,
  validatePasswordForEdit,
} from "../utils/validators";
import "./UserFormModal.css";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
  role: "",
  active: true,
};

/**
 * Un solo modal para Crear Y Editar usuario con soporte para teléfono,
 * dirección y visibilidad de contraseña.
 */
export default function UserFormModal({ open, onClose, onSubmit, initialData, submitting }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  // Estados para controlar la visibilidad de las contraseñas (el "ojito")
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      initialData
        ? {
            fullName: initialData.fullName || "",
            email: initialData.email || "",
            phone: initialData.phone || "",
            address: initialData.address || "",
            password: "",
            confirmPassword: "",
            role: initialData.role || "",
            active: initialData.active !== false,
          }
        : EMPTY_FORM
    );
    setErrors({});
    setFormError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [open, initialData]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validateAll() {
    const passwordError = isEdit
      ? validatePasswordForEdit(form.password)
      : validatePasswordForCreate(form.password);

    const next = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      password: passwordError,
      confirmPassword: form.password
        ? validateConfirmPassword(form.password, form.confirmPassword)
        : "",
      role: validateRole(form.role),
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validateAll()) return;

    try {
      await onSubmit({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        password: form.password,
        role: form.role,
        active: form.active,
      });
    } catch (err) {
      if (err.code === "EMAIL_TAKEN") {
        setErrors((p) => ({ ...p, email: err.message }));
      } else {
        setFormError(err.message || "No fue posible guardar el usuario.");
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar usuario" : "Crear Nuevo Usuario"}
      subtitle={
        isEdit
          ? "Actualiza la información y permisos del colaborador."
          : "Completa los datos para habilitar un nuevo perfil de acceso."
      }
      maxWidth="sm"
      footer={
        <>
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="user-form"
            className="btn-save"
            disabled={submitting}
          >
            <i className="fa-solid fa-floppy-disk" />
            {submitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar Usuario"}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="user-form-error">{formError}</div>}

        <FormTextField
          label="Nombre completo"
          icon="user"
          required
          placeholder="Ej. Juan Pérez"
          value={form.fullName}
          onChange={(v) => setField("fullName", v)}
          error={errors.fullName}
        />

        <FormTextField
          label="Correo electrónico"
          icon="envelope"
          required
          placeholder="usuario@chocoberry.com"
          value={form.email}
          onChange={(v) => setField("email", v)}
          error={errors.email}
        />

        <FormTextField
          label="Teléfono"
          icon="phone"
          placeholder="Ej. 3001234567"
          value={form.phone}
          onChange={(v) => setField("phone", v)}
        />

        <FormTextField
          label="Dirección"
          icon="location-dot"
          placeholder="Ej. Calle 50 # 45-20"
          value={form.address}
          onChange={(v) => setField("address", v)}
        />

        {/* Campo Contraseña con botón de ojito */}
        <div className="password-field-wrapper" style={{ position: "relative" }}>
          <FormTextField
            label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            icon="lock"
            type={showPassword ? "text" : "password"}
            required={!isEdit}
            placeholder={isEdit ? "Ingresa una nueva contraseña" : "••••••••"}
            value={form.password}
            onChange={(v) => setField("password", v)}
            error={errors.password}
            hint={
              !errors.password
                ? "Mínimo 8 caracteres, con mayúscula, número y carácter especial."
                : undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "38px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#666",
              fontSize: "16px",
            }}
            title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
          </button>
        </div>

        {/* Campo Confirmar Contraseña con botón de ojito */}
        {form.password && (
          <div className="password-field-wrapper" style={{ position: "relative" }}>
            <FormTextField
              label="Repetir contraseña"
              icon="lock"
              type={showConfirmPassword ? "text" : "password"}
              required
              placeholder="Repite la contraseña"
              value={form.confirmPassword}
              onChange={(v) => setField("confirmPassword", v)}
              error={errors.confirmPassword}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "38px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666",
                fontSize: "16px",
              }}
              title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
            >
              <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`} />
            </button>
          </div>
        )}

        <FormSelect
          label="Rol"
          required
          value={form.role}
          onChange={(v) => setField("role", v)}
          options={ROLE_OPTIONS}
          placeholder="Selecciona un rol"
          error={errors.role}
        />

        <div className="user-form-status">
          <span className="form-label">Estado del usuario</span>
          <div className="user-form-status-row">
            <StatusToggle checked={form.active} onChange={(v) => setField("active", v)} />
            <span className={`user-form-status-label ${form.active ? "is-active" : ""}`}>
              {form.active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
}