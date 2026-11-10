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
 * @param {() => void} [props.onUploadPayment]
 * @param {boolean} [props.canManagePayments]
 * @param {boolean} [props.canUploadPayments]
 * @param {number|string|null} [props.paymentSavingId]
 * @param {boolean} [props.uploadingPayment]
 */
export default function OrderDetailModal({
  open,
  onClose,
  order,
  onReprogram,
  reprogramming = false,
  onApprovePayment,
  onRejectPayment,
  onUploadPayment,
  canManagePayments = false,
  canUploadPayments = false,
  paymentSavingId = null,
  uploadingPayment = false,
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
        onUploadPayment={onUploadPayment}
        canManagePayments={canManagePayments}
        canUploadPayments={canUploadPayments}
        paymentSavingId={paymentSavingId}
        uploadingPayment={uploadingPayment}
      />
    </Modal>
  );
}
