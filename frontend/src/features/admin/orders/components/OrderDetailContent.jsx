// src/features/admin/orders/components/OrderDetailContent.jsx
import { useState } from "react";
import OrderStatusBadge from "./OrderStatusBadge";
import ImageLightbox from "../../../../shared/components/ImageLightbox";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import {
  formatDisplayDate,
  getInitials,
  getProofUrl,
  isPdfProof,
} from "../utils/orderDisplay";
import "./OrderDetailContent.css";

/**
 * Contenido de "ver detalle" de un pedido — sin ningún wrapper (ni Modal,
 * ni layout de página). Se usa dentro de OrderDetailModal (Pedidos).
 *
 * @param {object} props
 * @param {object} props.order
 */
export default function OrderDetailContent({ order }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [evidenceLightboxOpen, setEvidenceLightboxOpen] = useState(false);

  if (!order) return null;

  const proofUrl = getProofUrl(order.comprobante);
  const proofIsPdf = isPdfProof(order.comprobante);
  const evidenceUrl = getProofUrl(order.evidenciaEntrega);
  const hasEvidence = Boolean(evidenceUrl || order.observacionesEntrega);

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
          <OrderStatusBadge status={order.estado} />
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

      {/* --- 1. Datos de entrega --- */}
      <div className="detail-section">
        <div className="detail-section-title">
          <i className="fa-solid fa-truck-fast" />
          Datos de entrega
        </div>

        <div className="order-detail-subsection">
          <div className="order-detail-subsection-title">Dirección de entrega</div>
          <div className="order-detail-grid">
            <div className="order-detail-grid-full">
              <div className="order-detail-label">Dirección</div>
              <div className="order-detail-value">{order.direccion || "—"}</div>
            </div>
            <div>
              <div className="order-detail-label">Barrio</div>
              <div className="order-detail-value">{order.barrio || "—"}</div>
            </div>
            <div>
              <div className="order-detail-label">Municipio</div>
              <div className="order-detail-value">{order.municipio || "—"}</div>
            </div>
          </div>
        </div>

        <div className="order-detail-subsection">
          <div className="order-detail-subsection-title">Recepción</div>
          <div className="order-detail-grid">
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

      {/* --- 2. Productos --- */}
      <div className="detail-section">
        <div className="detail-section-title">
          <i className="fa-solid fa-box" />
          Productos
        </div>

        {order.lineas.length === 0 ? (
          <div className="order-detail-muted">Este pedido no tiene líneas.</div>
        ) : (
          <div className="order-detail-products">
            {order.lineas.map((linea) => (
              <div
                key={linea.id ?? linea.lineId}
                className="order-detail-product-row"
              >
                <div>
                  <div className="order-detail-product-name">
                    {linea.productoNombre}{" "}
                    <span>x{linea.unidades}</span>
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
                  {(linea.mensajePersonalizado ||
                    linea.personalizacionAdicional) && (
                    <div className="order-detail-product-note">
                      {linea.mensajePersonalizado && (
                        <span>“{linea.mensajePersonalizado}”</span>
                      )}
                      {linea.personalizacionAdicional && (
                        <span>{linea.personalizacionAdicional}</span>
                      )}
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

        {order.mensajeTarjeta && (
          <div className="order-detail-card-message">
            <i className="fa-solid fa-envelope" />
            <div>
              <div className="order-detail-label">Mensaje para la tarjeta</div>
              <div className="order-detail-value">{order.mensajeTarjeta}</div>
            </div>
          </div>
        )}
      </div>

      {/* --- Totales --- */}
      <div className="order-detail-totals">
        <div>
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div>
          <span>Envío</span>
          <span>{formatPrice(order.shippingCost ?? order.precioDomicilio)}</span>
        </div>
        <div className="order-detail-total-row">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* --- 3. Información de pago y evidencia de entrega --- */}
      <div className="order-detail-columns">
        <div className="detail-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-credit-card" />
            Información de pago
          </div>
          <div className="order-detail-grid">
            <div>
              <div className="order-detail-label">Comprobante</div>
              {proofUrl ? (
                proofIsPdf ? (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="order-detail-proof-pdf"
                  >
                    <i className="fa-solid fa-file-pdf" />
                    Ver comprobante PDF
                  </a>
                ) : (
                  <button
                    type="button"
                    className="order-detail-proof-link"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={proofUrl}
                      alt="Comprobante de pago"
                      className="order-detail-proof-thumb"
                    />
                  </button>
                )
              ) : (
                <div className="order-detail-value order-detail-muted">
                  Sin comprobante adjunto
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">
            <i className="fa-solid fa-clipboard-check" />
            Evidencia de entrega
          </div>

          {!hasEvidence ? (
            <div className="order-detail-muted">
              Este pedido todavía no cuenta con evidencia de entrega registrada.
            </div>
          ) : (
            <>
              <div className="order-detail-label" style={{ marginTop: "8px" }}>
                Observaciones del repartidor
              </div>
              <div
                className="delivery-evidence-comments"
                style={{
                  padding: "10px",
                  background: "var(--secundario-3, #f9f9f9)",
                  borderRadius: "8px",
                  marginTop: "4px",
                  marginBottom: "12px",
                }}
              >
                {order.observacionesEntrega || "Sin observaciones registradas."}
              </div>

              <div className="order-detail-label" style={{ marginTop: 14 }}>
                Foto de evidencia
              </div>
              {evidenceUrl ? (
                <button
                  type="button"
                  className="order-detail-proof-link"
                  onClick={() => setEvidenceLightboxOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  <img
                    className="delivery-evidence-photo order-detail-proof-thumb"
                    src={evidenceUrl}
                    alt={`Evidencia de entrega del pedido #${order.id}`}
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
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
      </div>

      {/* Visor para comprobante de pago */}
      <ImageLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={proofUrl}
        alt="Comprobante de pago"
      />

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
