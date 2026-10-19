// src/features/cart/hooks/useCart.jsx
import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../login/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const CartContext = createContext(null);

const PENDING_ITEM_KEY = "cb_pending_cart_item";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cardMessage, setCardMessage] = useState("");
  
  // Estado para la alerta visual amarilla
  const [authAlert, setAuthAlert] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flushPendingRef = useRef(false);

  // Función interna para añadir item al carrito (sin verificación de auth)
  const doAddItem = useCallback(
    (item) => {
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
    [items]
  );

  // Flushea el item pendiente si hay uno y el usuario está autenticado
  const flushPendingItem = useCallback(() => {
    if (!user) return;

    try {
      const raw = sessionStorage.getItem(PENDING_ITEM_KEY);
      if (!raw) return;

      const pending = JSON.parse(raw);
      sessionStorage.removeItem(PENDING_ITEM_KEY);

      // Añadir el item al carrito
      doAddItem(pending.item);
      
      // Opcional: mostrar notificación de éxito
      setAuthAlert(true);
      setTimeout(() => setAuthAlert(false), 3000);
    } catch (e) {
      console.warn("Error al procesar item pendiente:", e);
      sessionStorage.removeItem(PENDING_ITEM_KEY);
    }
  }, [user, doAddItem]);

  // Efecto: cuando el usuario inicia sesión (user pasa de null a truthy), flushear item pendiente
  useEffect(() => {
    if (user && !flushPendingRef.current) {
      flushPendingRef.current = true;
      flushPendingItem();
    } else if (!user) {
      flushPendingRef.current = false;
    }
  }, [user, flushPendingItem]);

  // API pública: addItem guarda item pendiente y redirige a login si no hay sesión
  const addItem = useCallback(
    (item, options = {}) => {
      const { fromPath } = options;

      // Validar si el usuario está autenticado
      if (!user) {
        // Guardar item pendiente con la ruta de retorno
        const pendingData = {
          item,
          fromPath: fromPath || location.pathname,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(PENDING_ITEM_KEY, JSON.stringify(pendingData));

        setAuthAlert(true);
        // Esperar 3 segundos antes de redirigir (comportamiento original)
        // y cerrar la alerta tras 3s
        const alertTimer = setTimeout(() => setAuthAlert(false), 3000);
        const redirectTimer = setTimeout(() => {
          navigate("/login", { state: { from: fromPath || location.pathname }, replace: true });
        }, 3000);
        
        // Devolver timers por si el consumidor quiere limpiar (opcional)
        return { alertTimer, redirectTimer };
      }

      return doAddItem(item);
    },
    [user, location, navigate, doAddItem]
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
            backgroundColor: "#FEF3C7",
            color: "#92400E",
            border: "1px solid #F59E0B",
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
            <span style={{ fontSize: "13px" }}>
              {user 
                ? "Producto añadido al carrito" 
                : "Debes iniciar sesión o registrarte para continuar con tu pedido. Redirigiendo..."}
            </span>
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