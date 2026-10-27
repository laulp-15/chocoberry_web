// src/features/admin/sales/pages/SaleDetailPage.jsx
import { useParams, useNavigate, Link } from "react-router-dom";
import SaleReceipt from "../components/SaleReceipt";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import useSale from "../hooks/useSale";
import "./SaleDetailPage.css";

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canGenerate = can("Ventas", "Generar reporte");
  const canExport = can("Ventas", "Exportar reporte");
  const { sale, loading, error, notFound, reload } = useSale(id);

  const handleGenerateReceipt = () => {
    console.log("TODO: generar comprobante digital (PDF) para el pedido", id);
  };

  const handleDownloadReceipt = () => {
    console.log("TODO: descargar comprobante digital (PDF) del pedido", id);
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

        {(canGenerate || canExport) && (
          <div className="sale-detail-actions">
            {canExport && (
              <button type="button" className="btn-download-receipt" onClick={handleDownloadReceipt}>
                <i className="fa-solid fa-download" />
                Descargar comprobante
              </button>
            )}
            {canGenerate && (
              <button type="button" className="btn-generate-receipt" onClick={handleGenerateReceipt}>
                <i className="fa-solid fa-print" />
                Generar comprobante digital
              </button>
            )}
          </div>
        )}
      </div>

      <SaleReceipt sale={sale} />
    </div>
  );
}
