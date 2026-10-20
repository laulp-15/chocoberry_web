// src/features/admin/sales/pages/SalesListPage.jsx
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../shared/components/DataTable";
import OrderStatusBadge from "../../orders/components/OrderStatusBadge";
import useSales from "../hooks/useSales";
import { formatDisplayDate } from "../../orders/utils/orderDisplay";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "../../../../shared/css/adminCrud.css";

export default function SalesListPage() {
  const navigate = useNavigate();
  const { sales, loading, error, reload } = useSales();

  const handleGenerateReceipt = (row) => {
    console.log("TODO: generar comprobante digital (PDF) para el pedido", row.id);
  };

  const handleDownloadReceipt = (row) => {
    console.log("TODO: descargar comprobante digital (PDF) del pedido", row.id);
  };

  const columns = [
    { key: "cliente", label: "Cliente" },
    {
      key: "estado",
      label: "Estado",
      render: (row) => (
        <OrderStatusBadge status={row.estado} title="Estado de la venta" />
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      render: (row) => formatDisplayDate(row.fecha),
    },
    { key: "total", label: "Total", render: (row) => formatPrice(row.total) },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div style={{ display: "flex", gap: "12px", color: "var(--texto-muted)" }}>
          <i
            className="fa-solid fa-eye"
            style={{ cursor: "pointer" }}
            title="Ver detalle"
            onClick={() => navigate(`/admin/ventas/${row.id}`)}
          />
          <i
            className="fa-solid fa-print"
            style={{ color: "var(--primario)", cursor: "pointer" }}
            title="Generar comprobante digital"
            onClick={() => handleGenerateReceipt(row)}
          />
          <i
            className="fa-solid fa-download"
            style={{ cursor: "pointer" }}
            title="Descargar comprobante"
            onClick={() => handleDownloadReceipt(row)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="crud-page">
      <DataTable
        title="Ventas"
        description="Consulta las ventas confirmadas del negocio."
        columns={columns}
        data={sales}
        searchPlaceholder="Buscar por cliente..."
        emptyMessage={
          loading
            ? "Cargando ventas..."
            : error
              ? "No se pudieron cargar las ventas."
              : "No hay ventas para mostrar."
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
    </div>
  );
}
