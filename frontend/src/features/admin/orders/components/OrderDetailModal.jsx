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
 */
export default function OrderDetailModal({
  open,
  onClose,
  order,
  onReprogram,
  reprogramming = false,
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
      />
    </Modal>
  );
}
