// src/features/admin/sales/pages/SalesListPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../../shared/components/DataTable";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useDebouncedValue from "../../../../shared/hooks/useDebouncedValue";
import useSales from "../hooks/useSales";
import * as saleService from "../services/saleService";
import SalesReportModal from "../components/SalesReportModal";
import { formatDisplayDate } from "../../orders/utils/orderDisplay";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "../../../../shared/css/adminCrud.css";
import "./SalesListPage.css";

const PAGE_SIZE = 10;

export default function SalesListPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canExport = can("Ventas", "Exportar reporte");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const isSearching = searchTerm.trim() !== "";
  const clienteBusqueda = isSearching
    ? debouncedSearch.trim() || undefined
    : undefined;

  const { sales, meta, loading, error, reload } = useSales({
    page,
    limit: PAGE_SIZE,
    cliente: clienteBusqueda,
    onPageOutOfRange: setPage,
  });
  const [exportandoId, setExportandoId] = useState(null);
  const [exportError, setExportError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

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
    <div className="crud-page sales-list-page">
      <DataTable
        title="Ventas"
        description="Consulta las ventas confirmadas del negocio."
        columns={columns}
        data={sales}
        serverPagination
        page={page}
        totalPages={meta.totalPages}
        totalRows={meta.total}
        onPageChange={setPage}
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        leadingActions={
          canExport ? (
            <button
              type="button"
              className="btn-report-export"
              onClick={() => setReportOpen(true)}
            >
              <i className="fa-solid fa-file-excel" />
              Exportar reporte
            </button>
          ) : undefined
        }
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

      {canExport && reportOpen && (
        <SalesReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
