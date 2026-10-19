// src/features/admin/orders/components/OrderFormModal.jsx
import React from "react";
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import FormSelect from "../../../../shared/components/FormSelect";
import FormAutocomplete from "../../../../shared/components/FormAutocomplete";
import DatePicker, { addDaysISO } from "../../../../shared/components/DatePicker";
import FileDropzone from "../../../../shared/components/FileDropZone";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import OrderProductLineForm from "./OrderProductLineForm";
import OrderProductLineItem from "./OrderProductLineItem";
import { MOCK_CLIENTS } from "../data/mockClients";
import { ORDER_STATUSES } from "../data/orderStatus";
import { MUNICIPIOS, getShippingCost } from "../../../cart/data/Shipping";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { validatePhone } from "../../../login/utils/validators";
import "./OrderFormModal.css";

// Listas para buscar al cliente: por nombre y por número de identificación.
// TODO: reemplazar por el módulo real de Clientes cuando exista.
const CLIENT_NAMES = MOCK_CLIENTS.map((c) => c.nombre);
const CLIENT_ID_NUMBERS = MOCK_CLIENTS.map((c) => c.idNumber);

const EMPTY_ORDER = {
  cliente: "",
  clienteIdentificacion: "",
  fecha: "",
  direccion: "",
  barrio: "",
  municipio: "",
  recipientName: "",
  recipientPhone: "",
  instrucciones: "",
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
  const isEditing = Boolean(initialData);

  const {
    values: order,
    errors,
    setField,
    setMany,
    handleBlur,
    validateAll,
    reset,
  } = useFormValidation({
    initialValues: EMPTY_ORDER,
    validators: {
      cliente: (o) => (o.cliente.trim() ? '' : 'El cliente es obligatorio.'),
      clienteIdentificacion: (o) =>
        o.clienteIdentificacion.trim() ? '' : 'El número de identificación es obligatorio.',
      fecha: (o) => (o.fecha ? '' : 'La fecha de entrega es obligatoria.'),
      direccion: (o) => (o.direccion.trim() ? '' : 'La dirección es obligatoria.'),
      barrio: (o) => (o.barrio.trim() ? '' : 'El barrio es obligatorio.'),
      municipio: (o) => (o.municipio ? '' : 'El municipio es obligatorio.'),
      recipientName: (o) => (o.recipientName.trim() ? '' : 'El nombre de quien recibe es obligatorio.'),
      recipientPhone: (o) =>
        o.recipientPhone.trim() ? validatePhone(o.recipientPhone) : 'El teléfono de quien recibe es obligatorio.',
      estado: (o) => (o.estado ? '' : 'Selecciona un estado.'),
      comprobante: (o) => (o.comprobante ? '' : 'Debes adjuntar el comprobante de pago.'),
      products: (o) => (o.products.length > 0 ? '' : 'Agrega al menos un producto.'),
    },
    immediate: ['fecha', 'municipio', 'estado', 'comprobante', 'products'],
  });

  // Sincroniza el formulario cuando cambia el pedido a editar (o se limpia al crear).
  React.useEffect(() => {
    reset(initialData ?? EMPTY_ORDER);
  }, [initialData, open]);

  const update = (field, value) => setField(field, value);

  // Al elegir un cliente (por nombre o por identificación) se rellenan sus
  // datos. Es una selección explícita, así que sobrescribe lo que hubiera.
  const applyClient = (client) => {
    if (!client) return;
    setMany({
      cliente: client.nombre,
      clienteIdentificacion: client.idNumber,
      direccion: client.direccion,
      barrio: client.barrio,
      municipio: client.municipio,
      recipientName: client.nombre,
      recipientPhone: client.telefono,
    });
  };

  const selectClientByName = (nombre) =>
    applyClient(MOCK_CLIENTS.find((c) => c.nombre === nombre));
  const selectClientById = (idNumber) =>
    applyClient(MOCK_CLIENTS.find((c) => c.idNumber === idNumber));

  const addLine = (line) => setField('products', [...order.products, line]);
  const removeLine = (lineId) =>
    setField('products', order.products.filter((l) => l.lineId !== lineId));

  const shippingCost = getShippingCost(order.municipio);
  const subtotal = order.products.reduce((sum, l) => sum + l.unitPrice * l.units, 0);
  const total = subtotal + shippingCost;

  const handleSave = () => {
    if (!validateAll()) return;
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
          
          <div className="order-form-row">
            <FormAutocomplete
              label="N. identificación"
              required
              value={order.clienteIdentificacion}
              onChange={(v) => update("clienteIdentificacion", v)}
              onSelect={selectClientById}
              onBlur={() => handleBlur("clienteIdentificacion")}
              options={CLIENT_ID_NUMBERS}
              placeholder="Buscar por documento"
              error={errors.clienteIdentificacion}
            />
            <FormAutocomplete
              label="Cliente"
              required
              value={order.cliente}
              onChange={(v) => update("cliente", v)}
              onSelect={selectClientByName}
              onBlur={() => handleBlur("cliente")}
              options={CLIENT_NAMES}
              placeholder="Buscar por nombre"
              error={errors.cliente}
            />
          </div>

          <div className="order-form-row">
            <DatePicker
              label="Fecha de entrega"
              required
              value={order.fecha}
              onChange={(v) => update("fecha", v)}
              error={errors.fecha}
              minDate={addDaysISO(1)}
              maxDate={addDaysISO(15)}
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

          <div className="order-form-row">
            <FormTextField
              label="Dirección"
              required
              value={order.direccion}
              onChange={(v) => update("direccion", v)}
              onBlur={() => handleBlur("direccion")}
              placeholder="Ej. Calle 48 # 72-18"
              error={errors.direccion}
            />
            <FormTextField
              label="Barrio"
              required
              value={order.barrio}
              onChange={(v) => update("barrio", v)}
              onBlur={() => handleBlur("barrio")}
              placeholder="Ej. El Poblado"
              error={errors.barrio}
            />
          </div>

          <div className="order-form-row">
            <FormTextField
              label="Quién recibe la entrega"
              required
              value={order.recipientName}
              onChange={(v) => update("recipientName", v)}
              onBlur={() => handleBlur("recipientName")}
              placeholder="Ej. Mariana Valenzuela"
              error={errors.recipientName}
            />
            <FormTextField
              label="Teléfono"
              required
              value={order.recipientPhone}
              onChange={(v) => update("recipientPhone", v)}
              onBlur={() => handleBlur("recipientPhone")}
              placeholder="Ej. 300 123 4567"
              error={errors.recipientPhone}
            />
          </div>

          <div className="order-form-row">
            <FormSelect
              label="Municipio"
              required
              value={order.municipio}
              onChange={(v) => update("municipio", v)}
              options={MUNICIPIOS}
              placeholder="Selecciona un municipio"
              error={errors.municipio}
            />
            <FormTextField
              label="Costo domicilio"
              value={formatPrice(shippingCost)}
              readOnly
              placeholder="—"
            />
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

          <div className="form-field">
            <label className="form-label">Comprobante de pago *</label>
            <FileDropzone
              file={order.comprobante}
              onChange={(f) => update("comprobante", f)}
              label="Subir comprobante de pago"
              hint="PNG, JPG, WEBP o PDF (máx. 5 MB)"
              error={errors.comprobante}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}