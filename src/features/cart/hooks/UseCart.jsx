// src/features/cart/hooks/useCart.jsx
import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../login/hooks/useAuth"; // Ajusta la ruta si es necesario

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cardMessage, setCardMessage] = useState("");
  
  // Estado para la alerta visual amarilla
  const [authAlert, setAuthAlert] = useState(false);

  const { user } = useAuth();

  const addItem = useCallback(
    (item) => {
      // Validar si el usuario está autenticado
      if (!user) {
        setAuthAlert(true);
        // Opcional: Ocultar la alerta y redirigir después de unos segundos (ej. 3 segundos)
        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
        return;
      }

      const existing = items.find(
        (it) => it.productId === item.productId && it.quantity === item.quantity && it.color === item.color
      );

      if (existing) {
        setItems(
          items.map((it) =>
            it.cartItemId === existing.cartItemId ? { ...it, units: it.units + 1 } : it
          )
        );
        return { merged: true };
      }

      const cartItemId = `${item.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems([
        ...items,
        {
          cartItemId,
          units: 1,
          decorativeMessage: "",
          extraCustomization: "",
          ...item,
        },
      ]);
      return { merged: false };
    },
    [items, user]
  );

  const removeItem = useCallback((cartItemId) => {
    setItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCardMessage("");
  }, []);

  const updateUnits = useCallback((cartItemId, delta) => {
    setItems((prev) =>
      prev.map((it) =>
        it.cartItemId === cartItemId
          ? { ...it, units: Math.max(1, it.units + delta) }
          : it
      )
    );
  }, []);

  const updateField = useCallback((cartItemId, field, value) => {
    setItems((prev) =>
      prev.map((it) => (it.cartItemId === cartItemId ? { ...it, [field]: value } : it))
    );
  }, []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateUnits,
      updateField,
      clearCart,
      cardMessage,
      setCardMessage,
    }),
    [items, addItem, removeItem, updateUnits, updateField, clearCart, cardMessage]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      
      {/* Aviso visual bonito y de color amarillo */}
      {authAlert && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            backgroundColor: "#FEF3C7", // Fondo amarillo claro (tipo warning)
            color: "#92400E", // Texto marrón/amarillo oscuro legible
            border: "1px solid #F59E0B", // Borde amarillo intenso
            padding: "16px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontFamily: "inherit",
            maxWidth: "350px",
            animation: "fadeIn 0.3s ease-in-out",
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: "20px", color: "#D97706" }}></i>
          <div>
            <strong style={{ display: "block", fontSize: "14px", marginBottom: "2px" }}>¡Atención!</strong>
            <span style={{ fontSize: "13px" }}>Debes iniciar sesión o registrarte para continuar con tu pedido. Redirigiendo...</span>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}