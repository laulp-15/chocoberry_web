// src/features/cart/pages/CheckoutPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { useAuth } from "../../login/hooks/useAuth";
import { useCart } from "../hooks/UseCart";
import useMunicipiosEntrega from "../hooks/useMunicipiosEntrega";
import useFormValidation from "../../../shared/hooks/useFormValidation";
import { validatePhone } from "../../login/utils/validators";
import {
  esPedidoGrande,
  excedeLimiteCarrito,
  fechaMinimaEntrega,
  formatearFechaISO,
  mensajeLimiteCarrito,
} from "../../../shared/utils/orderRules";
import ShippingForm from "../components/ShippingForm";
import PaymentSection from "../components/PaymentSection";
import OrderSummary from "../components/OrderSummary";
import OrderCardMessage from "../components/OrderCardMessage";
import * as orderService from "../../orders/services/orderService";
import "./CheckoutPage.css";

const INITIAL_FORM = {
  fullName: "",
  address: "",
  neighborhood: "",
  municipio: "",
  recipientName: "",
  recipientPhone: "",
  instructions: "",
  deliveryDate: "",
  cardMessage: "",
  proofFile: null,
};

/** Precarga los datos del perfil sin sobrescribir lo que el usuario escriba. */
function initialFormForUser(user) {
  return {
    ...INITIAL_FORM,
    fullName: user?.fullName ?? "",
    address: user?.address ?? "",
    neighborhood: user?.neighborhood ?? "",
    recipientName: user?.fullName ?? "",
    recipientPhone: user?.phone ?? "",
  };
}

/**
 * Reglas que el backend también valida. Se comprueban antes de subir el
 * comprobante para no dejar archivos huérfanos por un error de texto.
 */
function validarLineas(items, cardMessage) {
  if (String(cardMessage ?? "").trim().length > 255) {
    return "El mensaje de la tarjeta no puede superar los 255 caracteres.";
  }

  if (excedeLimiteCarrito(items)) {
    return mensajeLimiteCarrito();
  }

  for (const item of items) {
    if (!item.presentationId || !item.colorId) {
      return `La configuración de "${item.name}" está incompleta. Vuelve a agregarla al carrito.`;
    }

    const mensaje = String(item.decorativeMessage ?? "").trim();
    const maximo = Math.min(Number(item.quantity) || 0, 255);
    if (mensaje.length > maximo) {
      return `El mensaje decorativo de "${item.name}" no puede superar ${maximo} caracteres (una letra por fresa).`;
    }

    if (String(item.extraCustomization ?? "").trim().length > 255) {
      return `La personalización adicional de "${item.name}" no puede superar los 255 caracteres.`;
    }
  }

  return "";
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const {
    municipios,
    loading: loadingMunicipios,
    error: municipiosError,
    reload: reloadMunicipios,
  } = useMunicipiosEntrega();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    values: form,
    errors,
    setField,
    handleBlur,
    validateAll,
  } = useFormValidation({
    initialValues: initialFormForUser(user),
    validators: {
      fullName: (v) => (v.fullName.trim() ? "" : "El nombre completo es obligatorio."),
      deliveryDate: (v) => {
        if (!v.deliveryDate) return "Selecciona la fecha de entrega.";
        const minima = fechaMinimaEntrega(items);
        if (v.deliveryDate >= minima) return "";
        return esPedidoGrande(items)
          ? `Con más de 10 unidades en total, la entrega más próxima es el ${formatearFechaISO(minima)}.`
          : `La entrega más próxima es el ${formatearFechaISO(minima)}.`;
      },
      municipio: (v) => (v.municipio ? "" : "Selecciona el municipio de entrega."),
      address: (v) => (v.address.trim() ? "" : "Debe escribir una dirección para su entrega."),
      neighborhood: (v) => (v.neighborhood.trim() ? "" : "Debe escribir un barrio para su entrega."),
      recipientName: (v) => (v.recipientName.trim() ? "" : "El nombre de quien recibe es obligatorio."),
      recipientPhone: (v) =>
        v.recipientPhone.trim() ? validatePhone(v.recipientPhone) : "El teléfono de quien recibe es obligatorio.",
      proofFile: (v) => (v.proofFile ? "" : "Debes adjuntar el comprobante de pago."),
    },
    immediate: ["deliveryDate", "municipio", "proofFile"],
  });

  const selectedMunicipio = municipios.find(
    (municipio) => String(municipio.id) === String(form.municipio)
  );
  const shippingCost = selectedMunicipio?.precioDomicilio ?? 0;
  const pedidoGrande = esPedidoGrande(items);
  const minDeliveryDate = fechaMinimaEntrega(items);

  const handleFieldChange = (field, value) => setField(field, value);

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitError("");
    if (!validateAll()) return;

    const errorLineas = validarLineas(items, form.cardMessage);
    if (errorLineas) {
      setSubmitError(errorLineas);
      return;
    }

    if (!selectedMunicipio) {
      setSubmitError("Selecciona un municipio de entrega válido.");
      return;
    }

    const datos = new FormData();
    datos.append("comprobante", form.proofFile);
    datos.append("fechaEntrega", form.deliveryDate);
    datos.append("direccion", form.address.trim());
    datos.append("barrio", form.neighborhood.trim());
    datos.append("idMunicipio", String(form.municipio));
    datos.append("nombreReceptor", form.recipientName.trim());
    datos.append("telefonoReceptor", form.recipientPhone.trim());

    if (form.cardMessage.trim()) {
      datos.append("mensajeTarjeta", form.cardMessage.trim());
    }
    if (form.instructions.trim()) {
      datos.append("instruccionesEntrega", form.instructions.trim());
    }

    datos.append(
      "lineas",
      JSON.stringify(
        items.map((item) => ({
          idProducto: item.productId,
          idPresentacion: item.presentationId,
          cantidadProductos: item.units,
          idColorGlaseado: item.colorId,
          ...(String(item.decorativeMessage ?? "").trim()
            ? { mensajePersonalizado: item.decorativeMessage.trim() }
            : {}),
          ...(String(item.extraCustomization ?? "").trim()
            ? { personalizacionAdicional: item.extraCustomization.trim() }
            : {}),
        }))
      )
    );

    setSubmitting(true);
    try {
      const pedido = await orderService.crear(datos);
      clearCart();
      navigate("/users/orders", { state: { pedidoCreado: pedido.id } });
    } catch (err) {
      setSubmitError(
        err?.message || "No se pudo crear el pedido. Inténtalo de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container checkout-wrap">
          <p>Tu carrito está vacío.</p>
          <button type="button" className="checkout-empty-link" onClick={() => navigate("/productos")}>
            Ver catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container checkout-wrap">
        <div className="checkout-header">
          <IconButton className="checkout-back" disableRipple onClick={() => navigate("/carrito")}>
            <i className="fa-solid fa-arrow-left-long" />
          </IconButton>
          <h1 className="checkout-title">Finalizar Pedido</h1>
        </div>

        {submitError && (
          <div className="checkout-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" />
            <span>{submitError}</span>
          </div>
        )}

        {municipiosError && (
          <div className="checkout-error" role="alert">
            <i className="fa-solid fa-triangle-exclamation" />
            <span>{municipiosError}</span>
            <button type="button" className="checkout-retry" onClick={reloadMunicipios}>
              Reintentar
            </button>
          </div>
        )}

        <div className="row">
          <div className="col-12 col-lg-7">
            <OrderCardMessage
              value={form.cardMessage}
              onChange={(v) => handleFieldChange("cardMessage", v)}
            />
            <ShippingForm
              values={form}
              onChange={handleFieldChange}
              onBlurField={handleBlur}
              municipios={municipios}
              municipiosLoading={loadingMunicipios}
              minDeliveryDate={minDeliveryDate}
              largeOrder={pedidoGrande}
              fullNameError={errors.fullName}
              deliveryDateError={errors.deliveryDate}
              municipioError={errors.municipio}
              addressError={errors.address}
              neighborhoodError={errors.neighborhood}
              recipientNameError={errors.recipientName}
              recipientPhoneError={errors.recipientPhone}
            />
            <PaymentSection
              proofFile={form.proofFile}
              onProofFileChange={(file) => setField("proofFile", file)}
              proofFileError={errors.proofFile}
            />
          </div>
          <div className="col-12 col-lg-5">
            <OrderSummary
              items={items}
              shippingCost={shippingCost}
              onSubmit={handleSubmit}
              submitting={submitting || loadingMunicipios}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
