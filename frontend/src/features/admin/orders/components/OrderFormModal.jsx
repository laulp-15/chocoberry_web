// src/features/admin/orders/components/OrderFormModal.jsx
import { useState } from "react";
import Modal from "../../../../shared/components/Modal";
import FormTextField from "../../../../shared/components/FormTextField";
import FormSelect from "../../../../shared/components/FormSelect";
import FormAutocomplete from "../../../../shared/components/FormAutocomplete";
import DatePicker, { addDaysISO } from "../../../../shared/components/DatePicker";
import FileDropzone from "../../../../shared/components/FileDropZone";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import OrderProductLineForm from "./OrderProductLineForm";
import OrderProductLineItem from "./OrderProductLineItem";
import { getStatusMeta } from "../data/orderStatus";
import { getProofUrl } from "../utils/orderDisplay";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { IMAGE_ACCEPT } from "../../../../shared/utils/fileValidation";
import { validatePhone } from "../../../login/utils/validators";
import "./OrderFormModal.css";

const MAX_LINEAS = 50;

const EMPTY_ORDER = {
  clienteId: "",
  cliente: "",
  clienteIdentificacion: "",
  fecha: "",
  direccion: "",
  barrio: "",
  municipioId: "",
  recipientName: "",
  recipientPhone: "",
  instrucciones: "",
  comprobante: null,
  cardMessage: "",
  lineas: [],
};

/** Convierte un pedido del API al shape plano del formulario. */
function toFormValues(order) {
  if (!order) return EMPTY_ORDER;

  return {
    clienteId: order.clienteId != null ? String(order.clienteId) : "",
    cliente: order.cliente ?? "",
    clienteIdentificacion: order.clienteIdentificacion ?? "",
    fecha: order.fechaEntrega ?? "",
    direccion: order.direccion ?? "",
    barrio: order.barrio ?? "",
    municipioId:
      order.municipioId != null ? String(order.municipioId) : "",
    recipientName: order.nombreReceptor ?? order.recipientName ?? "",
    recipientPhone: order.telefonoReceptor ?? order.recipientPhone ?? "",
    instrucciones: order.instruccionesEntrega ?? order.instrucciones ?? "",
    comprobante: null,
    cardMessage: order.mensajeTarjeta ?? order.cardMessage ?? "",
    lineas: Array.isArray(order.lineas) ? order.lineas : [],
  };
}

/**
 * Modal de Crear/Editar pedido en una sola vista continua.
 *
 * Crear: exige cliente registrado, comprobante y al menos una línea.
 * Editar: solo cabecera (el backend no permite cambiar líneas ni comprobante).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} [props.initialData]
 * @param {(datos: object) => Promise<void>} props.onSubmit
 * @param {boolean} [props.submitting]
 * @param {object} props.options
 * @param {boolean} [props.optionsLoading]
 * @param {string} [props.optionsError]
 * @param {() => void} [props.onRetryOptions]
 */
export default function OrderFormModal({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
  options,
  optionsLoading = false,
  optionsError = "",
  onRetryOptions,
}) {
  const isEditing = Boolean(initialData);
  const [formError, setFormError] = useState("");

  const {
    values: order,
    errors,
    setField,
    setMany,
    handleBlur,
    validateAll,
  } = useFormValidation({
    initialValues: toFormValues(initialData),
    validators: {
      clienteId: (o) =>
        isEditing || o.clienteId ? "" : "Selecciona un cliente registrado.",
      fecha: (o) => (o.fecha ? "" : "La fecha de entrega es obligatoria."),
      direccion: (o) => {
        const valor = o.direccion.trim();
        if (!valor) return "La dirección es obligatoria.";
        if (valor.length < 5) return "La dirección es demasiado corta.";
        if (valor.length > 200) {
          return "La dirección no puede superar los 200 caracteres.";
        }
        return "";
      },
      barrio: (o) => {
        const valor = o.barrio.trim();
        if (!valor) return "El barrio es obligatorio.";
        if (valor.length < 2) return "El barrio es demasiado corto.";
        if (valor.length > 100) {
          return "El barrio no puede superar los 100 caracteres.";
        }
        return "";
      },
      municipioId: (o) => (o.municipioId ? "" : "El municipio es obligatorio."),
      recipientName: (o) => {
        const valor = o.recipientName.trim();
        if (!valor) return "El nombre de quien recibe es obligatorio.";
        if (valor.length < 2) return "El nombre es demasiado corto.";
        if (valor.length > 100) {
          return "El nombre no puede superar los 100 caracteres.";
        }
        return "";
      },
      recipientPhone: (o) =>
        o.recipientPhone.trim()
          ? validatePhone(o.recipientPhone)
          : "El teléfono de quien recibe es obligatorio.",
      comprobante: (o) =>
        isEditing || o.comprobante
          ? ""
          : "Debes adjuntar el comprobante de pago.",
      instrucciones: (o) =>
        o.instrucciones.trim().length > 255
          ? "Las instrucciones no pueden superar los 255 caracteres."
          : "",
      cardMessage: (o) =>
        o.cardMessage.trim().length > 255
          ? "El mensaje de la tarjeta no puede superar los 255 caracteres."
          : "",
      lineas: (o) => {
        if (isEditing) return "";
        if (o.lineas.length === 0) return "Agrega al menos un producto.";
        if (o.lineas.length > MAX_LINEAS) {
          return `Puedes agregar hasta ${MAX_LINEAS} productos por pedido.`;
        }
        return "";
      },
    },
    immediate: [
      "clienteId",
      "fecha",
      "municipioId",
      "comprobante",
      "lineas",
    ],
  });

  const clientes = options?.clientes ?? [];
  const municipios = options?.municipios ?? [];
  const clienteNames = clientes.map((cliente) => cliente.fullName);
  const clienteDocs = clientes.map((cliente) => cliente.idNumber);

  const applyClient = (client) => {
    if (!client) return;
    setMany({
      clienteId: String(client.id),
      cliente: client.fullName,
      clienteIdentificacion: client.idNumber,
      direccion: client.address ?? "",
      barrio: client.neighborhood ?? "",
      recipientName: client.fullName ?? "",
      recipientPhone: client.phone ?? "",
    });
  };

  const handleClientNameChange = (value) => {
    const match = clientes.find((cliente) => cliente.fullName === value);
    if (match) {
      applyClient(match);
      return;
    }
    setMany({ cliente: value, clienteId: "" });
  };

  const handleClientDocChange = (value) => {
    const match = clientes.find((cliente) => cliente.idNumber === value);
    if (match) {
      applyClient(match);
      return;
    }
    setMany({ clienteIdentificacion: value, clienteId: "" });
  };

  const selectedMunicipio = municipios.find(
    (municipio) => String(municipio.id) === String(order.municipioId)
  );
  const shippingCost =
    selectedMunicipio?.costoEnvio ??
    (isEditing ? initialData?.shippingCost ?? 0 : 0);

  const municipioOptions = municipios.map((municipio) => ({
    value: String(municipio.id),
    label: `${municipio.nombre} — ${formatPrice(municipio.costoEnvio)}`,
  }));

  // Un pedido viejo puede apuntar a un municipio que ya fue desactivado.
  if (
    isEditing &&
    initialData?.municipioId &&
    !municipios.some(
      (municipio) => String(municipio.id) === String(initialData.municipioId)
    )
  ) {
    municipioOptions.unshift({
      value: String(initialData.municipioId),
      label: `${initialData.municipio} — ${formatPrice(
        initialData.shippingCost ?? 0
      )}`,
    });
  }

  const lineas = order.lineas ?? [];
  const subtotal = lineas.reduce(
    (suma, linea) =>
      suma + Number(linea.precioUnitario) * Number(linea.unidades),
    0
  );
  const total = subtotal + shippingCost;

  const addLine = (linea) => {
    if (lineas.length >= MAX_LINEAS) {
      setFormError(`Puedes agregar hasta ${MAX_LINEAS} productos por pedido.`);
      return;
    }
    setFormError("");
    setField("lineas", [...lineas, linea]);
  };
  const removeLine = (lineId) =>
    setField(
      "lineas",
      lineas.filter((linea) => String(linea.lineId ?? linea.id) !== String(lineId))
    );

  const handleClose = () => {
    setFormError("");
    onClose();
  };

  const handleSave = async () => {
    if (submitting) return;

    setFormError("");
    if (!validateAll()) return;

    try {
      if (isEditing) {
        await onSubmit({
          fechaEntrega: order.fecha,
          direccion: order.direccion.trim(),
          barrio: order.barrio.trim(),
          idMunicipio: Number(order.municipioId),
          nombreReceptor: order.recipientName.trim(),
          telefonoReceptor: order.recipientPhone.trim(),
          instruccionesEntrega: order.instrucciones.trim(),
          mensajeTarjeta: order.cardMessage.trim(),
        });
      } else {
        await onSubmit({
          idUsuario: Number(order.clienteId),
          comprobante: order.comprobante,
          fechaEntrega: order.fecha,
          direccion: order.direccion.trim(),
          barrio: order.barrio.trim(),
          idMunicipio: Number(order.municipioId),
          nombreReceptor: order.recipientName.trim(),
          telefonoReceptor: order.recipientPhone.trim(),
          instruccionesEntrega: order.instrucciones.trim(),
          mensajeTarjeta: order.cardMessage.trim(),
          lineas,
        });
      }
    } catch (err) {
      setFormError(err?.message || "No se pudo guardar el pedido.");
    }
  };

  const currentProofUrl = isEditing
    ? getProofUrl(initialData?.comprobante)
    : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar pedido" : "Crear pedido"}
      maxWidth="md"
      footer={
        <div className="order-form-footer">
          <div className="order-form-totals">
            <span>
              Subtotal: <strong>{formatPrice(subtotal)}</strong>
            </span>
            <span>
              Envío: <strong>{formatPrice(shippingCost)}</strong>
            </span>
            <span className="order-form-total">
              Total: {formatPrice(total)}
            </span>
          </div>
          <div className="order-form-actions">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn-save"
              onClick={handleSave}
              disabled={
                submitting || optionsLoading || Boolean(optionsError)
              }
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      }
    >
      <div className="order-form-continuous-container">
        {optionsError && (
          <div className="form-error form-error-block" role="alert">
            <i className="fa-solid fa-triangle-exclamation" /> {optionsError}
            {onRetryOptions && (
              <button
                type="button"
                className="order-form-retry"
                onClick={onRetryOptions}
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {optionsLoading && (
          <div className="order-form-info" role="status">
            <i className="fa-solid fa-spinner fa-spin" /> Cargando clientes,
            municipios y productos...
          </div>
        )}

        {formError && (
          <div className="form-error form-error-block" role="alert">
            {formError}
          </div>
        )}

        {/* SECCIÓN 1: DATOS DEL PEDIDO */}
        <div className="order-form-block">
          <h3 className="order-block-title">1. Datos del pedido</h3>

          <div className="order-form-row">
            {isEditing ? (
              <>
                <FormTextField
                  label="N. identificación"
                  value={order.clienteIdentificacion}
                  readOnly
                />
                <FormTextField
                  label="Cliente"
                  value={order.cliente}
                  readOnly
                />
              </>
            ) : (
              <>
                <FormAutocomplete
                  label="N. identificación"
                  required
                  value={order.clienteIdentificacion}
                  onChange={handleClientDocChange}
                  onSelect={(value) => {
                    const match = clientes.find(
                      (cliente) => cliente.idNumber === value
                    );
                    if (match) applyClient(match);
                  }}
                  onBlur={() => handleBlur("clienteId")}
                  options={clienteDocs}
                  placeholder="Buscar por documento"
                  error={errors.clienteId}
                />
                <FormAutocomplete
                  label="Cliente"
                  required
                  value={order.cliente}
                  onChange={handleClientNameChange}
                  onSelect={(value) => {
                    const match = clientes.find(
                      (cliente) => cliente.fullName === value
                    );
                    if (match) applyClient(match);
                  }}
                  onBlur={() => handleBlur("clienteId")}
                  options={clienteNames}
                  placeholder="Buscar por nombre"
                  error={errors.clienteId}
                />
              </>
            )}
          </div>

          <div className="order-form-row">
            <DatePicker
              label="Fecha de entrega"
              required
              value={order.fecha}
              onChange={(v) => setField("fecha", v)}
              error={errors.fecha}
              minDate={isEditing ? undefined : addDaysISO(1)}
              maxDate={isEditing ? undefined : addDaysISO(15)}
            />
            <FormTextField
              label="Estado del pedido"
              value={
                isEditing
                  ? getStatusMeta(initialData.estado).label
                  : "Pendiente"
              }
              readOnly
            />
          </div>

          <div className="order-form-row">
            <FormTextField
              label="Dirección"
              required
              value={order.direccion}
              onChange={(v) => setField("direccion", v)}
              onBlur={() => handleBlur("direccion")}
              placeholder="Ej. Calle 48 # 72-18"
              error={errors.direccion}
            />
            <FormTextField
              label="Barrio"
              required
              value={order.barrio}
              onChange={(v) => setField("barrio", v)}
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
              onChange={(v) => setField("recipientName", v)}
              onBlur={() => handleBlur("recipientName")}
              placeholder="Ej. Mariana Valenzuela"
              error={errors.recipientName}
            />
            <FormTextField
              label="Teléfono"
              required
              value={order.recipientPhone}
              onChange={(v) => setField("recipientPhone", v)}
              onBlur={() => handleBlur("recipientPhone")}
              placeholder="Ej. 300 123 4567"
              error={errors.recipientPhone}
            />
          </div>

          <div className="order-form-row">
            <FormSelect
              label="Municipio"
              required
              value={order.municipioId}
              onChange={(v) => setField("municipioId", v)}
              onBlur={() => handleBlur("municipioId")}
              options={municipioOptions}
              placeholder="Selecciona un municipio"
              error={errors.municipioId}
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
            onChange={(v) => setField("instrucciones", v)}
            onBlur={() => handleBlur("instrucciones")}
            multiline
            minRows={2}
            placeholder="Instrucciones especiales para el repartidor..."
            error={errors.instrucciones}
          />
        </div>

        {/* SECCIÓN 2: PRODUCTOS Y TARJETA */}
        <div className="order-form-block">
          <h3 className="order-block-title">
            2. Productos {lineas.length > 0 && `(${lineas.length})`}
          </h3>

          {isEditing ? (
            <div className="order-form-note">
              Los productos y sus precios no se editan desde este formulario.
              Si necesitas cambiarlos, crea un pedido nuevo.
            </div>
          ) : (
            <OrderProductLineForm onAdd={addLine} options={options} />
          )}

          {lineas.length > 0 ? (
            <div className="order-lines-list">
              {lineas.map((linea) => (
                <OrderProductLineItem
                  key={linea.lineId ?? linea.id}
                  line={linea}
                  onRemove={isEditing ? undefined : removeLine}
                />
              ))}
            </div>
          ) : (
            errors.lineas && <div className="form-error">{errors.lineas}</div>
          )}

          <FormTextField
            label="Mensaje para la tarjeta del pedido"
            value={order.cardMessage}
            onChange={(v) => setField("cardMessage", v)}
            onBlur={() => handleBlur("cardMessage")}
            multiline
            minRows={2}
            placeholder="Una sola tarjeta para todo el pedido, no por producto..."
            error={errors.cardMessage}
          />
        </div>

        {/* SECCIÓN 3: PAGO Y COMPROBANTE */}
        <div className="order-form-block">
          <h3 className="order-block-title">3. Pago y comprobante</h3>

          {isEditing ? (
            <div className="order-form-current-proof">
              <div className="form-label">Comprobante de pago</div>
              {currentProofUrl ? (
                <a
                  href={currentProofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="order-form-proof-link"
                >
                  <img
                    src={currentProofUrl}
                    alt="Comprobante de pago"
                    className="order-form-proof-thumb"
                  />
                </a>
              ) : (
                <div className="order-form-note">Sin comprobante adjunto.</div>
              )}
              <div className="order-form-note">
                El comprobante no se puede cambiar desde la edición.
              </div>
            </div>
          ) : (
            <div className="form-field">
              <label className="form-label">Comprobante de pago *</label>
              <FileDropzone
                file={order.comprobante}
                onChange={(file) => setField("comprobante", file)}
                label="Subir comprobante de pago"
                hint="PNG, JPG o WEBP (máx. 5 MB)"
                accept={IMAGE_ACCEPT}
                allowPdf={false}
                error={errors.comprobante}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
