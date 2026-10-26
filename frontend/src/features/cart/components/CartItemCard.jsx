// src/features/cart/components/CartItemCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton, OutlinedInput, Button } from "@mui/material";
import { formatPrice } from "../../../shared/utils/formatPrice";
import { normalizarCantidad } from "../../../shared/utils/orderRules";
import "./CartItemCard.css";

/**
 * Una línea del carrito: una configuración específica (producto + cantidad
 * de fresas + color de glaseado + personalización), con su propio contador
 * de unidades. El mensaje de tarjeta NO va aquí: es uno solo por pedido
 * completo (ver OrderCardMessage en CartPage).
 *
 * @param {object} props
 * @param {object} props.item - { cartItemId, productId, name, image, quantity, presentationId, unitPrice, colorId, color, colorHex, units, decorativeMessage, extraCustomization }
 * @param {(cartItemId: string, units: number) => void} props.onUnitsChange
 * @param {(cartItemId: string, field: string, value: string) => void} props.onFieldChange
 * @param {(cartItemId: string) => void} props.onRemove
 * @param {boolean} [props.canIncrease] - false cuando el carrito ya suma 20
 */
export default function CartItemCard({
  item,
  onUnitsChange,
  onFieldChange,
  onRemove,
  canIncrease = true,
}) {
  const navigate = useNavigate();
  const {
    cartItemId,
    productId,
    name,
    image,
    quantity,
    color,
    colorHex,
    units,
    decorativeMessage,
    extraCustomization,
  } = item;

  const unitPrice = Number(item.unitPrice ?? 0);
  const lineTotal = unitPrice * units;
  const maxDecorative = Math.min(Number(quantity) || 0, 255);

  // Borrador del input: permite escribir libremente (incluso vacío o > 20)
  // y normaliza al salir del campo. Se sincroniza si la cantidad cambia
  // desde los botones del stepper.
  const [draftUnits, setDraftUnits] = useState(String(units));
  const [lastUnits, setLastUnits] = useState(units);

  // Si la cantidad cambia desde los botones, se refleja en el input. Se ajusta
  // durante el render (patrón de React) para no encadenar efectos.
  if (units !== lastUnits) {
    setLastUnits(units);
    setDraftUnits(String(units));
  }

  const commitUnits = () => {
    const next = normalizarCantidad(draftUnits);
    setDraftUnits(String(next));
    if (next !== units) onUnitsChange(cartItemId, next);
  };

  const handleUnitsKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  };

  return (
    <div className="cart-item-card">
      <div className="cart-item-image">
        {image ? <img src={image} alt={name} /> : <i className="fa-solid fa-image" />}
      </div>

      <div className="cart-item-body">
        <div className="cart-item-top">
          <div>
            <div className="cart-item-name">{name}</div>
            <div className="cart-item-meta">
              <span>{quantity} fresas</span>
              <span className="cart-item-color">
                <span className="color-dot" style={{ backgroundColor: colorHex }} />
                {color}
              </span>
            </div>
          </div>

          <IconButton
            className="cart-item-remove"
            title="Eliminar"
            disableRipple
            onClick={() => onRemove(cartItemId)}
          >
            <i className="fa-solid fa-trash" />
          </IconButton>
        </div>

        <div className="cart-item-fields">
          <div>
            <OutlinedInput
              className="cart-item-input"
              placeholder="Mensaje decorativo (chocolate)"
              value={decorativeMessage}
              inputProps={{ maxLength: maxDecorative }}
              onChange={(e) => onFieldChange(cartItemId, "decorativeMessage", e.target.value)}
            />
            <div className="cart-field-hint">
              Máximo {maxDecorative} caracteres (una letra por fresa de esta caja).
            </div>
          </div>

          <div>
            <div className="cart-field-label">Personalización extra</div>
            <OutlinedInput
              className="cart-item-input"
              placeholder="Ej: quitar decoraciones de mariposa"
              multiline
              minRows={2}
              inputProps={{ maxLength: 255 }}
              value={extraCustomization}
              onChange={(e) => onFieldChange(cartItemId, "extraCustomization", e.target.value)}
            />
          </div>
        </div>

        <div className="cart-item-bottom">
          <div className="cart-item-bottom-left">
            <div className="cart-item-stepper">
              <IconButton
                disableRipple
                disabled={units <= 1}
                aria-label="Disminuir cantidad"
                onClick={() => onUnitsChange(cartItemId, Math.max(1, units - 1))}
              >
                <i className="fa-solid fa-minus" />
              </IconButton>
              <input
                className="cart-item-units-input"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                aria-label={`Cantidad de ${name}`}
                value={draftUnits}
                onChange={(event) => setDraftUnits(event.target.value)}
                onBlur={commitUnits}
                onKeyDown={handleUnitsKeyDown}
              />
              <IconButton
                disableRipple
                disabled={!canIncrease}
                aria-label="Aumentar cantidad"
                onClick={() => onUnitsChange(cartItemId, units + 1)}
              >
                <i className="fa-solid fa-plus" />
              </IconButton>
            </div>

            <Button
              className="btn-add-another"
              variant="text"
              disableRipple
              onClick={() => navigate(`/productos/${productId}`)}
            >
              Agregar otro
            </Button>
          </div>

          <div className="cart-item-prices">
            <span className="cart-item-unit-price">{formatPrice(unitPrice)} c/u</span>
            <span className="cart-item-price">{formatPrice(lineTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}