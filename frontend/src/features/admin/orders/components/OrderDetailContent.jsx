// src/features/admin/orders/components/OrderDetailContent.jsx
import { useState } from "react";
import OrderStatusBadge from "./OrderStatusBadge";
import ReprogramDeliveryControl from "./ReprogramDeliveryControl";
import ImageLightbox from "../../../../shared/components/ImageLightbox";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import {
  formatDisplayDate,
  getInitials,
  getProofUrl,
} from "../utils/orderDisplay";
import "./OrderDetailContent.css";

const COMPROBANTE_COLORS = {
  Pendiente: { color: "#B45309", background: "#F59E0B1F" },
  Aprobado: { color: "#1B5E3F", background: "#E7F7EE" },
  Rechazado: { color: "#B91C1C", background: "#FEE2E2" },
};

/**
 * Contenido de "ver detalle" de un pedido — sin ningún wrapper (ni Modal,
 * ni layout de página). Se usa dentro de OrderDetailModal (Pedidos).
 *
 * @param {object} props
 * @param {object} props.order
 * @param {(fechaEntrega: string) => Promise<void>} [props.onReprogram]
 * @param {boolean} [props.reprogramming]
 * @param {(comprobante: object) => void} [props.onApprovePayment]
 * @param {(comprobante: object) => void} [props.onRejectPayment]
 * @param {boolean} [props.canManagePayments]
 * @param {number|string|null} [props.paymentSavingId]
 */
export default function OrderDetailContent({
  order,
  onReprogram,
  reprogramming = false,
  onApprovePayment,
  onRejectPayment,
  canManagePayments = false,
  paymentSavingId = null,
}) {
  const [activeReceiptUrl, setActiveReceiptUrl] = useState(null);
  const [evidenceLightboxOpen, setEvidenceLightboxOpen] = useState(false);

  if (!order) return null;

  const comprobantes = order.comprobantes ?? [];
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

          {comprobantes.length === 0 ? (
            <div className="order-detail-value order-detail-muted">
              Sin comprobantes adjuntos
            </div>
          ) : (
            <div className="order-detail-receipt-list">
              {comprobantes.map((comprobante) => {
                const receiptUrl = getProofUrl(comprobante.url);
                const colors =
                  COMPROBANTE_COLORS[comprobante.estado] ??
                  COMPROBANTE_COLORS.Pendiente;
                const saving =
                  String(paymentSavingId) === String(comprobante.id);

                return (
                  <div
                    key={comprobante.id}
                    className="order-detail-receipt"
                  >
                    {receiptUrl ? (
                      <button
                        type="button"
                        className="order-detail-proof-link"
                        title="Ver comprobante"
                        onClick={() => setActiveReceiptUrl(receiptUrl)}
                      >
                        <img
                          src={receiptUrl}
                          alt={`Comprobante #${comprobante.id}`}
                          className="order-detail-proof-thumb"
                        />
                      </button>
                    ) : (
                      <div className="order-detail-proof-thumb order-detail-muted">
                        Sin imagen
                      </div>
                    )}

                    <div className="order-detail-receipt-body">
                      <div className="order-detail-receipt-head">
                        <span
                          className="order-detail-receipt-status"
                          style={{
                            color: colors.color,
                            backgroundColor: colors.background,
                          }}
                        >
                          {comprobante.estado}
                        </span>
                        <span className="order-detail-receipt-date">
                          {formatDisplayDate(comprobante.fecha)}
                        </span>
                      </div>

                      <div className="order-detail-receipt-line">
                        <span>
                          {comprobante.estado === "Rechazado"
                            ? "Valor entregado"
                            : "Monto verificado"}
                        </span>
                        <strong>
                          {comprobante.monto === null
                            ? "Sin verificar"
                            : formatPrice(comprobante.monto)}
                        </strong>
                      </div>

                      {comprobante.motivoRechazo && (
                        <div className="order-detail-receipt-reason">
                          <strong>Motivo:</strong> {comprobante.motivoRechazo}
                        </div>
                      )}

                      {canManagePayments &&
                        order.estado === "pendiente" &&
                        comprobante.estado === "Pendiente" && (
                          <div className="order-detail-receipt-actions">
                            {Number(order.saldo) > 0 && (
                              <button
                                type="button"
                                className="order-detail-receipt-btn approve"
                                disabled={saving}
                                onClick={() => onApprovePayment?.(comprobante)}
                              >
                                <i className="fa-solid fa-check" /> Aprobar
                              </button>
                            )}
                            <button
                              type="button"
                              className="order-detail-receipt-btn reject"
                              disabled={saving}
                              onClick={() => onRejectPayment?.(comprobante)}
                            >
                              <i className="fa-solid fa-xmark" /> Rechazar
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="order-detail-payment-summary">
            <div>
              <span>Total pagado</span>
              <strong>{formatPrice(order.totalPagado ?? 0)}</strong>
            </div>
            <div>
              <span>{order.saldo < 0 ? "Saldo a favor" : "Saldo pendiente"}</span>
              <strong className={order.saldo > 0 ? "pending" : "paid"}>
                {formatPrice(Math.abs(order.saldo ?? 0))}
              </strong>
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
              {order.estado !== "cancelado" && (
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
                </>
              )}

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
        open={Boolean(activeReceiptUrl)}
        onClose={() => setActiveReceiptUrl(null)}
        src={activeReceiptUrl}
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
