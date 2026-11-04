// src/features/admin/users/components/UserFormModal.jsx
import { useEffect, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import FormSelect from "../../../../shared/components/FormSelect";
import StatusToggle from "../../../../shared/components/StatusToggle";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import { FALLBACK_ROLE_OPTIONS } from "../utils/roles";
import {
  validateDocType,
  validateIdNumber,
  validateNombres,
  validateApellidos,
  validateEmail,
  validateAddress,
  validatePhone,
  validateRole,
} from "../utils/validators";
import { DOC_TYPE_OPTIONS } from "../../../../shared/utils/documentTypes";
import "./UserFormModal.css";

const EMPTY_FORM = {
  docType: "",
  idNumber: "",
  nombres: "",
  apellidos: "",
  email: "",
  phone: "",
  address: "",
  role: "cliente",
  active: true,
};

/**
 * Un solo modal para Crear Y Editar usuario con soporte para teléfono,
 * dirección y rol. La contraseña no se edita desde el panel.
 */
export default function UserFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  submitting,
  roleOptions = FALLBACK_ROLE_OPTIONS,
}) {
  const isEdit = !!initialData;
  const [formError, setFormError] = useState("");

  const {
    values: form,
    errors,
    setField,
    handleBlur,
    setFieldError,
    validateAll,
    reset,
  } = useFormValidation({
    initialValues: EMPTY_FORM,
    validators: {
      docType: (v) => validateDocType(v.docType),
      idNumber: (v) => validateIdNumber(v.idNumber),
      nombres: (v) => validateNombres(v.nombres),
      apellidos: (v) => validateApellidos(v.apellidos),
      email: (v) => validateEmail(v.email),
      phone: (v) => validatePhone(v.phone),
      address: (v) => validateAddress(v.address),
      role: (v) => validateRole(v.role),
    },
    immediate: ["docType", "role"],
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      // Para usuarios antiguos (solo fullName) derivamos nombres/apellidos.
      const [derivedNombres, ...rest] = (initialData.fullName || "").trim().split(/\s+/);
      reset({
        docType: initialData.docType || "",
        idNumber: initialData.idNumber || "",
        nombres: initialData.nombres || derivedNombres || "",
        apellidos: initialData.apellidos || rest.join(" "),
        email: initialData.email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        role: initialData.role || "",
        active: initialData.active !== false,
      });
    } else {
      reset(EMPTY_FORM);
    }
  }, [open, initialData]);

  function handleClose() {
    setFormError("");
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!validateAll()) return;

    const nombres = form.nombres.trim();
    const apellidos = form.apellidos.trim();

    try {
      await onSubmit({
        docType: form.docType,
        idNumber: form.idNumber.trim(),
        nombres,
        apellidos,
        fullName: `${nombres} ${apellidos}`.trim(),
        email: form.email,
        phone: form.phone,
        address: form.address,
        role: form.role,
        active: form.active,
      });
      setFormError("");
    } catch (err) {
      if (err.code === "EMAIL_TAKEN") {
        setFieldError("email", err.message);
      } else if (err.code === "DOCUMENT_TAKEN") {
        setFieldError("idNumber", err.message);
      } else {
        setFormError(err.message || "No fue posible guardar el usuario.");
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar usuario" : "Crear Nuevo Usuario"}
      subtitle={
        isEdit
          ? "Actualiza la información y permisos del colaborador."
          : "Completa los datos. Enviaremos un correo para que establezca su contraseña."
      }
      maxWidth="sm"
      footer={
        <>
          <button type="button" className="btn-cancel" onClick={handleClose}>
            Cancelar
          </button>
          <button
            type="submit"
            form="user-form"
            className="btn-save"
            disabled={submitting}
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate>
        {formError && <div className="user-form-error">{formError}</div>}

        <div className="user-form-row user-form-row--fields">
          <FormSelect
            label="Tipo de documento"
            required
            value={form.docType}
            onChange={(v) => setField("docType", v)}
            onBlur={() => handleBlur("docType")}
            options={DOC_TYPE_OPTIONS}
            placeholder="Selecciona el tipo"
            error={errors.docType}
          />
          <FormTextField
            label="Número de documento"
            required
            placeholder="Ej. 1023456789"
            value={form.idNumber}
            onChange={(v) => setField("idNumber", v)}
            onBlur={() => handleBlur("idNumber")}
            error={errors.idNumber}
          />
        </div>

        <div className="user-form-row user-form-row--fields">
          <FormTextField
            label="Nombres"
            required
            placeholder="Ej. Juan"
            value={form.nombres}
            onChange={(v) => setField("nombres", v)}
            onBlur={() => handleBlur("nombres")}
            error={errors.nombres}
          />
          <FormTextField
            label="Apellidos"
            required
            placeholder="Ej. Pérez"
            value={form.apellidos}
            onChange={(v) => setField("apellidos", v)}
            onBlur={() => handleBlur("apellidos")}
            error={errors.apellidos}
          />
        </div>

        <FormTextField
          label="Correo electrónico"
          required
          placeholder="usuario@chocoberry.com"
          value={form.email}
          onChange={(v) => setField("email", v)}
          onBlur={() => handleBlur("email")}
          error={errors.email}
        />

        <FormTextField
          label="Teléfono"
          placeholder="Ej. 3001234567"
          value={form.phone}
          onChange={(v) => setField("phone", v)}
          onBlur={() => handleBlur("phone")}
          error={errors.phone}
        />

        <FormTextField
          label="Dirección"
          required
          placeholder="Ej. Calle 50 # 45-20"
          value={form.address}
          onChange={(v) => setField("address", v)}
          onBlur={() => handleBlur("address")}
          error={errors.address}
        />

        <div className="user-form-row">
          <FormSelect
            label="Rol"
            required
            value={form.role}
            onChange={(v) => setField("role", v)}
            onBlur={() => handleBlur("role")}
            options={roleOptions}
            placeholder="Selecciona un rol"
            error={errors.role}
          />
          {!isEdit && (
            <div className="user-form-status">
              <span className="form-label">Estado del usuario</span>
              <div className="user-form-status-row">
                <StatusToggle checked={form.active} onChange={(v) => setField("active", v)} />
                <span className={`user-form-status-label ${form.active ? "is-active" : ""}`}>
                  {form.active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}