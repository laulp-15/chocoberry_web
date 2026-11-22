// src/features/admin/orders/components/OrderPaymentsModal.jsx
import Modal from "../../../../shared/components/Modal";
import PaymentInfo from "./PaymentInfo";

/**
 * Modal para revisar, aprobar, devolver y subir comprobantes de un pedido.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} props.order
 * @param {boolean} [props.canManagePayments]
 * @param {boolean} [props.canUploadPayments]
 * @param {number|string|null} [props.paymentSavingId]
 * @param {boolean} [props.uploadingPayment]
 * @param {(comprobante: object) => void} [props.onApprovePayment]
 * @param {(comprobante: object) => void} [props.onReturnPayment]
 * @param {() => void} [props.onUploadPayment]
 */
export default function OrderPaymentsModal({
  open,
  onClose,
  order,
  canManagePayments = false,
  canUploadPayments = false,
  paymentSavingId = null,
  uploadingPayment = false,
  onApprovePayment,
  onReturnPayment,
  onUploadPayment,
}) {
  if (!order) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Comprobantes del pedido #${order.id}`}
      maxWidth="md"
    >
      <PaymentInfo
        order={order}
        interactive
        canManagePayments={canManagePayments}
        canUploadPayments={canUploadPayments}
        paymentSavingId={paymentSavingId}
        uploadingPayment={uploadingPayment}
        onApprovePayment={onApprovePayment}
        onReturnPayment={onReturnPayment}
        onUploadPayment={onUploadPayment}
      />
    </Modal>
  );
}
