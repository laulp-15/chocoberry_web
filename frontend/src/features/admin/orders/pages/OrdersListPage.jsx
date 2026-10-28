// src/features/admin/orders/pages/OrdersListPage.jsx
import { useState } from "react";
import DataTable from "../../../../shared/components/DataTable";
import FormSelect from "../../../../shared/components/FormSelect";
import OrderStatusSelector from "../components/OrderStatusSelector";
import OrderFormModal from "../components/OrderFormModal";
import OrderDetailModal from "../components/OrderDetailModal";
import ApprovePaymentModal from "../components/ApprovePaymentModal";
import RejectPaymentModal from "../components/RejectPaymentModal";
import RejectReasonModal from "../components/RejectReasonModal";
import OrderNotification from "../components/OrderNotification";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useOrders from "../hooks/useOrders";
import useOrderFormOptions from "../hooks/useOrderFormOptions";
import {
  ORDER_STATUSES,
  getStatusMeta,
  isFinalStatus,
} from "../data/orderStatus";
import { formatDisplayDate } from "../utils/orderDisplay";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "../../../../shared/css/adminCrud.css";

// Las seis columnas de datos comparten el mismo ancho; Acciones se reserva
// aparte para que el encabezado y los iconos queden juntos a la derecha.
const EQUAL_COLUMN_STYLE = {
  width: "calc((100% - 112px) / 6)",
  boxSizing: "border-box",
};

export default function OrdersListPage() {
  const { can } = usePermissions();
  const canCreate = can("Pedidos", "Crear");
  const canEditOrder = can("Pedidos", "Editar");
  const canChangeStatus = can("Pedidos", "Cambiar estado");

  const {
    orders,
    loading,
    error,
    reload,
    submitting,
    statusSavingId,
    rejectSubmitting,
    reprogrammingId,
    paymentSavingId,
    createOrder,
    updateOrder,
    changeStatus,
    rejectOrder,
    approvePayment,
    rejectPayment,
    reprogramOrder,
  } = useOrders();

  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  // Pedido que se está rechazando: se pide el motivo antes de aplicar el estado.
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectError, setRejectError] = useState("");

  const [approvingPayment, setApprovingPayment] = useState(null); // { order, comprobante }
  const [paymentError, setPaymentError] = useState("");
  const [rejectingPayment, setRejectingPayment] = useState(null); // { order, comprobante }

  const [notification, setNotification] = useState(null); // { message, variant }

  // Los catálogos se recargan cada vez que se abre el formulario para que los
  // maestros recién creados aparezcan sin recargar la página.
  const {
    clientes,
    municipios,
    productos,
    presentaciones,
    glaseados,
    loading: optionsLoading,
    error: optionsError,
    reload: reloadOptions,
  } = useOrderFormOptions();

  const filtered = orders.filter(
    (order) => !statusFilter || order.estado === statusFilter
  );

  // El estado final bloquea el selector; la edición solo está permitida
  // mientras el pedido siga pendiente (todavía no es una venta).
  const isLocked = (order) => isFinalStatus(order.estado);
  const isEditable = (order) => canEditOrder && order.estado === "pendiente";
  const isRejectable = (order) => canChangeStatus && order.estado === "pendiente";

  const handleCreate = () => {
    if (!canCreate) return;
    reloadOptions();
    setEditingOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order) => {
    if (!isEditable(order)) return;
    reloadOptions();
    setEditingOrder(order);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingOrder(null);
  };

  const handleSave = async (datos) => {
    if (editingOrder) {
      await updateOrder(editingOrder.id, datos);
      setNotification({ message: "Pedido actualizado correctamente." });
    } else {
      await createOrder(datos);
      setNotification({ message: "Pedido creado correctamente." });
    }
    handleCloseForm();
  };

  // Cambio de estado desde el desplegable. "Rechazado" no se aplica directo:
  // primero se pide el motivo (mismo flujo que el icono "Rechazar pedido").
  const handleStatusChange = async (order, newStatus) => {
    if (!canChangeStatus) return;

    if (newStatus === "rechazado") {
      if (!isRejectable(order)) return;
      setRejectError("");
      setRejectingOrder(order);
      return;
    }

    try {
      await changeStatus(order.id, newStatus);
      setNotification({
        message: `El pedido pasó a "${getStatusMeta(newStatus).label}".`,
      });
    } catch (err) {
      setNotification({
        message: err?.message || "No se pudo cambiar el estado del pedido.",
        variant: "error",
      });
    }
  };

  // Reprogramar no es una transición normal: solo aplica a un pedido cancelado
  // dentro de las 48 horas y lo devuelve directamente a "Despachado".
  const handleReprogram = async (order, fechaEntrega) => {
    try {
      const actualizado = await reprogramOrder(order.id, fechaEntrega);
      setDetailOrder(actualizado);
      setNotification({
        message: `Entrega reprogramada para el ${formatDisplayDate(
          fechaEntrega
        )}. El pedido pasó a "Despachado".`,
      });
    } catch (err) {
      setNotification({
        message: err?.message || "No se pudo reprogramar la entrega.",
        variant: "error",
      });
    }
  };

  const handleSubmitReject = async (reason) => {
    if (!canChangeStatus || !rejectingOrder) return;

    setRejectError("");
    try {
      await rejectOrder(rejectingOrder.id, reason);
      setRejectingOrder(null);
      setNotification({ message: "Pedido rechazado correctamente." });
    } catch (err) {
      setRejectError(err?.message || "No se pudo rechazar el pedido.");
    }
  };

  const handleOpenApprovePayment = (order, comprobante) => {
    setPaymentError("");
    setApprovingPayment({ order, comprobante });
  };

  const handleSubmitApprovePayment = async (monto) => {
    if (!approvingPayment) return;

    setPaymentError("");
    try {
      const { pedido, advertencia } = await approvePayment(
        approvingPayment.comprobante.id,
        monto
      );
      setDetailOrder(pedido);
      setApprovingPayment(null);
      setNotification({
        message:
          advertencia ||
          "Comprobante aprobado. Recuerda que el pedido sigue Pendiente.",
      });
    } catch (err) {
      setPaymentError(err?.message || "No se pudo aprobar el comprobante.");
    }
  };

  const handleOpenRejectPayment = (order, comprobante) => {
    setPaymentError("");
    setRejectingPayment({ order, comprobante });
  };

  const handleSubmitRejectPayment = async ({ motivo, monto }) => {
    if (!rejectingPayment) return;

    setPaymentError("");
    try {
      const pedido = await rejectPayment(
        rejectingPayment.comprobante.id,
        motivo,
        monto
      );
      setDetailOrder(pedido);
      setRejectingPayment(null);
      setNotification({
        message: "Comprobante de pago rechazado. El saldo fue actualizado.",
      });
    } catch (err) {
      setPaymentError(err?.message || "No se pudo rechazar el comprobante.");
    }
  };

  const columns = [
    {
      key: "cliente",
      label: "Cliente",
      style: EQUAL_COLUMN_STYLE,
    },
    {
      key: "direccion",
      label: "Dirección",
      style: EQUAL_COLUMN_STYLE,
      render: (row) => row.direccion || "—",
    },
    {
      key: "fecha",
      label: "Fecha de creación",
      style: EQUAL_COLUMN_STYLE,
      render: (row) => formatDisplayDate(row.fecha),
    },
    {
      key: "fechaEntrega",
      label: "Fecha de entrega",
      style: EQUAL_COLUMN_STYLE,
      render: (row) => formatDisplayDate(row.fechaEntrega),
    },
    {
      key: "total",
      label: "Total",
      style: EQUAL_COLUMN_STYLE,
      render: (row) => formatPrice(row.total),
    },
    {
      key: "estado",
      label: "Estado",
      style: EQUAL_COLUMN_STYLE,
      render: (row) => {
        const saving = String(statusSavingId) === String(row.id);
        return (
          <OrderStatusSelector
            status={row.estado}
            onChange={(newStatus) => handleStatusChange(row, newStatus)}
            disabled={!canChangeStatus || isLocked(row) || saving}
            lockedReason={
              !canChangeStatus
                ? "No tienes permiso para cambiar el estado."
                : saving
                  ? "Actualizando estado..."
                  : "Este pedido está en un estado final"
            }
            canReject={isRejectable(row)}
          />
        );
      },
    },
    {
      key: "actions",
      label: "Acciones",
      style: {
        width: "112px",
        boxSizing: "border-box",
        textAlign: "right",
        paddingRight: "2rem",
      },
      render: (row) => {
        const editable = isEditable(row);
        const saving = String(statusSavingId) === String(row.id);
        const rejectable = isRejectable(row);

        return (
          <div className="table-actions">
            <button
              type="button"
              className="table-action-btn"
              title="Ver detalle"
              onClick={() => setDetailOrder(row)}
            >
              <i className="fa-solid fa-eye" />
            </button>
            {canEditOrder && (
              <button
                type="button"
                className="table-action-btn"
                title={
                  editable
                    ? "Editar pedido"
                    : saving
                      ? "Actualizando estado..."
                      : "Solo se puede editar un pedido pendiente"
                }
                disabled={!editable || saving}
                style={{ opacity: editable && !saving ? 1 : 0.35 }}
                onClick={() => handleEdit(row)}
              >
                <i className="fa-solid fa-pen" />
              </button>
            )}
            {canChangeStatus && (
              <button
                type="button"
                className="table-action-btn danger"
                title={
                  rejectable
                    ? "Rechazar pedido"
                    : "Solo se puede rechazar un pedido pendiente"
                }
                disabled={!rejectable}
                style={{ opacity: rejectable ? 1 : 0.35 }}
                onClick={() => handleStatusChange(row, "rechazado")}
              >
                <i className="fa-solid fa-circle-xmark" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="crud-page">
      <DataTable
        title="Pedidos"
        description="Consulta y administra los pedidos reales del negocio."
        createLabel={canCreate ? "Crear pedido" : undefined}
        onCreate={canCreate ? handleCreate : undefined}
        columns={columns}
        data={filtered}
        tableLayout="fixed"
        searchPlaceholder="Buscar por cliente..."
        emptyMessage={
          loading ? "Cargando pedidos..." : "No hay pedidos para mostrar."
        }
        extraFilter={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: "200px",
            }}
          >
            <i
              className="fa-solid fa-filter"
              style={{ color: "var(--texto-muted, #888)" }}
              title="Filtrar"
            />
            <div style={{ flex: 1 }}>
              <FormSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Todos los estados"
                options={ORDER_STATUSES}
              />
            </div>
          </div>
        }
      />

      {error && (
        <p className="crud-error-hint" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {error}
          <button type="button" className="crud-retry" onClick={reload}>
            Reintentar
          </button>
        </p>
      )}

      {formOpen && (
        <OrderFormModal
          open
          onClose={handleCloseForm}
          initialData={editingOrder}
          onSubmit={handleSave}
          submitting={submitting}
          options={{
            clientes,
            municipios,
            productos,
            presentaciones,
            glaseados,
          }}
          optionsLoading={optionsLoading}
          optionsError={optionsError}
          onRetryOptions={reloadOptions}
        />
      )}

      {detailOrder && (
        <OrderDetailModal
          open
          onClose={() => setDetailOrder(null)}
          order={detailOrder}
          onReprogram={(fechaEntrega) =>
            handleReprogram(detailOrder, fechaEntrega)
          }
          reprogramming={String(reprogrammingId) === String(detailOrder.id)}
          onApprovePayment={(comprobante) =>
            handleOpenApprovePayment(detailOrder, comprobante)
          }
          onRejectPayment={(comprobante) =>
            handleOpenRejectPayment(detailOrder, comprobante)
          }
          canManagePayments={canChangeStatus}
          paymentSavingId={paymentSavingId}
        />
      )}

      {/* Motivo del rechazo (mismo flujo desde el desplegable y el icono) */}
      {rejectingOrder && (
        <RejectReasonModal
          open
          onClose={() => {
            setRejectingOrder(null);
            setRejectError("");
          }}
          onSubmit={handleSubmitReject}
          submitting={rejectSubmitting}
          formError={rejectError}
        />
      )}

      {approvingPayment && (
        <ApprovePaymentModal
          key={approvingPayment.comprobante.id}
          open
          onClose={() => {
            setApprovingPayment(null);
            setPaymentError("");
          }}
          onSubmit={handleSubmitApprovePayment}
          submitting={String(paymentSavingId) === String(approvingPayment.comprobante.id)}
          formError={paymentError}
          saldo={approvingPayment.order.saldo}
        />
      )}

      {rejectingPayment && (
        <RejectPaymentModal
          key={rejectingPayment.comprobante.id}
          open
          onClose={() => {
            setRejectingPayment(null);
            setPaymentError("");
          }}
          onSubmit={handleSubmitRejectPayment}
          submitting={String(paymentSavingId) === String(rejectingPayment.comprobante.id)}
          formError={paymentError}
          saldo={rejectingPayment.order.saldo}
        />
      )}

      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        title={notification?.variant === "error" ? "No se pudo completar" : undefined}
        message={notification?.message}
        variant={notification?.variant}
      />
    </div>
  );
}
