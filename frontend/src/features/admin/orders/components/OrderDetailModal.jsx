// src/features/admin/orders/components/OrderDetailModal.jsx
import Modal from "../../../../shared/components/Modal";
import OrderDetailContent from "./OrderDetailContent";

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} props.order
 * @param {(fechaEntrega: string) => Promise<void>} [props.onReprogram]
 * @param {boolean} [props.reprogramming]
 * @param {(comprobante: object) => void} [props.onApprovePayment]
 * @param {(comprobante: object) => void} [props.onRejectPayment]
 * @param {boolean} [props.canManagePayments]
 * @param {number|string|null} [props.paymentSavingId]
 */
export default function OrderDetailModal({
  open,
  onClose,
  order,
  onReprogram,
  reprogramming = false,
  onApprovePayment,
  onRejectPayment,
  canManagePayments = false,
  paymentSavingId = null,
}) {
  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Pedido #${order.id}`}
      maxWidth="md"
    >
      <OrderDetailContent
        order={order}
        onReprogram={onReprogram}
        reprogramming={reprogramming}
        onApprovePayment={onApprovePayment}
        onRejectPayment={onRejectPayment}
        canManagePayments={canManagePayments}
        paymentSavingId={paymentSavingId}
      />
    </Modal>
  );
}
