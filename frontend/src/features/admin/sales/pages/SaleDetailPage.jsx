// src/features/admin/sales/pages/SaleDetailPage.jsx
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import SaleReceipt from "../components/SaleReceipt";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useSale from "../hooks/useSale";
import * as saleService from "../services/saleService";
import "./SaleDetailPage.css";

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canExport = can("Ventas", "Exportar reporte");
  const { sale, loading, error, notFound, reload } = useSale(id);
  const [exportando, setExportando] = useState(false);
  const [exportError, setExportError] = useState("");

  const handleDownloadReceipt = async () => {
    setExportError("");
    setExportando(true);

    try {
      await saleService.descargarComprobante(id);
    } catch (err) {
      setExportError(err?.message || "No se pudo descargar el comprobante.");
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <div className="sale-detail-page">
        <p>Cargando venta...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div>
        <p>No encontramos esta venta.</p>
        <button type="button" className="btn-download-receipt" onClick={() => navigate("/admin/ventas")}>
          <i className="fa-solid fa-arrow-left-long" />
          Volver a Ventas
        </button>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="sale-detail-page">
        <p>{error || "No se pudo cargar la venta."}</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" className="btn-generate-receipt" onClick={reload}>
            Reintentar
          </button>
          <button type="button" className="btn-download-receipt" onClick={() => navigate("/admin/ventas")}>
            <i className="fa-solid fa-arrow-left-long" />
            Volver a Ventas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sale-detail-page">
      <div className="sale-detail-breadcrumb">
        <Link to="/admin/ventas">Ventas</Link>
        <span>/</span>
        <span>#{sale.id}</span>
      </div>

      <div className="sale-detail-header">
        <h1 className="sale-detail-title">Detalle de la Venta</h1>

        {canExport && (
          <div className="sale-detail-actions">
            <button
              type="button"
              className="btn-download-receipt"
              onClick={handleDownloadReceipt}
              disabled={exportando}
            >
              <i className={`fa-solid ${exportando ? "fa-spinner fa-spin" : "fa-download"}`} />
              {exportando ? "Descargando..." : "Descargar comprobante"}
            </button>
          </div>
        )}
      </div>

      {exportError && (
        <p className="sale-detail-error" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {exportError}
        </p>
      )}

      <SaleReceipt sale={sale} />
    </div>
  );
}
