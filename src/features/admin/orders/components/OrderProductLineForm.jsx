// src/features/admin/orders/components/OrderProductLineForm.jsx
import React from "react";
import FormSelect from "../../../../shared/components/FormSelect";
import FormAutocomplete from "../../../../shared/components/FormAutocomplete";
import FormTextField from "../../../../shared/components/FormTextField";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
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
  const { values: line, errors, setField, handleBlur, validateAll, reset } = useFormValidation({
    initialValues: EMPTY_LINE,
    validators: {
      productId: (l) => (l.productId ? "" : "El producto es obligatorio."),
      quantity: (l) => (l.quantity ? "" : "La cantidad de fresas es obligatoria."),
      color: (l) => (l.color ? "" : "El color de glaseado es obligatorio."),
      units: (l) => (l.units && Number(l.units) > 0 ? "" : "La cantidad es obligatoria."),
    },
    immediate: ["productId", "quantity", "color"],
  });

  const update = (field, value) => setField(field, value);

  const unitPrice = line.quantity ? getPriceByQuantity(Number(line.quantity)) : 0;

  const canAdd = line.productId && line.quantity && line.color && Number(line.units) > 0;

  const handleAdd = () => {
    if (!validateAll()) return;

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

    reset(EMPTY_LINE);
  };

  return (
    <div className="order-line-form">
      <div className="order-line-form-grid">
        <FormAutocomplete
          label="Producto"
          required
          value={line.productId}
          onChange={(v) => update("productId", v)}
          onBlur={() => handleBlur("productId")}
          options={PRODUCT_OPTIONS.map(o => o.label)}
          placeholder="Buscar producto"
          error={errors.productId}
        />
        <FormSelect
          label="Cantidad de fresas"
          required
          value={line.quantity}
          onChange={(v) => update("quantity", v)}
          onBlur={() => handleBlur("quantity")}
          options={QUANTITY_OPTIONS}
          placeholder="Cantidad"
          error={errors.quantity}
        />
        <FormSelect
          label="Color de glaseado"
          required
          value={line.color}
          onChange={(v) => update("color", v)}
          onBlur={() => handleBlur("color")}
          options={COLOR_SELECT_OPTIONS}
          placeholder="Color"
          error={errors.color}
        />
        <FormTextField
          label="Cantidad de este producto"
          type="number"
          required
          value={line.units}
          onChange={(v) => update("units", v)}
          onBlur={() => handleBlur("units")}
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