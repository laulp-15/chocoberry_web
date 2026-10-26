// src/features/admin/orders/components/OrderProductLineItem.jsx
import { IconButton } from "@mui/material";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "./OrderProductLineItem.css";

/**
 * @param {object} props
 * @param {object} props.line
 * @param {(line: object) => void} [props.onEdit]
 * @param {(lineId: string) => void} [props.onRemove]
 * @param {boolean} [props.active] La línea está cargada en el formulario.
 */
export default function OrderProductLineItem({
  line,
  onEdit,
  onRemove,
  active = false,
}) {
  const lineTotal = line.precioUnitario * line.unidades;

  return (
    <div className={`order-line-item${active ? " order-line-item--editing" : ""}`}>
      <div className="order-line-item-info">
        <div className="order-line-item-name">
          {line.productoNombre}{" "}
          <span className="order-line-item-units">x{line.unidades}</span>
        </div>
        <div className="order-line-item-meta">
          <span>{line.cantidadFresas} fresas</span>
          <span className="order-line-item-color">
            <span
              className="color-dot"
              style={{ backgroundColor: line.colorHex || "transparent" }}
            />
            {line.colorNombre || "—"}
          </span>
        </div>
        {(line.mensajePersonalizado || line.personalizacionAdicional) && (
          <div className="order-line-item-notes">
            {line.mensajePersonalizado && (
              <span>“{line.mensajePersonalizado}”</span>
            )}
            {line.personalizacionAdicional && (
              <span>{line.personalizacionAdicional}</span>
            )}
          </div>
        )}
      </div>
      <div className="order-line-item-price">{formatPrice(lineTotal)}</div>
      <div className="order-line-item-actions">
        {onEdit && (
          <IconButton
            className="order-line-item-edit"
            disableRipple
            aria-label="Editar producto"
            title="Editar producto"
            onClick={() => onEdit(line)}
          >
            <i className="fa-solid fa-pen" />
          </IconButton>
        )}
        {onRemove && (
          <IconButton
            className="order-line-item-remove"
            disableRipple
            aria-label="Eliminar producto"
            title="Eliminar producto"
            onClick={() => onRemove(line.lineId ?? line.id)}
          >
            <i className="fa-solid fa-trash" />
          </IconButton>
        )}
      </div>
    </div>
  );
}
