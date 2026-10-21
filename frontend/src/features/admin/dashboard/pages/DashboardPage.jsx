// src/features/admin/dashboard/pages/DashboardPage.jsx
import KpiCard from "../../../../shared/components/KpiCard";
import BarChart from "../../../../shared/components/BarChart";
import DonutChart from "../../../../shared/components/DonutChart";
import PieChart from "../../../../shared/components/PieChart";
import TopProductsList from "../components/TopProductsList";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import useDashboard from "../hooks/useDashboard";
import "./DashboardPage.css";

const formatoVariacion = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

function construirDelta(variacion) {
  if (!Number.isFinite(variacion) || variacion === 0) return undefined;

  return {
    text: `${formatoVariacion.format(Math.abs(variacion))}% ${
      variacion > 0 ? "más" : "menos"
    } respecto al mes anterior`,
    positive: variacion > 0,
  };
}

function subtituloCalificaciones(total) {
  return `${total} ${total === 1 ? "reseña" : "reseñas"}`;
}

export default function DashboardPage() {
  const { resumen, loading, error, reload } = useDashboard();

  const handleGenerate = () => {
    console.log("TODO: generar reporte");
  };

  const handleExport = () => {
    console.log("TODO: exportar reporte (PDF/Excel)");
  };

  const kpis = resumen
    ? [
        {
          icon: "fa-clock",
          iconColor: "#F49505",
          value: resumen.kpis.pedidosPendientes,
          label: "Pedidos pendientes",
        },
        {
          icon: "fa-circle-check",
          iconColor: "#24943C",
          value: resumen.kpis.pedidosEntregados,
          label: "Pedidos entregados",
        },
        {
          icon: "fa-sack-dollar",
          iconColor: "var(--primario)",
          value: resumen.kpis.ingresosMes,
          formatValue: formatPrice,
          label: "Ingresos del mes",
          delta: construirDelta(resumen.kpis.variacionPorcentual),
        },
        {
          icon: "fa-star",
          iconColor: "var(--primario)",
          value: resumen.kpis.productoMasVendido || "Sin ventas",
          label: "Producto más vendido",
        },
      ]
    : [];

  return (
    <div className="dashboard-page" aria-busy={loading}>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">¡Bienvenida a ChocoBerry!</h1>
          <p className="dashboard-subtitle">
            Aquí tienes un resumen del comportamiento de tu negocio.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button type="button" className="btn-generate-report" onClick={handleGenerate}>
            <i className="fa-solid fa-file-word" />
            Generar reporte
          </button>
          <button type="button" className="btn-export" onClick={handleExport}>
            <i className="fa-solid fa-download" />
            Exportar reporte
          </button>
        </div>
      </div>

      {loading && !resumen && (
        <div className="dashboard-state" role="status" aria-live="polite">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          <p>Cargando dashboard...</p>
        </div>
      )}

      {!loading && !resumen && error && (
        <div className="dashboard-state dashboard-state--error" role="alert">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          <p>{error}</p>
          <button type="button" className="dashboard-retry" onClick={reload}>
            Reintentar
          </button>
        </div>
      )}

      {resumen && (
        <>
          {error && (
            <p className="dashboard-inline-error" role="alert">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
              {error}
              <button type="button" className="dashboard-retry" onClick={reload}>
                Reintentar
              </button>
            </p>
          )}

          <div className="row dashboard-kpis">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="col-12 col-sm-6 col-lg-3 dashboard-col">
                <KpiCard {...kpi} />
              </div>
            ))}
          </div>

          <div className="row dashboard-row">
            <div className="col-12 col-lg-7 dashboard-col">
              <BarChart
                title="Ventas por semana"
                data={resumen.ventasSemana}
                formatValue={formatPrice}
              />
            </div>
            <div className="col-12 col-lg-5 dashboard-col">
              <TopProductsList products={resumen.topProductos} />
            </div>
          </div>

          <div className="row dashboard-row">
            <div className="col-12 dashboard-col">
              <BarChart
                title="Ventas por mes"
                data={resumen.ventasMes}
                formatValue={formatPrice}
              />
            </div>
          </div>

          <div className="row dashboard-row">
            <div className="col-12 col-lg-4 dashboard-col">
              <DonutChart
                title="Pedidos por municipio"
                subtitle="Dónde se concentran las entregas"
                data={resumen.pedidosPorMunicipio}
                unit="pedidos"
              />
            </div>
            <div className="col-12 col-lg-4 dashboard-col">
              <PieChart
                title="Pedidos por estado"
                subtitle="Avance de los pedidos actuales"
                data={resumen.pedidosPorEstado}
                unit="pedidos"
              />
            </div>
            <div className="col-12 col-lg-4 dashboard-col">
              <DonutChart
                title="Calificaciones de los clientes"
                subtitle={subtituloCalificaciones(resumen.calificaciones.total)}
                data={resumen.calificaciones.data}
                centerValue={
                  resumen.calificaciones.total
                    ? resumen.calificaciones.promedio.toFixed(1)
                    : "—"
                }
                centerCaption="promedio"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
