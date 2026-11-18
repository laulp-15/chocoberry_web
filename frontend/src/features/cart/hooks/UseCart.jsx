// src/features/cart/hooks/useCart.jsx
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import {
  MAX_CART_UNITS,
  normalizarCantidad,
  totalUnidades,
} from "../../../shared/utils/orderRules";

const CartContext = createContext(null);

// El carrito vive en localStorage para sobrevivir al login, a las recargas y
// al cierre del navegador hasta que el usuario lo vacíe.
const CART_STORAGE_KEY = "cb_cart_items";

function leerCarritoGuardado() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(leerCarritoGuardado);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin almacenamiento disponible: el carrito vive solo en memoria.
    }
  }, [items]);

  // Añadir item al carrito (disponible con o sin sesión iniciada).
  const addItem = useCallback(
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
          letrasFresas: "",
          mensajeTarjeta: "",
          ...item,
          units: unitsToAdd,
        },
      ]);
      return { merged: false, addedUnits: unitsToAdd };
    },
    [items]
  );

  const removeItem = useCallback((cartItemId) => {
    setItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
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
    }),
    [items, addItem, removeItem, updateUnits, updateField, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// El hook se exporta junto al provider porque comparten el mismo contexto.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
