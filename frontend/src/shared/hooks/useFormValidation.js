// src/shared/hooks/useFormValidation.js
import { useRef, useState } from "react";

/**
 * Maneja valores, errores y campos "tocados" de un formulario con
 * validación en vivo.
 *
 * Política: un campo de texto empieza a mostrar su error después de que el
 * usuario sale de él (o intenta guardar) y, desde ese momento, se recalcula
 * en cada tecla. Los campos discretos (select, fecha, archivo) se declaran
 * en `immediate` y se validan apenas cambian, porque no existe un
 * "mientras escribe".
 *
 * No usa useMemo/useCallback: React Compiler está activo en el proyecto.
 *
 * @param {object} options
 * @param {object} options.initialValues - valores iniciales del formulario.
 * @param {Record<string, (values: object) => string>} options.validators
 *        Un validador por campo; devuelve "" cuando el valor es válido.
 * @param {Record<string, string[]>} [options.dependents]
 *        Campos que dependen de otro (ej. { password: ["confirmPassword"] }).
 * @param {string[]} [options.immediate]
 *        Campos que se validan al cambiar sin esperar el blur.
 */
export default function useFormValidation({
  initialValues,
  validators,
  dependents = {},
  immediate = [],
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Los valores más recientes, siempre disponibles aunque varios `setField`
  // ocurran en el mismo ciclo (ej. precargar varios campos del perfil).
  // Se actualiza solo en setMany/reset, los únicos puntos que cambian valores.
  const valuesRef = useRef(initialValues);

  function errorFor(field, vals) {
    const validate = validators[field];
    return validate ? validate(vals) || "" : "";
  }

  /** Aplica varios campos a la vez y recalcula los errores que correspondan. */
  function setMany(partial) {
    const next = { ...valuesRef.current, ...partial };
    valuesRef.current = next;
    setValues(next);

    const affected = new Set();
    Object.keys(partial).forEach((field) => {
      if (touched[field] || immediate.includes(field)) affected.add(field);
      (dependents[field] || []).forEach((dep) => {
        if (touched[dep] || immediate.includes(dep)) affected.add(dep);
      });
    });

    if (affected.size === 0) return;

    setErrors((prev) => {
      const updated = { ...prev };
      affected.forEach((field) => {
        updated[field] = errorFor(field, next);
      });
      return updated;
    });
  }

  /** Actualiza un campo y, si corresponde, recalcula su error en vivo. */
  function setField(field, value) {
    setMany({ [field]: value });
  }

  /** Valida un campo cuando el usuario sale de él (primer blur). */
  function handleBlur(field) {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: errorFor(field, valuesRef.current) }));
  }

  /**
   * Valida todos los campos, los marca como tocados y devuelve si el
   * formulario es válido. Se usa al enviar.
   */
  function validateAll() {
    const nextErrors = {};
    const nextTouched = {};
    Object.keys(validators).forEach((field) => {
      nextErrors[field] = errorFor(field, valuesRef.current);
      nextTouched[field] = true;
    });
    setErrors(nextErrors);
    setTouched(nextTouched);
    return Object.values(nextErrors).every((message) => !message);
  }

  /** Fija manualmente el error de un campo (ej. validación de un archivo). */
  function setFieldError(field, message) {
    setErrors((prev) => ({ ...prev, [field]: message || "" }));
  }

  /** Reinicia valores, errores y campos tocados. */
  function reset(nextValues = initialValues) {
    valuesRef.current = nextValues;
    setValues(nextValues);
    setErrors({});
    setTouched({});
  }

  return {
    values,
    errors,
    setField,
    setMany,
    handleBlur,
    setFieldError,
    validateAll,
    reset,
  };
}
