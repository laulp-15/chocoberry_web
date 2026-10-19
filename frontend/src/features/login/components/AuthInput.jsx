
// src/features/login/components/AuthInput.jsx

import React, { useId, useState } from "react";
import {
  OutlinedInput,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
} from "@mui/material";

import "./AuthInput.css";

/**
 * Campo reutilizable para las vistas de autenticación.
 *
 * Características:
 * - Label accesible.
 * - Ícono inicial.
 * - Mostrar / ocultar contraseña.
 * - Estado de error.
 * - Texto de ayuda.
 * - Estados disabled y required.
 * - Soporte para onBlur / onFocus.
 * - Atributos ARIA para accesibilidad.
 * - Variante select: si se pasa `options`, el campo se renderiza como
 *   lista desplegable (mismo look que los campos de texto).
 */
export default function AuthInput({
  label,
  name,
  type = "text",
  icon,
  value = "",
  onChange,
  onBlur,
  onFocus,
  error,
  placeholder,
  required = false,
  autoComplete,
  hint,
  disabled = false,
  options,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  const isSelect = Array.isArray(options) && options.length > 0;

  const resolvedType = isPassword
    ? showPassword
      ? "text"
      : "password"
    : type;

  /**
   * useId evita posibles colisiones si el componente
   * aparece varias veces en la misma página.
   */
  const reactId = useId();

  const inputId = `auth-field-${name}-${reactId.replace(/:/g, "")}`;

  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const describedBy = error
    ? errorId
    : hint
      ? hintId
      : undefined;

  function handleChange(event) {
    onChange?.(event.target.value);
  }

  function togglePasswordVisibility() {
    setShowPassword((current) => !current);
  }

  const fieldClassName = `auth-field-input ${
    error ? "auth-field-input--error" : ""
  }`;

  const inputAdornment = icon ? (
    <InputAdornment position="start">
      <i
        className={`fa-solid fa-${icon}`}
        aria-hidden="true"
      />
    </InputAdornment>
  ) : null;

  // Props compartidos por las dos variantes (texto y select). En el select
  // se pasan al propio <Select>, que clona el OutlinedInput de abajo.
  const commonProps = {
    id: inputId,
    name,
    className: fieldClassName,
    fullWidth: true,
    value,
    onChange: handleChange,
    onBlur,
    onFocus,
    autoComplete,
    required,
    disabled,
    error: Boolean(error),
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
  };

  return (
    <div className="auth-field">
      {label && (
        <label
          htmlFor={inputId}
          className="auth-field-label"
        >
          {label}

          {required && (
            <span
              className="auth-field-required"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      {isSelect ? (
        <Select
          {...commonProps}
          displayEmpty
          startAdornment={inputAdornment}
          input={<OutlinedInput inputProps={{ "data-field": name }} />}
        >
          <MenuItem value="">
            <span className="auth-select-placeholder">{placeholder}</span>
          </MenuItem>

          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <OutlinedInput
          {...commonProps}
          type={resolvedType}
          placeholder={placeholder}
          inputProps={{
            "data-field": name,
          }}
          startAdornment={inputAdornment}
          endAdornment={
            isPassword ? (
              <InputAdornment position="end">
                <IconButton
                  type="button"
                  onClick={togglePasswordVisibility}
                  edge="end"
                  disableRipple
                  disabled={disabled}
                  className="auth-password-toggle"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                >
                  <i
                    className={`fa-solid ${
                      showPassword
                        ? "fa-eye-slash"
                        : "fa-eye"
                    }`}
                    aria-hidden="true"
                  />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        />
      )}

      {error ? (
        <span
          id={errorId}
          className="auth-field-error"
          role="alert"
        >
          <i
            className="fa-solid fa-circle-exclamation"
            aria-hidden="true"
          />

          <span>{error}</span>
        </span>
      ) : (
        hint && (
          <span
            id={hintId}
            className="auth-field-hint"
          >
            {hint}
          </span>
        )
      )}
    </div>
  );
}
