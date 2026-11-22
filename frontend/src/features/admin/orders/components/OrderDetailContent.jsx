// src/features/admin/orders/components/OrderDetailContent.jsx
import { useState } from "react";
import OrderStatusBadge from "./OrderStatusBadge";
import PaymentInfo from "./PaymentInfo";
import ReprogramDeliveryControl from "./ReprogramDeliveryControl";
import ImageLightbox from "../../../../shared/components/ImageLightbox";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import {
  formatDisplayDate,
  getInitials,
  getProofUrl,
} from "../utils/orderDisplay";
import "./OrderDetailContent.css";

/**
 * Contenido de "ver detalle" de un pedido — sin ningún wrapper (ni Modal,
 * ni layout de página). La gestión de comprobantes vive en su propio modal.
 *
 * @param {object} props
 * @param {object} props.order
 * @param {(fechaEntrega: string) => Promise<void>} [props.onReprogram]
 * @param {boolean} [props.reprogramming]
 */
export default function OrderDetailContent({
  order,
  onReprogram,
  reprogramming = false,
}) {
  const [evidenceLightboxOpen, setEvidenceLightboxOpen] = useState(false);

  if (!order) return null;

  const evidenceUrl = getProofUrl(order.evidenciaEntrega);
  const hasDeliveryNotes =
    order.estado !== "cancelado" && Boolean(order.observacionesEntrega);
  const hasEvidence = Boolean(evidenceUrl || hasDeliveryNotes);

  return (
    <div className="order-detail-content">
      {/* --- Encabezado: cliente, estado, fecha y total --- */}
      <div className="order-detail-hero">
        <div className="order-detail-hero-main">
          <div className="order-detail-avatar">{getInitials(order.cliente)}</div>
          <div className="order-detail-hero-info">
            <div className="order-detail-hero-name">{order.cliente}</div>
            <div className="order-detail-hero-id">
              N. identificación:{" "}
              <strong>{order.clienteIdentificacion || "—"}</strong>
            </div>
            {(order.clienteCorreo || order.clienteTelefono) && (
              <div className="order-detail-hero-id">
                {[order.clienteCorreo, order.clienteTelefono]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
          </div>
        </div>

        <div className="order-detail-hero-side">
          <div className="order-detail-status-block">
            <OrderStatusBadge status={order.estado} />
            <ReprogramDeliveryControl
              key={order.id}
              order={order}
              onReprogram={onReprogram}
              submitting={reprogramming}
            />
          </div>
          <div className="order-detail-dates">
            <span className="order-detail-date">
              <i className="fa-solid fa-clock" /> Creación:{" "}
              {formatDisplayDate(order.fecha)}
            </span>
            <span className="order-detail-date">
              <i className="fa-solid fa-calendar" /> Entrega:{" "}
              {formatDisplayDate(order.fechaEntrega)}
            </span>
          </div>
          <div className="order-detail-hero-total">
            <span className="order-detail-hero-total-label">Total</span>
            <strong className="order-detail-hero-total-value">
              {formatPrice(order.total)}
            </strong>
          </div>
        </div>
      </div>

      {order.estado === "rechazado" && order.motivoRechazo && (
        <div className="detail-section cancel-reason-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-circle-xmark" />
            Motivo del rechazo
          </div>
          <div className="order-detail-value">{order.motivoRechazo}</div>
        </div>
      )}

      {order.estado === "cancelado" && (
        <div className="detail-section cancel-reason-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-ban" />
            Motivo de la cancelación
          </div>
          <div className="order-detail-value">
            {order.observacionesEntrega || "Sin motivo registrado."}
          </div>
        </div>
      )}

      {/* --- Fila 1: Datos de entrega | Evidencia de entrega --- */}
      <div className="order-detail-row">
        <div className="detail-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-truck-fast" />
            Datos de entrega
          </div>

          <div className="order-detail-subsection">
            <div className="order-detail-subsection-title">
              Dirección de entrega
            </div>
            <div className="order-detail-grid order-detail-grid--wide-first">
              <div>
                <div className="order-detail-label">Dirección</div>
                <div className="order-detail-value">
                  {order.direccion || "—"}
                </div>
              </div>
              <div>
                <div className="order-detail-label">Municipio</div>
                <div className="order-detail-value">
                  {order.municipio || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="order-detail-subsection">
            <div className="order-detail-subsection-title">Recepción</div>
            <div className="order-detail-grid order-detail-grid--wide-first">
              <div>
                <div className="order-detail-label">Quién recibe</div>
                <div className="order-detail-value">
                  {order.nombreReceptor || "—"}
                </div>
              </div>
              <div>
                <div className="order-detail-label">Teléfono</div>
                <div className="order-detail-value">
                  {order.telefonoReceptor || "—"}
                </div>
              </div>
            </div>
          </div>

          {order.instruccionesEntrega && (
            <div className="order-detail-subsection">
              <div className="order-detail-subsection-title">Instrucciones</div>
              <div className="order-detail-value">
                {order.instruccionesEntrega}
              </div>
            </div>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-clipboard-check" />
            Evidencia de entrega
          </div>

          {!hasEvidence ? (
            <div className="order-detail-empty">
              <i className="fa-solid fa-image" />
              <span>
                Este pedido todavía no cuenta con evidencia de entrega
                registrada.
              </span>
            </div>
          ) : (
            <div className="order-detail-evidence">
              <div className="order-detail-evidence-photo">
                <div className="order-detail-label">Foto de evidencia</div>
                {evidenceUrl ? (
                  <button
                    type="button"
                    className="order-detail-proof-link"
                    onClick={() => setEvidenceLightboxOpen(true)}
                  >
                    <img
                      className="delivery-evidence-photo order-detail-proof-thumb"
                      src={evidenceUrl}
                      alt={`Evidencia de entrega del pedido #${order.id}`}
                    />
                  </button>
                ) : (
                  <div className="order-detail-evidence-nophoto">
                    <i className="fa-solid fa-image" />
                    <span>Sin foto de evidencia</span>
                  </div>
                )}
              </div>

              {order.estado !== "cancelado" && (
                <div className="order-detail-evidence-notes">
                  <div className="order-detail-label">
                    Observaciones del repartidor
                  </div>
                  <div className="delivery-evidence-comments">
                    {order.observacionesEntrega ||
                      "Sin observaciones registradas."}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- Fila 2: Productos (con totales) | Información de pago --- */}
      <div className="order-detail-row order-detail-row--top">
        <div className="detail-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-box" />
            Productos
          </div>

          {order.lineas.length === 0 ? (
            <div className="order-detail-muted">
              Este pedido no tiene líneas.
            </div>
          ) : (
            <div className="order-detail-products">
              {order.lineas.map((linea) => (
                <div
                  key={linea.id ?? linea.lineId}
                  className="order-detail-product-row"
                >
                  <div>
                    <div className="order-detail-product-name">
                      {linea.productoNombre} <span>x{linea.unidades}</span>
                    </div>
                    <div className="order-detail-product-meta">
                      <span>{linea.cantidadFresas} fresas</span>
                      <span className="order-detail-product-color">
                        <span
                          className="color-dot"
                          style={{
                            backgroundColor: linea.colorHex || "transparent",
                          }}
                        />
                        {linea.colorNombre || "—"}
                      </span>
                    </div>
                    {linea.letrasFresas && (
                      <div className="order-detail-product-note">
                        <span>Letras: “{linea.letrasFresas}”</span>
                      </div>
                    )}
                    {linea.mensajeTarjeta && (
                      <div className="order-detail-product-note">
                        <span>Tarjeta: “{linea.mensajeTarjeta}”</span>
                      </div>
                    )}
                  </div>
                  <div className="order-detail-product-price">
                    {formatPrice(linea.precioUnitario * linea.unidades)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- Totales --- */}
          <div className="order-detail-totals">
            <div>
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div>
              <span>Envío</span>
              <span>
                {formatPrice(order.shippingCost ?? order.precioDomicilio)}
              </span>
            </div>
            <div className="order-detail-total-row">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-credit-card" />
            Información de pago
          </div>

          <PaymentInfo order={order} />
        </div>
      </div>

      {/* Visor para foto de evidencia de entrega */}
      {evidenceUrl && (
        <ImageLightbox
          open={evidenceLightboxOpen}
          onClose={() => setEvidenceLightboxOpen(false)}
          src={evidenceUrl}
          alt={`Evidencia de entrega del pedido #${order.id}`}
        />
      )}
    </div>
  );
}