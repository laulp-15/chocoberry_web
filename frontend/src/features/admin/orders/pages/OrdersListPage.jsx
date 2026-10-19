// src/features/admin/orders/pages/OrdersListPage.jsx
import React, { useState } from "react";
import DataTable from "../../../../shared/components/DataTable";
import FormSelect from "../../../../shared/components/FormSelect";
import OrderStatusSelector from "../components/OrderStatusSelector";
import OrderFormModal from "../components/OrderFormModal";
import OrderDetailModal from "../components/OrderDetailModal";
import RejectReasonModal from "../components/RejectReasonModal";
import OrderNotification from "../components/OrderNotification";
import { ORDER_STATUSES } from "../data/orderStatus";
import { INITIAL_ORDERS } from "../data/MockOrders";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { todayISO } from "../../../../shared/components/DatePicker";

export default function OrdersListPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  // Pedido que se está rechazando: se pide el motivo antes de aplicar el estado.
  const [rejectingOrder, setRejectingOrder] = useState(null);

  const [notification, setNotification] = useState(null); // { title, message }

  const filtered = orders.filter((o) => !statusFilter || o.estado === statusFilter);

  // Solo se bloquea la edición/rechazo si el pedido ya fue Entregado,
  // Cancelado o Rechazado.
  const isLocked = (order) =>
    order.estado === "entregado" ||
    order.estado === "cancelado" ||
    order.estado === "rechazado";

  // Regla de negocio: un pedido solo se puede rechazar mientras está Pendiente.
  const canReject = (order) => order.estado === "pendiente";

  const handleCreate = () => {
    setEditingOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order) => {
    if (isLocked(order)) return;
    setEditingOrder(order);
    setFormOpen(true);
  };

  const handleSave = (order) => {
    if (editingOrder) {
      setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? { ...order, id: o.id } : o)));
      setNotification({
        message: "Pedido actualizado correctamente.",
      });
    } else {
      const newId = Math.max(...orders.map((o) => o.id)) + 1;
      setOrders((prev) => [{ ...order, id: newId }, ...prev]);
      setNotification({
        message: "Pedido creado correctamente.",
      });
    }
    setFormOpen(false);
  };

  // Cambio de estado desde el desplegable. "Rechazado" no se aplica directo:
  // primero se pide el motivo (mismo flujo que el icono "Rechazar pedido").
  const handleStatusChange = (order, newStatus) => {
    if (newStatus === "rechazado") {
      if (!canReject(order)) return;
      setRejectingOrder(order);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, estado: newStatus } : o))
    );
  };

  const handleSubmitRejectReason = (reason) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === rejectingOrder.id
          ? { ...o, estado: "rechazado", motivoRechazo: reason, fechaRechazo: todayISO() }
          : o
      )
    );
    setRejectingOrder(null);
    setNotification({
      message: "Pedido rechazado correctamente.",
    });
  };

  const columns = [
    { key: "cliente", label: "Cliente" },
    { key: "direccion", label: "Dirección", render: (row) => row.direccion || "—" },
    { key: "fecha", label: "Fecha" },
    { key: "total", label: "Total", render: (row) => formatPrice(row.total) },
    { 
      key: "estado", 
      label: "Estado", 
      render: (row) => (
        <OrderStatusSelector
          status={row.estado}
          onChange={(newStatus) => handleStatusChange(row, newStatus)}
          disabled={isLocked(row)}
          lockedReason="Este pedido está bloqueado"
          canReject={canReject(row)}
        />
      ) 
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => {
        const locked = isLocked(row);
        const rejectable = canReject(row);
        return (
          <div style={{ display: "flex", gap: "12px", color: "var(--texto-muted)" }}>
            <i
              className="fa-solid fa-eye"
              style={{ cursor: "pointer" }}
              title="Ver detalle"
              onClick={() => setDetailOrder(row)}
            />
            <i
              className="fa-solid fa-pen"
              style={{
                color: locked ? "var(--borde)" : "var(--texto-muted)",
                cursor: locked ? "not-allowed" : "pointer",
              }}
              title={locked ? "Ya no se puede editar este pedido" : "Editar"}
              onClick={() => handleEdit(row)}
            />
            <i
              className="fa-solid fa-circle-xmark"
              style={{
                color: rejectable ? "var(--texto-muted)" : "var(--borde)",
                cursor: rejectable ? "pointer" : "not-allowed",
              }}
              title={rejectable ? "Rechazar pedido" : "Solo se puede rechazar un pedido pendiente"}
              onClick={() => rejectable && handleStatusChange(row, "rechazado")}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        title="Pedidos"
        description="Consulta y administra los pedidos del negocio."
        createLabel="Crear pedido"
        onCreate={handleCreate}
        columns={columns}
        data={filtered}
        searchPlaceholder="Buscar por cliente..."
        extraFilter={
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: "200px" }}>
            <i className="fa-solid fa-filter" style={{ color: "var(--texto-muted, #888)" }} title="Filtrar" />
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

      <OrderFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={editingOrder}
        onSave={handleSave}
      />

      <OrderDetailModal
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
        order={detailOrder}
      />

      {/* Motivo del rechazo (mismo flujo desde el desplegable y el icono) */}
      <RejectReasonModal
        open={Boolean(rejectingOrder)}
        onClose={() => setRejectingOrder(null)}
        onSubmit={handleSubmitRejectReason}
      />

      <OrderNotification
        open={Boolean(notification)}
        onClose={() => setNotification(null)}
        title={notification?.title}
        message={notification?.message}
      />
    </>
  );
}