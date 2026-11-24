// src/features/admin/orders/pages/OrdersListPage.jsx
import { useState } from "react";
import DataTable from "../../../../shared/components/DataTable";
import OrderStatusChips from "../components/OrderStatusChips";
import OrderStatusSelector from "../components/OrderStatusSelector";
import OrderFormModal from "../components/OrderFormModal";
import OrderDetailModal from "../components/OrderDetailModal";
import OrderPaymentsModal from "../components/OrderPaymentsModal";
import ApprovePaymentModal from "../components/ApprovePaymentModal";
import DevolverPaymentModal from "../components/DevolverPaymentModal";
import UploadPaymentModal from "../components/UploadPaymentModal";
import RejectReasonModal from "../components/RejectReasonModal";
import CancelReasonModal from "../components/CancelReasonModal";
import OrderNotification from "../components/OrderNotification";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useDebouncedValue from "../../../../shared/hooks/useDebouncedValue";
import useOrders from "../hooks/useOrders";
import useOrderFormOptions from "../hooks/useOrderFormOptions";
import { getStatusMeta, isFinalStatus } from "../data/orderStatus";
import { formatDisplayDate } from "../utils/orderDisplay";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "../../../../shared/css/adminCrud.css";

// Las seis columnas de datos comparten el mismo ancho; Acciones se reserva
// aparte para que el encabezado y los iconos queden juntos a la derecha.
const EQUAL_COLUMN_STYLE = {
  width: "calc((100% - 144px) / 6)",
  boxSizing: "border-box",
};

const PAGE_SIZE = 10;
const COUNTED_STATUSES = ["pendiente", "en_preparacion", "despachado"];
const INITIAL_STATUS_COUNTS = Object.fromEntries(
  COUNTED_STATUSES.map((status) => [status, 0])
);
const ORDER_BY_STATUS = {
  todos: "creacion",
  pendiente: "creacion",
  en_preparacion: "entrega_activa",
  despachado: "entrega_activa",
  entregado: "entrega",
  rechazado: "creacion",
  cancelado: "cancelacion",
};

const EMPTY_STATUS_MESSAGES = {
  todos: "No hay pedidos para mostrar.",
  pendiente: "No hay pedidos pendientes.",
  en_preparacion: "No hay pedidos en preparación.",
  despachado: "No hay pedidos despachados.",
  entregado: "No hay pedidos entregados.",
  rechazado: "No hay pedidos rechazados.",
  cancelado: "No hay pedidos cancelados.",
};

export default function OrdersListPage() {
  const { can } = usePermissions();
  const canCreate = can("Pedidos", "Crear");
  const canEditOrder = can("Pedidos", "Editar");
  const canChangeStatus = can("Pedidos", "Cambiar estado");

  const [statusFilter, setStatusFilter] = useState("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const isSearching = searchTerm.trim() !== "";
  const effectiveStatus = isSearching ? "todos" : statusFilter;
  const clienteBusqueda = isSearching
    ? debouncedSearch.trim() || undefined
    : undefined;
  const estadoBusqueda = effectiveStatus === "todos" ? undefined : effectiveStatus;
  const orden = ORDER_BY_STATUS[effectiveStatus] ?? "creacion";

  const {
    orders,
    meta,
    loading,
    error,
    reload,
    submitting,
    statusSavingId,
    rejectSubmitting,
    reprogrammingId,
    paymentSavingId,
    paymentUploadingId,
    createOrder,
    updateOrder,
    changeStatus,
    rejectOrder,
    uploadPayment,
    approvePayment,
    devolverComprobante,
    reprogramOrder,
  } = useOrders({
    page,
    limit: PAGE_SIZE,
    estado: estadoBusqueda,
    cliente: clienteBusqueda,
    orden,
    onPageOutOfRange: setPage,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  // Pedido que se está rechazando: se pide el motivo antes de aplicar el estado.
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectError, setRejectError] = useState("");

  // Pedido que se está cancelando: el motivo es obligatorio.
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [cancelError, setCancelError] = useState("");

  const [paymentsOrder, setPaymentsOrder] = useState(null);
  const [approvingPayment, setApprovingPayment] = useState(null); // { order, comprobante }
  const [paymentError, setPaymentError] = useState("");
  const [returningPayment, setReturningPayment] = useState(null); // { order, comprobante }
  const [uploadingPaymentOrder, setUploadingPaymentOrder] = useState(null);
  const [uploadPaymentError, setUploadPaymentError] = useState("");

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

  // Los contadores reflejan el total del negocio, no el resultado del filtro.
  const statusCounts = COUNTED_STATUSES.reduce((counts, status) => {
    counts[status] = meta.estados?.[status] ?? 0;
    return counts;
  }, { ...INITIAL_STATUS_COUNTS });

  const emptyMessage = loading
    ? "Cargando pedidos..."
    : isSearching
      ? "No hay pedidos que coincidan con la búsqueda."
      : EMPTY_STATUS_MESSAGES[effectiveStatus] ??
        "No hay pedidos para mostrar.";

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setSearchTerm("");
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

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
      setPage(1);
      reload();
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

    if (newStatus === "cancelado") {
      setCancelError("");
      setCancelingOrder(order);
      return;
    }

    try {
      await changeStatus(order.id, newStatus);
      setNotification({
        message: `Pedido movido a ${getStatusMeta(newStatus).label}.`,
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

  const handleSubmitCancel = async (reason) => {
    if (!canChangeStatus || !cancelingOrder) return;

    setCancelError("");
    try {
      await changeStatus(cancelingOrder.id, "cancelado", reason);
      setCancelingOrder(null);
      setNotification({ message: "Pedido cancelado correctamente." });
    } catch (err) {
      setCancelError(err?.message || "No se pudo cancelar el pedido.");
    }
  };

  const actualizarPedidoEnVistas = (pedido) => {
    setPaymentsOrder((prev) =>
      prev && String(prev.id) === String(pedido.id) ? pedido : prev
    );
    setDetailOrder((prev) =>
      prev && String(prev.id) === String(pedido.id) ? pedido : prev
    );
  };

  const handleOpenPayments = (order) => {
    setPaymentError("");
    setPaymentsOrder(order);
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
      setApprovingPayment(null);
      actualizarPedidoEnVistas(pedido);
      setNotification({
        message:
          advertencia || "Comprobante aprobado. El total aprobado fue actualizado.",
      });
    } catch (err) {
      setPaymentError(err?.message || "No se pudo aprobar el comprobante.");
    }
  };

  const handleOpenReturnPayment = (order, comprobante) => {
    setPaymentError("");
    setReturningPayment({ order, comprobante });
  };

  const handleSubmitReturnPayment = async (motivo) => {
    if (!returningPayment) return;

    setPaymentError("");
    try {
      const pedido = await devolverComprobante(
        returningPayment.comprobante.id,
        motivo
      );
      actualizarPedidoEnVistas(pedido);
      setReturningPayment(null);
      setNotification({
        message:
          "Comprobante devuelto. No cuenta para el total aprobado y puedes subir otro si hay cupo y saldo.",
      });
    } catch (err) {
      setPaymentError(err?.message || "No se pudo devolver el comprobante.");
    }
  };

  const handleOpenUploadPayment = (order) => {
    setUploadPaymentError("");
    setUploadingPaymentOrder(order);
  };

  const handleSubmitUploadPayment = async (file) => {
    if (!uploadingPaymentOrder) return;

    setUploadPaymentError("");
    try {
      const pedido = await uploadPayment(uploadingPaymentOrder.id, file);
      actualizarPedidoEnVistas(pedido);
      setUploadingPaymentOrder(null);
      setNotification({ message: "Comprobante subido correctamente." });
    } catch (err) {
      setUploadPaymentError(
        err?.message || "No se pudo subir el comprobante."
      );
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
        width: "144px",
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
            <button
              type="button"
              className="table-action-btn"
              title="Ver y gestionar comprobantes"
              onClick={() => handleOpenPayments(row)}
            >
              <i className="fa-solid fa-receipt" />
            </button>
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
        data={orders}
        tableLayout="fixed"
        serverPagination
        page={page}
        totalPages={meta.totalPages}
        totalRows={meta.total}
        onPageChange={setPage}
        searchPlaceholder="Buscar por cliente..."
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        emptyMessage={emptyMessage}
        beforeTable={
          <OrderStatusChips
            activeStatus={effectiveStatus}
            onChange={handleStatusFilterChange}
            counts={statusCounts}
          />
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
        />
      )}

      {paymentsOrder && (
        <OrderPaymentsModal
          open
          onClose={() => {
            setPaymentsOrder(null);
            setPaymentError("");
          }}
          order={paymentsOrder}
          canManagePayments={canChangeStatus}
          canUploadPayments={canCreate}
          paymentSavingId={paymentSavingId}
          uploadingPayment={
            String(paymentUploadingId) === String(paymentsOrder.id)
          }
          onApprovePayment={(comprobante) =>
            handleOpenApprovePayment(paymentsOrder, comprobante)
          }
          onReturnPayment={(comprobante) =>
            handleOpenReturnPayment(paymentsOrder, comprobante)
          }
          onUploadPayment={() => handleOpenUploadPayment(paymentsOrder)}
        />
      )}

      {/* Motivo obligatorio al cancelar */}
      {cancelingOrder && (
        <CancelReasonModal
          open
          onClose={() => {
            setCancelingOrder(null);
            setCancelError("");
          }}
          onSubmit={handleSubmitCancel}
          submitting={String(statusSavingId) === String(cancelingOrder.id)}
          formError={cancelError}
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

      {returningPayment && (
        <DevolverPaymentModal
          key={returningPayment.comprobante.id}
          open
          onClose={() => {
            setReturningPayment(null);
            setPaymentError("");
          }}
          onSubmit={handleSubmitReturnPayment}
          submitting={
            String(paymentSavingId) === String(returningPayment.comprobante.id)
          }
          formError={paymentError}
        />
      )}

      {uploadingPaymentOrder && (
        <UploadPaymentModal
          key={uploadingPaymentOrder.id}
          open
          onClose={() => {
            setUploadingPaymentOrder(null);
            setUploadPaymentError("");
          }}
          onSubmit={handleSubmitUploadPayment}
          submitting={
            String(paymentUploadingId) === String(uploadingPaymentOrder.id)
          }
          formError={uploadPaymentError}
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
