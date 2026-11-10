// src/features/login/pages/ResetPasswordPage.jsx

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import PasswordStrengthChecklist from "../components/PasswordStrengthChecklist";
import Navbar from "../../../shared/components/Navbar";

import { useAuth } from "../hooks/useAuth";
import {
  validateConfirmPassword,
  validatePassword,
} from "../utils/validators";

/**
 * Establece una contraseña a partir del enlace enviado por correo.
 * El mismo formulario atiende recuperación y activación de cuenta; el tipo
 * lo determina el backend a partir del token.
 */
export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const isActivation = location.pathname.startsWith("/establecer-contrasena");

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  useEffect(() => {
    if (!success) return undefined;

    const timer = setTimeout(() => navigate("/login"), 1800);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
  }

  function validateField(field, values = form) {
    if (field === "password") return validatePassword(values.password);
    if (field === "confirmPassword") {
      return validateConfirmPassword(values.password, values.confirmPassword);
    }
    return "";
  }

  function handleBlur(field) {
    setErrors((prev) => ({ ...prev, [field]: validateField(field) }));
    if (field === "password") setPasswordFocused(false);
  }

  function validateAll() {
    const nextErrors = {
      password: validateField("password"),
      confirmPassword: validateField("confirmPassword"),
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((error) => !error);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || success) return;

    setServerError("");
    if (!token) {
      setServerError("El enlace no incluye un token válido.");
      return;
    }
    if (!validateAll()) return;

    setLoading(true);
    try {
      await resetPassword({ token, password: form.password });
      setSuccess(true);
      setForm({ password: "", confirmPassword: "" });
      setErrors({});
    } catch (error) {
      setServerError(
        error?.message ||
          "El enlace es inválido o ha expirado. Solicita uno nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  const title = isActivation
    ? "Establece tu contraseña"
    : "Restablece tu contraseña";

  const subtitle = isActivation
    ? "Tu cuenta ya fue creada. Crea una contraseña segura para empezar a usarla."
    : "Crea una nueva contraseña para volver a ingresar a tu cuenta.";

  if (!token) {
    return (
      <>
        <Navbar />
        <AuthLayout
          variant="centered"
          title="Enlace inválido"
          subtitle="Este enlace no incluye un token de seguridad."
          footer={
            <Link to="/login" className="auth-back-link">
              <i className="fa-solid fa-arrow-left-long" />
              Volver al inicio de sesión
            </Link>
          }
        >
          <div className="auth-panel-body">
            <div className="auth-banner auth-banner--error" role="alert">
              <i className="fa-solid fa-circle-exclamation" />
              <span>
                Solicita un enlace nuevo desde la página de recuperación.
              </span>
            </div>
            <Link
              to="/recuperar-contrasena"
              className="auth-submit-btn"
              style={{ textDecoration: "none" }}
            >
              <i className="fa-solid fa-envelope" />
              Solicitar nuevo enlace
            </Link>
          </div>
        </AuthLayout>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <AuthLayout
        variant="centered"
        title={title}
        subtitle={subtitle}
        footer={
          <Link to="/login" className="auth-back-link">
            <i className="fa-solid fa-arrow-left-long" />
            Volver al inicio de sesión
          </Link>
        }
      >
        <form
          className="auth-panel-body"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={loading}
        >
          {serverError && (
            <div
              className="auth-banner auth-banner--error"
              role="alert"
              aria-live="assertive"
            >
              <i className="fa-solid fa-circle-exclamation" />
              <span>{serverError}</span>
            </div>
          )}

          {success && (
            <div
              className="auth-banner auth-banner--success"
              role="status"
              aria-live="polite"
            >
              <i className="fa-solid fa-circle-check" />
              <span>
                Tu contraseña se guardó correctamente. Redirigiendo al inicio de
                sesión...
              </span>
            </div>
          )}

          <AuthInput
            label={isActivation ? "Contraseña" : "Nueva contraseña"}
            name="password"
            type="password"
            icon="lock"
            value={form.password}
            onChange={(value) => setField("password", value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => handleBlur("password")}
            error={errors.password}
            autoComplete="new-password"
            disabled={loading || success}
            required
          />

          {(passwordFocused || form.password) && (
            <PasswordStrengthChecklist password={form.password} />
          )}

          <AuthInput
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            icon="lock"
            value={form.confirmPassword}
            onChange={(value) => setField("confirmPassword", value)}
            onBlur={() => handleBlur("confirmPassword")}
            error={errors.confirmPassword}
            autoComplete="new-password"
            disabled={loading || success}
            required
          />

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Guardando...
              </>
            ) : success ? (
              <>
                <i className="fa-solid fa-check" />
                Contraseña guardada
              </>
            ) : (
              <>
                <i className="fa-solid fa-key" />
                {isActivation ? "Establecer contraseña" : "Restablecer contraseña"}
              </>
            )}
          </button>
        </form>
      </AuthLayout>
    </>
  );
}
