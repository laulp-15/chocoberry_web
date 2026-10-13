// src/features/admin/orders/components/OrderProductLineForm.jsx
import React, { useState } from "react";
import FormSelect from "../../../../shared/components/FormSelect";
import FormAutocomplete from "../../../../shared/components/FormAutocomplete";
import FormTextField from "../../../../shared/components/FormTextField";
import { PRODUCTS } from "../../../catalog/data/Products";
import { PRICE_BY_QUANTITY, getPriceByQuantity } from "../../../catalog/data/Pricing";
import { COLOR_OPTIONS } from "../../../catalog/data/Colors";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "./OrderProductLineForm.css";

const QUANTITY_OPTIONS = Object.keys(PRICE_BY_QUANTITY).map((q) => ({ value: q, label: `${q} fresas` }));
const PRODUCT_OPTIONS = PRODUCTS.map((p) => ({ value: p.id, label: p.name }));
const COLOR_SELECT_OPTIONS = COLOR_OPTIONS.map((c) => ({ value: c.value, label: c.label }));

const EMPTY_LINE = {
  productId: "",
  quantity: "",
  color: "",
  decorativeMessage: "",
  extraCustomization: "",
  units: "1",
};

/**
 * Formulario para configurar UN producto y agregarlo a la lista del pedido.
 * No mantiene la lista en sí — solo emite `onAdd(line)` con la línea armada.
 *
 * @param {object} props
 * @param {(line: object) => void} props.onAdd
 */
export default function OrderProductLineForm({ onAdd }) {
  const [line, setLine] = useState(EMPTY_LINE);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setLine((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const unitPrice = line.quantity ? getPriceByQuantity(Number(line.quantity)) : 0;

  const canAdd = line.productId && line.quantity && line.color && Number(line.units) > 0;

  const handleAdd = () => {
    const newErrors = {};
    if (!line.productId) newErrors.productId = "El producto es obligatorio.";
    if (!line.quantity) newErrors.quantity = "La cantidad de fresas es obligatoria.";
    if (!line.color) newErrors.color = "El color de glaseado es obligatorio.";
    if (!line.units || Number(line.units) <= 0) newErrors.units = "La cantidad es obligatoria.";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    // Buscar producto por nombre (FormAutocomplete guarda el label/nombre)
    const product = PRODUCTS.find((p) => p.name === line.productId);
    const color = COLOR_OPTIONS.find((c) => c.value === line.color);

    onAdd({
      lineId: `${line.productId}-${Date.now()}`,
      productId: line.productId,
      productName: product?.name ?? "",
      quantity: Number(line.quantity),
      color: color?.label ?? "",
      colorHex: color?.hex,
      decorativeMessage: line.decorativeMessage,
      extraCustomization: line.extraCustomization,
      units: Number(line.units),
      unitPrice,
    });

    setLine(EMPTY_LINE);
    setErrors({});
  };

  return (
    <div className="order-line-form">
      <div className="order-line-form-grid">
        <FormAutocomplete
          label="Producto"
          required
          value={line.productId}
          onChange={(v) => { update("productId", v); setErrors(prev => ({ ...prev, productId: undefined })); }}
          options={PRODUCT_OPTIONS.map(o => o.label)}
          placeholder="Buscar producto"
          error={errors.productId}
        />
        <FormSelect
          label="Cantidad de fresas"
          required
          value={line.quantity}
          onChange={(v) => { update("quantity", v); setErrors(prev => ({ ...prev, quantity: undefined })); }}
          options={QUANTITY_OPTIONS}
          placeholder="Cantidad"
          error={errors.quantity}
        />
        <FormSelect
          label="Color de glaseado"
          required
          value={line.color}
          onChange={(v) => { update("color", v); setErrors(prev => ({ ...prev, color: undefined })); }}
          options={COLOR_SELECT_OPTIONS}
          placeholder="Color"
          error={errors.color}
        />
        <FormTextField
          label="Cantidad de este producto"
          type="number"
          required
          value={line.units}
          onChange={(v) => { update("units", v); setErrors(prev => ({ ...prev, units: undefined })); }}
          error={errors.units}
        />
      </div>

      <FormTextField
        label="Mensaje decorativo (chocolate)"
        value={line.decorativeMessage}
        onChange={(v) => update("decorativeMessage", v)}
        placeholder="Ej: TE AMO"
      />
      <FormTextField
        label="Personalización extra"
        value={line.extraCustomization}
        onChange={(v) => update("extraCustomization", v)}
        placeholder="Ej: quitar decoraciones de mariposa"
        multiline
        minRows={1}
      />

      <div className="order-line-form-footer">
        <span className="order-line-unit-price">
          {line.quantity ? `Precio unitario: ${formatPrice(unitPrice)}` : ""}
        </span>
        <button type="button" className="btn-add-line" disabled={!canAdd} onClick={handleAdd}>
          <i className="fa-solid fa-plus" />
          Agregar producto
        </button>
      </div>
    </div>
  );
}