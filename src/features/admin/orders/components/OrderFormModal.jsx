// src/features/admin/orders/components/OrderFormModal.jsx
import React, { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import FormSelect from "../../../../shared/components/FormSelect";
import FormSearchableSelect from "../../../../shared/components/FormSearchableSelect";
import DatePicker, { todayISO } from "../../../../shared/components/DatePicker";
import FileDropzone from "../../../../shared/components/FileDropZone";
import OrderProductLineForm from "./OrderProductLineForm";
import OrderProductLineItem from "./OrderProductLineItem";
import { MOCK_CLIENTS } from "../data/mockClients";
import { ORDER_STATUSES } from "../data/orderStatus";
import { MUNICIPIOS, getShippingCost } from "../../../cart/data/Shipping";
import { PAYMENT_METHODS } from "../../../cart/data/PaymentMethods";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "./OrderFormModal.css";

// TODO: mientras no exista el módulo real de Clientes, el "value" es el
// mismo nombre. Cuando exista, esto se reemplaza por { value: id, label: nombre }.
const CLIENT_OPTIONS = MOCK_CLIENTS.map((name) => ({ value: name, label: name }));

const EMPTY_ORDER = {
  cliente: "",
  fecha: "",
  direccion: "",
  municipio: "",
  instrucciones: "",
  medioPago: "",
  comprobante: null,
  cardMessage: "",
  products: [],
  estado: "pendiente",
};

/**
 * Modal de Crear/Editar pedido en una sola vista continua.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} [props.initialData]
 * @param {(order: object) => void} props.onSave
 */
export default function OrderFormModal({ open, onClose, initialData, onSave }) {
  const [order, setOrder] = useState(initialData ?? EMPTY_ORDER);
  const [errors, setErrors] = useState({});

  const isEditing = Boolean(initialData);

  // Sincroniza el formulario cuando cambia el pedido a editar (o se limpia al crear).
  React.useEffect(() => {
    setOrder(initialData ?? EMPTY_ORDER);
    setErrors({});
  }, [initialData, open]);

  const update = (field, value) => setOrder((prev) => ({ ...prev, [field]: value }));

  const addLine = (line) => setOrder((prev) => ({ ...prev, products: [...prev.products, line] }));
  const removeLine = (lineId) =>
    setOrder((prev) => ({ ...prev, products: prev.products.filter((l) => l.lineId !== lineId) }));

  const shippingCost = getShippingCost(order.municipio);
  const subtotal = order.products.reduce((sum, l) => sum + l.unitPrice * l.units, 0);
  const total = subtotal + shippingCost;

  const validate = () => {
    const newErrors = {};
    if (!order.cliente.trim()) newErrors.cliente = "El cliente es obligatorio.";
    if (!order.fecha) newErrors.fecha = "La fecha es obligatoria.";
    if (!order.medioPago) newErrors.medioPago = "Selecciona un medio de pago.";
    if (!order.estado) newErrors.estado = "Selecciona un estado.";
    if (!order.comprobante) newErrors.comprobante = "Debes adjuntar el comprobante de pago.";
    if (order.products.length === 0) newErrors.products = "Agrega al menos un producto.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...order, subtotal, shippingCost, total });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar pedido" : "Crear pedido"}
      maxWidth="md"
      footer={
        <div className="order-form-footer">
          <div className="order-form-totals">
            <span>Subtotal: <strong>{formatPrice(subtotal)}</strong></span>
            <span>Envío: <strong>{formatPrice(shippingCost)}</strong></span>
            <span className="order-form-total">Total: {formatPrice(total)}</span>
          </div>
          <div className="order-form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="btn-save" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </div>
      }
    >
      <div className="order-form-continuous-container">
        {/* SECCIÓN 1: DATOS DEL PEDIDO */}
        <div className="order-form-block">
          <h3 className="order-block-title">1. Datos del pedido</h3>
          
          <FormSearchableSelect
            label="Cliente"
            required
            value={order.cliente}
            onChange={(v) => update("cliente", v)}
            options={CLIENT_OPTIONS}
            placeholder="Escribe o selecciona un cliente"
            error={errors.cliente}
          />

          <div className="order-form-row">
            <DatePicker
              label="Fecha"
              required
              value={order.fecha}
              onChange={(v) => update("fecha", v)}
              error={errors.fecha}
              minDate={todayISO()}
            />
            <FormSelect
              label="Estado del pedido"
              required
              value={order.estado}
              onChange={(v) => update("estado", v)}
              options={ORDER_STATUSES}
              error={errors.estado}
            />
          </div>

          <FormTextField
            label="Dirección"
            value={order.direccion}
            onChange={(v) => update("direccion", v)}
            placeholder="Ej. Calle 48 # 72-18"
          />

          <div className="order-form-row">
            <FormSelect
              label="Municipio"
              value={order.municipio}
              onChange={(v) => update("municipio", v)}
              options={MUNICIPIOS}
              placeholder="Selecciona un municipio"
            />
            <div className="order-form-shipping-hint">
              Costo domicilio: <strong>{formatPrice(shippingCost)}</strong>
            </div>
          </div>

          <FormTextField
            label="Instrucciones de entrega"
            value={order.instrucciones}
            onChange={(v) => update("instrucciones", v)}
            multiline
            minRows={2}
            placeholder="Instrucciones especiales para el repartidor..."
          />
        </div>

        {/* SECCIÓN 2: PRODUCTOS Y TARJETA */}
        <div className="order-form-block">
          <h3 className="order-block-title">
            2. Productos {order.products.length > 0 && `(${order.products.length})`}
          </h3>

          <OrderProductLineForm onAdd={addLine} />

          {order.products.length > 0 ? (
            <div className="order-lines-list">
              {order.products.map((line) => (
                <OrderProductLineItem key={line.lineId} line={line} onRemove={removeLine} />
              ))}
            </div>
          ) : (
            errors.products && <div className="form-error">{errors.products}</div>
          )}

          <FormTextField
            label="Mensaje para la tarjeta del pedido"
            value={order.cardMessage}
            onChange={(v) => update("cardMessage", v)}
            multiline
            minRows={2}
            placeholder="Una sola tarjeta para todo el pedido, no por producto..."
          />
        </div>

        {/* SECCIÓN 3: PAGO Y COMPROBANTE */}
        <div className="order-form-block">
          <h3 className="order-block-title">3. Pago y Comprobante</h3>

          <FormSelect
            label="Medio de pago"
            required
            value={order.medioPago}
            onChange={(v) => update("medioPago", v)}
            options={PAYMENT_METHODS}
            error={errors.medioPago}
          />

          <div className="form-field">
            <label className="form-label">Comprobante de pago *</label>
            <FileDropzone
              file={order.comprobante}
              onChange={(f) => update("comprobante", f)}
              label="Subir comprobante de pago"
              error={errors.comprobante}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}