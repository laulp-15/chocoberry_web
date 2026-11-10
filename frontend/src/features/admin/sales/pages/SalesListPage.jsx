// src/features/admin/sales/pages/SalesListPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../shared/components/DataTable";
import OrderStatusBadge from "../../orders/components/OrderStatusBadge";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useSales from "../hooks/useSales";
import * as saleService from "../services/saleService";
import { formatDisplayDate } from "../../orders/utils/orderDisplay";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "../../../../shared/css/adminCrud.css";

export default function SalesListPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canExport = can("Ventas", "Exportar reporte");
  const { sales, loading, error, reload } = useSales();
  const [exportandoId, setExportandoId] = useState(null);
  const [exportError, setExportError] = useState("");

  const handleDownloadReceipt = async (row) => {
    setExportError("");
    setExportandoId(row.id);

    try {
      await saleService.descargarComprobante(row.id);
    } catch (err) {
      setExportError(err?.message || "No se pudo descargar el comprobante.");
    } finally {
      setExportandoId(null);
    }
  };

  const columns = [
    {
      key: "clienteIdentificacion",
      label: "N. Identificación",
      render: (row) => row.clienteIdentificacion || "—",
    },
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
          {canExport && (
            <i
              className={`fa-solid ${
                exportandoId === row.id ? "fa-spinner fa-spin" : "fa-download"
              }`}
              style={{ cursor: exportandoId === row.id ? "wait" : "pointer" }}
              title="Descargar comprobante"
              onClick={() => handleDownloadReceipt(row)}
            />
          )}
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
        searchPlaceholder="Buscar por cliente o N. identificación..."
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

      {exportError && (
        <p className="crud-error-hint" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {exportError}
        </p>
      )}
    </div>
  );
}
