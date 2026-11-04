// src/features/cart/hooks/useCart.jsx
import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAuth } from "../../login/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import CartNotification from "../components/CartNotification";
import {
  MAX_CART_UNITS,
  normalizarCantidad,
  totalUnidades,
} from "../../../shared/utils/orderRules";

const CartContext = createContext(null);

const PENDING_ITEM_KEY = "cb_pending_cart_item";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [cardMessage, setCardMessage] = useState("");
  
  // Aviso de sesión (advertencia) o de producto añadido tras el login (éxito).
  const [authAlert, setAuthAlert] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const flushPendingRef = useRef(false);

  // Función interna para añadir item al carrito (sin verificación de auth)
  const doAddItem = useCallback(
    (item) => {
      // El pedido de la tienda no puede superar 20 unidades en total.
      const remaining = MAX_CART_UNITS - totalUnidades(items);
      if (remaining <= 0) {
        return { merged: false, limitReached: true };
      }

      // Se añaden las unidades elegidas, recortadas al cupo disponible.
      const requested = normalizarCantidad(item.units ?? 1);
      const unitsToAdd = Math.min(requested, remaining);

      const existing = items.find(
        (it) => it.productId === item.productId && it.quantity === item.quantity && it.color === item.color
      );

      if (existing) {
        setItems(
          items.map((it) =>
            it.cartItemId === existing.cartItemId
              ? { ...it, units: it.units + unitsToAdd }
              : it
          )
        );
        return { merged: true, addedUnits: unitsToAdd };
      }

      const cartItemId = `${item.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems([
        ...items,
        {
          cartItemId,
          decorativeMessage: "",
          ...item,
          units: unitsToAdd,
        },
      ]);
      return { merged: false, addedUnits: unitsToAdd };
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

  // `nextUnits` es la cantidad absoluta escrita o calculada por el stepper.
  // Se normaliza a un entero >= 1; el tope de 20 se valida sobre el total del
  // carrito para poder mostrar el aviso al usuario.
  const updateUnits = useCallback((cartItemId, nextUnits) => {
    const unidades = normalizarCantidad(nextUnits);
    setItems((prev) =>
      prev.map((it) =>
        it.cartItemId === cartItemId ? { ...it, units: unidades } : it
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
      
      <CartNotification
        open={authAlert}
        onClose={() => setAuthAlert(false)}
        variant={user ? "success" : "warning"}
        message={
          user
            ? "Producto añadido al carrito"
            : "Debes iniciar sesión o registrarte para continuar con tu pedido. Redirigiendo..."
        }
      />
    </CartContext.Provider>
  );
}

// El hook se exporta junto al provider porque comparten el mismo contexto.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}