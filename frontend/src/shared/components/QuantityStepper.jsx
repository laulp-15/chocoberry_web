// src/shared/components/QuantityStepper.jsx
import { useState } from "react";
import { IconButton } from "@mui/material";
import { normalizarCantidad } from "../utils/orderRules";
import "./QuantityStepper.css";

/**
 * Stepper de cantidad reutilizable (carrito y detalle de producto).
 * Permite escribir libremente en el input y normaliza al salir del campo.
 *
 * @param {object} props
 * @param {number} props.value - Valor actual.
 * @param {(value: number) => void} props.onChange - Recibe el valor normalizado.
 * @param {number} [props.min] - Mínimo permitido (por defecto 1).
 * @param {number} [props.max] - Máximo permitido; si se omite no se recorta.
 * @param {boolean} [props.canIncrease] - Controla el botón de aumentar.
 * @param {boolean} [props.disabled] - Deshabilita todo el stepper.
 * @param {string} [props.ariaLabel] - Etiqueta accesible del input.
 */
export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  canIncrease = true,
  disabled = false,
  ariaLabel = "Cantidad",
}) {
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);

  // Si la cantidad cambia desde los botones, se refleja en el input. Se ajusta
  // durante el render (patrón de React) para no encadenar efectos.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const commit = () => {
    let next = normalizarCantidad(draft);
    if (max != null) next = Math.min(next, max);
    if (min != null) next = Math.max(next, min);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const handleKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  };

  const decreaseDisabled = disabled || value <= min;
  const increaseDisabled =
    disabled || !canIncrease || (max != null && value >= max);

  return (
    <div className={`quantity-stepper${disabled ? " is-disabled" : ""}`}>
      <IconButton
        disableRipple
        disabled={decreaseDisabled}
        aria-label="Disminuir cantidad"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <i className="fa-solid fa-minus" />
      </IconButton>
      <input
        className="quantity-stepper-input"
        type="number"
        min={min}
        max={max}
        step="1"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
      />
      <IconButton
        disableRipple
        disabled={increaseDisabled}
        aria-label="Aumentar cantidad"
        onClick={() => onChange(value + 1)}
      >
        <i className="fa-solid fa-plus" />
      </IconButton>
    </div>
  );
}
