// src/features/cart/pages/CheckoutPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import { useAuth } from "../../login/hooks/useAuth";
import { useCart } from "../hooks/UseCart";
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
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, cardMessage, clearCart } = useCart();

  const [form, setForm] = useState(INITIAL_FORM);
  const [proofFile, setProofFile] = useState(null);
  const [errors, setErrors] = useState({});

  // Precarga el nombre y la dirección con los datos del perfil del usuario.
  // Solo rellena si el campo está vacío, para no sobrescribir lo que el
  // usuario ya haya escrito o modificado en esta pantalla.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName || "",
      address: prev.address || user.address || "",
      neighborhood: prev.neighborhood || user.neighborhood || "",
      recipientPhone: prev.recipientPhone || user.phone || "",
    }));
  }, [user]);

  const shippingCost = getShippingCost(form.municipio);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = "El nombre completo es obligatorio.";
    if (!form.deliveryDate) newErrors.deliveryDate = "Selecciona la fecha de entrega.";
    if (!form.municipio) {
      newErrors.municipio = "Selecciona el municipio de entrega.";
    }
    if (!form.address.trim()) {
      newErrors.address = "Debe escribir una dirección para su entrega.";
    }
    if (!form.neighborhood.trim()) {
      newErrors.neighborhood = "Debe escribir un barrio para su entrega.";
    }
    if (!form.recipientName.trim()) {
      newErrors.recipientName = "El nombre de quien recibe es obligatorio.";
    }
    if (!form.recipientPhone.trim()) {
      newErrors.recipientPhone = "El teléfono de quien recibe es obligatorio.";
    }
    if (!proofFile) newErrors.proofFile = "Debes adjuntar el comprobante de pago.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    // TODO: enviar `form` + `cardMessage` + `proofFile` + `items` al backend (crear pedido)
    console.log("Pedido:", { ...form, cardMessage, proofFile, items, shippingCost });

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
              fullNameError={errors.fullName}
              deliveryDateError={errors.deliveryDate}
              municipioError={errors.municipio}
              addressError={errors.address}
              neighborhoodError={errors.neighborhood}
              recipientNameError={errors.recipientName}
              recipientPhoneError={errors.recipientPhone}
            />
            <PaymentSection
              proofFile={proofFile}
              onProofFileChange={setProofFile}
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