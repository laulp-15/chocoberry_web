// src/features/admin/orders/components/PaymentInfo.jsx
import { useState } from "react";
import ImageLightbox from "../../../../shared/components/ImageLightbox";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { formatDisplayDate, getProofUrl } from "../utils/orderDisplay";
import {
  getPaymentStatus,
  getReceiptAmountLabel,
  getReceiptAmountText,
  getReceiptStatusMeta,
} from "../utils/paymentDisplay";
import "./PaymentInfo.css";

/**
 * Lista de comprobantes y resumen de pago. En modo lectura se usa en el detalle
 * del pedido; en modo interactivo, dentro del modal de gestión de comprobantes.
 */
export default function PaymentInfo({
  order,
  interactive = false,
  canManagePayments = false,
  canUploadPayments = false,
  paymentSavingId = null,
  uploadingPayment = false,
  onApprovePayment,
  onReturnPayment,
  onUploadPayment,
}) {
  const [activeReceiptUrl, setActiveReceiptUrl] = useState(null);

  if (!order) return null;

  const comprobantes = order.comprobantes ?? [];
  const saldo = Math.max(0, Number(order.saldo ?? 0));
  const paymentStatus = getPaymentStatus(order.total, order.totalPagado);
  const canManageReceipt =
    interactive && canManagePayments && order.estado === "pendiente";

  return (
    <div className="payment-info">
      {comprobantes.length === 0 ? (
        <div className="order-detail-value order-detail-muted">
          Sin comprobantes adjuntos
        </div>
      ) : (
        <div className="order-detail-receipt-list">
          {comprobantes.map((comprobante) => {
            const receiptUrl = getProofUrl(comprobante.url);
            const status = getReceiptStatusMeta(comprobante.estado);
            const saving = String(paymentSavingId) === String(comprobante.id);
            const isReturned = comprobante.estado === "Devuelto";
            const amountText = getReceiptAmountText(comprobante);

            return (
              <div
                key={comprobante.id}
                className={`order-detail-receipt${isReturned ? " is-returned" : ""}`}
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
                        color: status.color,
                        backgroundColor: status.background,
                      }}
                    >
                      {status.label}
                    </span>
                    <span className="order-detail-receipt-date">
                      {formatDisplayDate(comprobante.fecha)}
                    </span>
                  </div>

                  <div className="order-detail-receipt-line">
                    <span>{getReceiptAmountLabel(comprobante.estado)}</span>
                    <strong>
                      {typeof amountText === "number"
                        ? formatPrice(amountText)
                        : amountText}
                    </strong>
                  </div>

                  {comprobante.motivoDevolucion && (
                    <div className="order-detail-receipt-reason">
                      <strong>Motivo de devolución:</strong>{" "}
                      {comprobante.motivoDevolucion}
                    </div>
                  )}

                  {canManageReceipt && comprobante.estado === "Pendiente" && (
                    <div className="order-detail-receipt-actions">
                      {saldo > 0 && (
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
                        onClick={() => onReturnPayment?.(comprobante)}
                      >
                        <i className="fa-solid fa-rotate-left" /> Devolver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {interactive &&
        canUploadPayments &&
        order.estado === "pendiente" &&
        order.puedeSubirComprobante && (
          <div className="order-detail-payment-actions">
            <button
              type="button"
              className="order-detail-receipt-btn upload"
              disabled={uploadingPayment}
              onClick={() => onUploadPayment?.()}
            >
              <i className="fa-solid fa-cloud-arrow-up" />
              {uploadingPayment ? "Subiendo..." : "Subir comprobante"}
            </button>
          </div>
        )}

      <div className="order-detail-payment-summary">
        <div>
          <span>Total del pedido</span>
          <strong>{formatPrice(order.total ?? 0)}</strong>
        </div>
        <div>
          <span>Total aprobado</span>
          <strong className="paid">
            {formatPrice(order.totalPagado ?? 0)}
          </strong>
        </div>
        <div>
          <span>Saldo pendiente</span>
          <strong className={saldo > 0 ? "pending" : "paid"}>
            {formatPrice(saldo)}
          </strong>
        </div>
        <div className="order-detail-payment-status">
          <span>Estado de pago</span>
          <span className={`payment-status-badge is-${paymentStatus.tone}`}>
            {paymentStatus.label}
          </span>
        </div>
      </div>

      <ImageLightbox
        open={Boolean(activeReceiptUrl)}
        onClose={() => setActiveReceiptUrl(null)}
        src={activeReceiptUrl}
        alt="Comprobante de pago"
      />
    </div>
  );
}
