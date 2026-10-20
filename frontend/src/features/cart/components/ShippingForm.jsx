// src/features/cart/components/ShippingForm.jsx
import { OutlinedInput, Select, MenuItem } from "@mui/material";
import DatePicker, { addDaysISO } from "../../../shared/components/DatePicker";
import { PICKUP_SCHEDULE } from "../data/pickupInfo";
import { formatPrice } from "../../../shared/utils/formatPrice";
import "./ShippingForm.css";

// La entrega no puede ser para hoy: mínimo el día siguiente (mañana) y
// máximo 15 días a futuro.
const MIN_DELIVERY_DATE = addDaysISO(1);
const MAX_DELIVERY_DATE = addDaysISO(15);

/**
 * @param {object} props
 * @param {object} props.values - { fullName, deliveryDate, address, municipio, instructions }
 * @param {(field: string, value: string) => void} props.onChange
 * @param {(field: string) => void} [props.onBlurField] - marca un campo como tocado
 * @param {string} [props.fullNameError]
 * @param {string} [props.deliveryDateError]
 * @param {string} [props.municipioError]
 * @param {string} [props.addressError]
 * @param {string} [props.neighborhoodError]
 * @param {string} [props.recipientNameError]
 * @param {string} [props.recipientPhoneError]
 */
export default function ShippingForm({
  values,
  onChange,
  onBlurField,
  municipios = [],
  municipiosLoading = false,
  fullNameError,
  deliveryDateError,
  municipioError,
  addressError,
  neighborhoodError,
  recipientNameError,
  recipientPhoneError,
}) {
  const {
    fullName,
    address,
    neighborhood,
    municipio,
    recipientName,
    recipientPhone,
    instructions,
    deliveryDate,
  } = values;

  return (
    <div className="checkout-section">
      <div className="checkout-section-title">
        <i className="fa-solid fa-truck-fast" />
        Detalles de Envío
      </div>

      <div className="form-field">
        <label className="form-label">Nombre completo *</label>
        <OutlinedInput
          className={`form-input ${fullNameError ? "has-error" : ""}`}
          fullWidth
          placeholder="Ej. Mariana Valenzuela"
          value={fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
          onBlur={() => onBlurField?.("fullName")}
        />
        {fullNameError && <div className="form-error">{fullNameError}</div>}
      </div>

      <DatePicker
        label="Fecha de entrega"
        required
        value={deliveryDate}
        onChange={(v) => onChange("deliveryDate", v)}
        minDate={MIN_DELIVERY_DATE}
        maxDate={MAX_DELIVERY_DATE}
        error={deliveryDateError}
        hint="Disponible desde mañana y hasta 15 días a futuro."
      />

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Dirección *</label>
          <OutlinedInput
            className={`form-input ${addressError ? "has-error" : ""}`}
            fullWidth
            placeholder="Ej. Calle 10 # 43 - 21, Torre 2 Apto 402"
            value={address}
            onChange={(e) => onChange("address", e.target.value)}
            onBlur={() => onBlurField?.("address")}
          />
          {addressError && <div className="form-error">{addressError}</div>}
        </div>

        <div className="form-field">
          <label className="form-label">Barrio *</label>
          <OutlinedInput
            className={`form-input ${neighborhoodError ? "has-error" : ""}`}
            fullWidth
            placeholder="Ej. El Poblado"
            value={neighborhood}
            onChange={(e) => onChange("neighborhood", e.target.value)}
            onBlur={() => onBlurField?.("neighborhood")}
          />
          {neighborhoodError && <div className="form-error">{neighborhoodError}</div>}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Municipio de entrega *</label>
        <Select
          className={`form-input form-select ${municipioError ? "has-error" : ""}`}
          fullWidth
          displayEmpty
          value={municipio}
          disabled={municipiosLoading}
          onChange={(e) => onChange("municipio", e.target.value)}
        >
          <MenuItem value="">
            <span className="form-select-placeholder">
              {municipiosLoading ? "Cargando municipios..." : "Selecciona un municipio"}
            </span>
          </MenuItem>
          {municipios.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.nombre} — {formatPrice(m.precioDomicilio)}
            </MenuItem>
          ))}
        </Select>
        {municipioError && <div className="form-error">{municipioError}</div>}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Quién recibe la entrega *</label>
          <OutlinedInput
            className={`form-input ${recipientNameError ? "has-error" : ""}`}
            fullWidth
            placeholder="Ej. Mariana Valenzuela"
            value={recipientName}
            onChange={(e) => onChange("recipientName", e.target.value)}
            onBlur={() => onBlurField?.("recipientName")}
          />
          {recipientNameError && <div className="form-error">{recipientNameError}</div>}
        </div>

        <div className="form-field">
          <label className="form-label">Teléfono *</label>
          <OutlinedInput
            className={`form-input ${recipientPhoneError ? "has-error" : ""}`}
            fullWidth
            placeholder="Ej. 300 123 4567"
            value={recipientPhone}
            onChange={(e) => onChange("recipientPhone", e.target.value)}
            onBlur={() => onBlurField?.("recipientPhone")}
          />
          {recipientPhoneError && <div className="form-error">{recipientPhoneError}</div>}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Instrucciones de entrega</label>
        <OutlinedInput
          className="form-input"
          fullWidth
          multiline
          minRows={3}
          placeholder="Instrucciones especiales para el repartidor o detalles del regalo..."
          value={instructions}
          onChange={(e) => onChange("instructions", e.target.value)}
        />
      </div>

      <div className="delivery-hours-hint">
        <i className="fa-solid fa-clock" />
        Puedes esperar tu pedido el día de entrega escogido en estos horarios: <strong>{PICKUP_SCHEDULE}</strong>
      </div>
    </div>
  );
}