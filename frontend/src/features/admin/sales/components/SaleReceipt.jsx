// src/features/admin/sales/components/SaleReceipt.jsx
import { useState } from "react";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { formatDisplayDate, getProofUrl, isPdfProof } from "../../orders/utils/orderDisplay";
import OrderStatusBadge from "../../orders/components/OrderStatusBadge";
import ImageLightbox from "../../../../shared/components/ImageLightbox";
import "./SaleReceipt.css";

function getInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Presentación de "ver venta": tarjeta de cliente/pago + total destacado
 * arriba, tabla de productos abajo. Misma data que OrderDetailContent
 * (Pedidos), pero organizada distinto porque aquí el foco es el comprobante.
 *
 * @param {object} props
 * @param {object} props.sale
 */
export default function SaleReceipt({ sale }) {
  const municipioLabel = sale.municipio || "—";
  const comprobantes = sale.comprobantes ?? [];
  const [activeProof, setActiveProof] = useState(null);

  return (
    <div className="sale-receipt">
      {/* --- Cliente/Pago + Total --- */}
      <div className="sale-top-row">
        <div className="sale-info-card">
          <div className="sale-info-col">
            <div className="sale-info-label">Cliente</div>
            <div className="sale-client">
              <div className="sale-client-avatar">{getInitials(sale.cliente)}</div>
              <div>
                <div className="sale-client-name">{sale.cliente}</div>
                <div className="sale-client-sub">{municipioLabel}</div>
              </div>
            </div>
          </div>

          <div className="sale-info-col">
            <div className="sale-info-label">Estado de la venta</div>
            <OrderStatusBadge status={sale.estado} title="Estado de la venta" />
          </div>

          <div className="sale-info-col sale-info-col-full">
            <div className="sale-info-label">Fecha de venta</div>
            <div className="sale-info-value">{formatDisplayDate(sale.fecha)}</div>
          </div>
        </div>

        <div className="sale-total-card">
          <div className="sale-total-label">Total de la venta</div>
          <div className="sale-total-value">{formatPrice(sale.total)}</div>
          <div className="sale-total-caption">Incluye envío</div>
        </div>
      </div>

      {/* --- Productos --- */}
      <div className="sale-products-card">
        <h2 className="sale-products-title">Resumen de Productos</h2>

        <div className="sale-products-table">
          <div className="sale-products-head">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Precio unitario</span>
            <span>Subtotal</span>
          </div>

          {sale.products.map((line) => {
            const image = line.productImage;
            const personalization = [
              line.color && `Color ${line.color}`,
              line.decorativeMessage && `“${line.decorativeMessage}”`,
              line.extraCustomization,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div key={line.lineId} className="sale-products-row">
                <div className="sale-product-cell">
                  <div className="sale-product-thumb">
                    {image ? <img src={image} alt={line.productName} /> : <i className="fa-solid fa-image" />}
                  </div>
                  <div>
                    <div className="sale-product-name">{line.productName}</div>
                    {personalization && <div className="sale-product-personalization">{personalization}</div>}
                  </div>
                </div>
                <span className="sale-products-qty">{line.units}</span>
                <span>{formatPrice(line.unitPrice)}</span>
                <span className="sale-products-subtotal">{formatPrice(line.unitPrice * line.units)}</span>
              </div>
            );
          })}
        </div>

        <div className="sale-products-totals">
          <div className="sale-totals-row">
            <span>Subtotal</span>
            <span>{formatPrice(sale.subtotal)}</span>
          </div>
          <div className="sale-totals-row">
            <span>Envío</span>
            <span>{formatPrice(sale.shippingCost)}</span>
          </div>
          <div className="sale-totals-row sale-totals-final">
            <span>Total</span>
            <span>{formatPrice(sale.total)}</span>
          </div>
        </div>
      </div>

      <div className="sale-proof-card">
        <div className="sale-info-label">Comprobantes de pago</div>
        {comprobantes.length === 0 ? (
          <span className="sale-proof-empty">Sin comprobante adjunto</span>
        ) : (
          <div className="sale-proof-list">
            {comprobantes.map((comprobante) => {
              const proofUrl = getProofUrl(comprobante.url);
              const proofIsPdf = isPdfProof(comprobante.url);
              const estadoClass = (comprobante.estado || "pendiente").toLowerCase();

              return (
                <div key={comprobante.id} className="sale-proof-item">
                  {proofUrl ? (
                    proofIsPdf ? (
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="sale-proof-pdf"
                      >
                        <i className="fa-solid fa-file-pdf" />
                        Ver PDF
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="sale-proof-link"
                        onClick={() =>
                          setActiveProof({
                            url: proofUrl,
                            alt: `Comprobante #${comprobante.id}`,
                          })
                        }
                      >
                        <img
                          src={proofUrl}
                          alt={`Comprobante #${comprobante.id}`}
                          className="sale-proof-thumb"
                        />
                      </button>
                    )
                  ) : (
                    <span className="sale-proof-thumb sale-proof-thumb-empty">
                      <i className="fa-solid fa-image" />
                    </span>
                  )}

                  <div className="sale-proof-info">
                    <div className="sale-proof-head">
                      <span className={`sale-proof-status sale-proof-status--${estadoClass}`}>
                        {comprobante.estado}
                      </span>
                      <span className="sale-proof-date">
                        {formatDisplayDate(comprobante.fecha)}
                      </span>
                    </div>
                    <div className="sale-proof-amount">
                      <span>
                        {comprobante.estado === "Rechazado"
                          ? "Valor entregado"
                          : "Monto verificado"}
                      </span>
                      <strong>
                        {comprobante.monto === null
                          ? "Pendiente de verificación"
                          : formatPrice(comprobante.monto)}
                      </strong>
                    </div>
                    {comprobante.motivoRechazo && (
                      <div className="sale-proof-reason">
                        <strong>Motivo del rechazo:</strong> {comprobante.motivoRechazo}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ImageLightbox
        open={Boolean(activeProof)}
        onClose={() => setActiveProof(null)}
        src={activeProof?.url}
        alt={activeProof?.alt ?? "Comprobante de pago"}
      />
    </div>
  );
}