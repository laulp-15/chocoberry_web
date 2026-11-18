// src/features/cart/components/CartItemCard.jsx
import { useNavigate } from "react-router-dom";
import { IconButton, OutlinedInput, Button } from "@mui/material";
import { formatPrice } from "../../../shared/utils/formatPrice";
import {
  MAX_MENSAJE_TARJETA,
  contarCaracteresSinEspacios,
} from "../../../shared/utils/orderRules";
import QuantityStepper from "../../../shared/components/QuantityStepper";
import "./CartItemCard.css";

/**
 * Una línea del carrito: una configuración específica (producto + cantidad
 * de fresas + color de glaseado + personalización), con su propio contador
 * de unidades y sus propios mensajes.
 *
 * @param {object} props
 * @param {object} props.item - { cartItemId, productId, name, image, quantity, presentationId, unitPrice, colorId, color, colorHex, units, letrasFresas, mensajeTarjeta }
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
    letrasFresas,
    mensajeTarjeta,
  } = item;

  const unitPrice = Number(item.unitPrice ?? 0);
  const lineTotal = unitPrice * units;
  const maxLetras = Math.min(Number(quantity) || 0, 255);

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
            <div className="cart-field-label">Letras personalizadas para tus fresas</div>
            <OutlinedInput
              className="cart-item-input"
              placeholder="Ej: TE AMO"
              value={letrasFresas ?? ""}
              onChange={(e) => {
                const next = e.target.value;
                if (contarCaracteresSinEspacios(next) <= maxLetras) {
                  onFieldChange(cartItemId, "letrasFresas", next);
                }
              }}
            />
            <div className="cart-field-hint">
              Máximo {maxLetras} caracteres sin contar espacios (una letra por fresa de esta caja).
            </div>
          </div>

          <div>
            <div className="cart-field-label">Mensaje para tu tarjeta</div>
            <OutlinedInput
              className="cart-item-input"
              placeholder="Ej: Feliz cumpleaños"
              multiline
              minRows={1}
              value={mensajeTarjeta ?? ""}
              onChange={(e) => {
                const next = e.target.value;
                if (contarCaracteresSinEspacios(next) <= MAX_MENSAJE_TARJETA) {
                  onFieldChange(cartItemId, "mensajeTarjeta", next);
                }
              }}
            />
            <div className="cart-field-hint">
              Máximo {MAX_MENSAJE_TARJETA} caracteres.
            </div>
          </div>
        </div>

        <div className="cart-item-bottom">
          <div className="cart-item-bottom-left">
            <QuantityStepper
              value={units}
              onChange={(next) => onUnitsChange(cartItemId, next)}
              canIncrease={canIncrease}
              ariaLabel={`Cantidad de ${name}`}
            />

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