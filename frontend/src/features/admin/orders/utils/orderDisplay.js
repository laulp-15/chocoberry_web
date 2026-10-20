// src/features/admin/orders/utils/orderDisplay.js
// Helpers de presentación compartidos entre OrderDetailContent (Pedidos)
// y SaleReceipt (Ventas) — misma data, distintas vistas.
import { MUNICIPIOS } from "../../../cart/data/Shipping";
import { imageUrl } from "../../../../shared/utils/imageUrl";

export function formatDisplayDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function getMunicipioLabel(municipio) {
  return MUNICIPIOS.find((m) => m.value === municipio)?.label ?? "—";
}

/** Iniciales del nombre (máx. 2 palabras) para avatares. */
export function getInitials(name) {
  if (!name) return "—";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Devuelve una URL utilizable en <img>, ya sea que `comprobante` sea un
 * File (subido en esta sesión) o una URL/string (ya guardado en backend).
 */
export function getProofUrl(comprobante) {
  if (!comprobante) return null;
  if (typeof comprobante === "string") return imageUrl(comprobante);
  return URL.createObjectURL(comprobante);
}

/** Indica si un comprobante (File o string) es un PDF. */
export function isPdfProof(comprobante) {
  if (!comprobante) return false;
  if (typeof comprobante === "string") {
    return (
      comprobante.startsWith("data:application/pdf") || /\.pdf($|\?)/i.test(comprobante)
    );
  }
  return comprobante.type === "application/pdf";
}