// src/features/admin/orders/pages/OrdersListPage.jsx
import React, { useState } from "react";
import DataTable from "../../../../shared/components/DataTable";
import FormSelect from "../../../../shared/components/FormSelect";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import OrderStatusBadge from "../components/OrderStatusBadge";
import OrderFormModal from "../components/OrderFormModal";
import OrderDetailModal from "../components/OrderDetailModal";
import CancelReasonModal from "../components/CancelReasonModal";
import OrderNotification from "../components/OrderNotification";
import { ORDER_STATUSES } from "../data/orderStatus";
import { INITIAL_ORDERS } from "../data/mockOrders";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { todayISO } from "../../../../shared/components/DatePicker";

export default function OrdersListPage() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  // Flujo de cancelación en 2 pasos: primero confirmar, luego pedir el motivo.
  const [cancelStep, setCancelStep] = useState(null); // null | "confirm" | "reason"
  const [cancelingOrder, setCancelingOrder] = useState(null);

  const [notification, setNotification] = useState(null); // { title, message }

  const filtered = orders.filter((o) => !statusFilter || o.estado === statusFilter);

  // Solo se bloquea la edición/cancelación si el pedido ya fue Entregado o Cancelado.
  const isLocked = (order) => order.estado === "entregado" || order.estado === "cancelado";

  // Función para rotar el estado del pedido al hacer clic en el badge
  const handleCycleStatus = (order) => {
    if (isLocked(order)) return; // Si ya está entregado o cancelado, no cambia con clic directo

    // Secuencia de estados lícita
    const sequence = ["pendiente", "en_preparacion", "despachado", "entregado"];
    const currentIndex = sequence.indexOf(order.estado);
    
    // Si encuentra el estado en la secuencia, pasa al siguiente; de lo contrario lo deja igual
    if (currentIndex !== -1 && currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, estado: nextStatus } : o))
      );
      setNotification({
        message: `Estado actualizado a "${nextStatus.replace('_', ' ')}".`,
      });
    }
  };

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
      setOrders((prev) => [...prev, { ...order, id: newId }]);
      setNotification({
        message: "Pedido creado correctamente.",
      });
    }
    setFormOpen(false);
  };

  const handleStartCancel = (order) => {
    if (isLocked(order)) return;
    setCancelingOrder(order);
    setCancelStep("confirm");
  };

  const handleConfirmCancel = () => {
    setCancelStep("reason");
  };

  const handleSubmitCancelReason = (reason) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelingOrder.id
          ? { ...o, estado: "cancelado", motivoCancelacion: reason, fechaCancelacion: todayISO() }
          : o
      )
    );
    setCancelStep(null);
    setCancelingOrder(null);
    setNotification({
      message: "Pedido cancelado correctamente.",
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
        <OrderStatusBadge 
          status={row.estado} 
          onClick={() => handleCycleStatus(row)}
          title={isLocked(row) ? "Este pedido está bloqueado" : "Haz clic para avanzar al siguiente estado"}
        />
      ) 
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => {
        const locked = isLocked(row);
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
                color: locked ? "var(--borde)" : "var(--primario)",
                cursor: locked ? "not-allowed" : "pointer",
              }}
              title={locked ? "Ya no se puede editar este pedido" : "Editar"}
              onClick={() => handleEdit(row)}
            />
            <i
              className="fa-solid fa-circle-xmark"
              style={{
                color: locked ? "var(--borde)" : "#DD322D",
                cursor: locked ? "not-allowed" : "pointer",
              }}
              title={locked ? "Ya no se puede cancelar este pedido" : "Cancelar pedido"}
              onClick={() => handleStartCancel(row)}
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

      {/* Paso 1: confirmar */}
      <ConfirmModal
        open={cancelStep === "confirm"}
        onClose={() => setCancelStep((prev) => (prev === "confirm" ? null : prev))}
        onConfirm={handleConfirmCancel}
        variant="danger"
        title="Cancelar pedido"
        description={`El pedido de ${cancelingOrder?.cliente ?? ""} será cancelado y esta acción no se puede deshacer.`}
        confirmLabel="Sí, cancelar pedido"
        cancelLabel="Volver"
      />

      {/* Paso 2: motivo */}
      <CancelReasonModal
        open={cancelStep === "reason"}
        onClose={() => {
          setCancelStep(null);
          setCancelingOrder(null);
        }}
        onSubmit={handleSubmitCancelReason}
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