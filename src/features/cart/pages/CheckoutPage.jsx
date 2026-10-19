// src/features/cart/pages/CheckoutPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { useAuth } from "../../login/hooks/useAuth";
import { useCart } from "../hooks/UseCart";
import useFormValidation from "../../../shared/hooks/useFormValidation";
import { validatePhone } from "../../login/utils/validators";
import ShippingForm from "../components/ShippingForm";
import PaymentSection from "../components/PaymentSection";
import OrderSummary from "../components/OrderSummary";
import OrderCardMessage from "../components/OrderCardMessage";
import { getShippingCost } from "../data/Shipping";
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, cardMessage, clearCart } = useCart();

  const {
    values: form,
    errors,
    setField,
    setMany,
    handleBlur,
    validateAll,
  } = useFormValidation({
    initialValues: INITIAL_FORM,
    validators: {
      fullName: (v) => (v.fullName.trim() ? "" : "El nombre completo es obligatorio."),
      deliveryDate: (v) => (v.deliveryDate ? "" : "Selecciona la fecha de entrega."),
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

  // Precarga el nombre y la dirección con los datos del perfil del usuario.
  // Solo rellena si el campo está vacío, para no sobrescribir lo que el
  // usuario ya haya escrito o modificado en esta pantalla.
  useEffect(() => {
    if (!user) return;
    setMany({
      fullName: form.fullName || user.fullName || "",
      address: form.address || user.address || "",
      neighborhood: form.neighborhood || user.neighborhood || "",
      recipientName: form.recipientName || user.fullName || "",
      recipientPhone: form.recipientPhone || user.phone || "",
    });
  }, [user]);

  const shippingCost = getShippingCost(form.municipio);

  const handleFieldChange = (field, value) => setField(field, value);

  const handleSubmit = () => {
    if (!validateAll()) return;

    // TODO: enviar `form` + `cardMessage` + `items` al backend (crear pedido)
    console.log("Pedido:", { ...form, cardMessage, items, shippingCost });

    clearCart();
    navigate("/productos"); // TODO: navegar a una página de confirmación real
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
            <OrderSummary items={items} shippingCost={shippingCost} onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}