// src/features/admin/orders/components/OrderDetailContent.jsx
import React, { useState } from "react";
import OrderStatusBadge from "./OrderStatusBadge";
import ImageLightbox from "../../../../shared/components/ImageLightbox";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { formatDisplayDate, getMunicipioLabel, getPaymentLabel, getProofUrl } from "../utils/orderDisplay";
import "./OrderDetailContent.css";

/**
 * Contenido de "ver detalle" de un pedido — sin ningún wrapper (ni Modal,
 * ni layout de página). Se usa dentro de OrderDetailModal (Pedidos).
 * 
 * @param {object} props
 * @param {object} props.order
 */
export default function OrderDetailContent({ order }) {
  const municipioLabel = getMunicipioLabel(order.municipio);
  const paymentLabel = getPaymentLabel(order.medioPago);
  const proofUrl = getProofUrl(order.comprobante);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [evidenceLightboxOpen, setEvidenceLightboxOpen] = useState(false);

  // Extraemos la evidencia (puede venir como order.evidence o dentro de order)
  const evidence = order.evidence;

  return (
    <div className="order-detail-content">
      <div className="order-detail-top">
        <OrderStatusBadge status={order.estado} />
        <span className="order-detail-date">
          <i className="fa-solid fa-calendar" /> {formatDisplayDate(order.fecha)}
        </span>
      </div>

      {order.estado === "cancelado" && order.motivoCancelacion && (
        <div className="detail-section cancel-reason-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-circle-xmark" />
            Motivo de cancelación
          </div>
          <div className="order-detail-value">{order.motivoCancelacion}</div>
          {order.fechaCancelacion && (
            <div className="order-detail-label" style={{ marginTop: "8px" }}>
              Cancelado el {formatDisplayDate(order.fechaCancelacion)}
            </div>
          )}
        </div>
      )}

      {/* --- 1. Datos del cliente y entrega --- */}
      <div className="detail-section">
        <div className="detail-section-title">
          <i className="fa-solid fa-truck-fast" />
          Datos de entrega
        </div>
        <div className="order-detail-grid">
          <div>
            <div className="order-detail-label">Cliente</div>
            <div className="order-detail-value">{order.cliente}</div>
          </div>
          <div>
            <div className="order-detail-label">Municipio</div>
            <div className="order-detail-value">{municipioLabel}</div>
          </div>
          <div className="order-detail-grid-full">
            <div className="order-detail-label">Dirección</div>
            <div className="order-detail-value">{order.direccion || "—"}</div>
          </div>
          {order.instrucciones && (
            <div className="order-detail-grid-full">
              <div className="order-detail-label">Instrucciones de entrega</div>
              <div className="order-detail-value">{order.instrucciones}</div>
            </div>
          )}
        </div>
      </div>

      {/* --- 2. Productos --- */}
      <div className="detail-section">
        <div className="detail-section-title">
          <i className="fa-solid fa-box" />
          Productos
        </div>

        <div className="order-detail-products">
          {order.products.map((line) => (
            <div key={line.lineId} className="order-detail-product-row">
              <div>
                <div className="order-detail-product-name">
                  {line.productName} <span>x{line.units}</span>
                </div>
                <div className="order-detail-product-meta">
                  <span>{line.quantity} fresas</span>
                  <span className="order-detail-product-color">
                    <span className="color-dot" style={{ backgroundColor: line.colorHex }} />
                    {line.color}
                  </span>
                </div>
                {(line.decorativeMessage || line.extraCustomization) && (
                  <div className="order-detail-product-note">
                    {line.decorativeMessage && <span>“{line.decorativeMessage}”</span>}
                    {line.extraCustomization && <span>{line.extraCustomization}</span>}
                  </div>
                )}
              </div>
              <div className="order-detail-product-price">{formatPrice(line.unitPrice * line.units)}</div>
            </div>
          ))}
        </div>

        {order.cardMessage && (
          <div className="order-detail-card-message">
            <i className="fa-solid fa-envelope" />
            <div>
              <div className="order-detail-label">Mensaje para la tarjeta</div>
              <div className="order-detail-value">{order.cardMessage}</div>
            </div>
          </div>
        )}
      </div>

      {/* --- Totales (van justo después de los productos) --- */}
      <div className="order-detail-totals">
        <div>
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div>
          <span>Envío</span>
          <span>{formatPrice(order.shippingCost)}</span>
        </div>
        <div className="order-detail-total-row">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* --- 3. Información de pago --- */}
      <div className="detail-section">
        <div className="detail-section-title">
          <i className="fa-solid fa-credit-card" />
          Información de pago
        </div>
        <div className="order-detail-grid">
          <div>
            <div className="order-detail-label">Medio de pago</div>
            <div className="order-detail-value">{paymentLabel}</div>
          </div>
          <div>
            <div className="order-detail-label">Comprobante</div>
            {proofUrl ? (
              <button type="button" className="order-detail-proof-link" onClick={() => setLightboxOpen(true)}>
                <img src={proofUrl} alt="Comprobante de pago" className="order-detail-proof-thumb" />
              </button>
            ) : (
              <div className="order-detail-value order-detail-muted">Sin comprobante adjunto</div>
            )}
          </div>
        </div>
      </div>

      {/* --- 4. Evidencia de entrega --- */}
      <div className="detail-section">
        <div className="detail-section-title">
          <i className="fa-solid fa-clipboard-check" />
          Evidencia de entrega
        </div>

        {!evidence ? (
          <div className="order-detail-muted">
            Este pedido todavía no cuenta con evidencia de entrega registrada.
          </div>
        ) : (
          <>
            <div className="order-detail-label" style={{ marginTop: "8px" }}>Fecha y hora registrada</div>
            <div className="order-detail-value" style={{ marginBottom: 12 }}>
              {evidence.deliveredAt ? formatDisplayDate(evidence.deliveredAt) : "—"}
            </div>

            <div className="order-detail-label">Observaciones del repartidor</div>
            <div className="delivery-evidence-comments" style={{ padding: "10px", background: "var(--secundario-3, #f9f9f9)", borderRadius: "8px", marginTop: "4px", marginBottom: "12px" }}>
              {evidence.comments || "Sin observaciones registradas."}
            </div>

            <div className="order-detail-label" style={{ marginTop: 14 }}>
              Foto de evidencia
            </div>
            {evidence.photoUrl ? (
              <button 
                type="button" 
                className="order-detail-proof-link" 
                onClick={() => setEvidenceLightboxOpen(true)}
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "block", marginTop: "4px" }}
              >
                <img
                  className="delivery-evidence-photo order-detail-proof-thumb"
                  src={evidence.photoUrl}
                  alt={`Evidencia de entrega del pedido #${order.id}`}
                  style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px" }}
                />
              </button>
            ) : (
              <div className="order-detail-muted" style={{ marginTop: "4px" }}>
                <i className="fa-solid fa-image" /> Sin foto de evidencia
              </div>
            )}
          </>
        )}
      </div>

      {/* Visor para comprobante de pago */}
      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={proofUrl}
        alt="Comprobante de pago"
      />

      {/* Visor para foto de evidencia de entrega */}
      {evidence && evidence.photoUrl && (
        <ImageLightbox
          open={evidenceLightboxOpen}
          onClose={() => setEvidenceLightboxOpen(false)}
          src={evidence.photoUrl}
          alt={`Evidencia de entrega del pedido #${order.id}`}
        />
      )}
    </div>
  );
}