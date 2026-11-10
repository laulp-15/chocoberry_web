// src/features/admin/dashboard/pages/DashboardPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import KpiCard from "../../../../shared/components/KpiCard";
import BarChart from "../../../../shared/components/BarChart";
import DonutChart from "../../../../shared/components/DonutChart";
import PieChart from "../../../../shared/components/PieChart";
import TopProductsList from "../components/TopProductsList";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import useDashboard from "../hooks/useDashboard";
import * as dashboardService from "../services/dashboardService";
import "./DashboardPage.css";

const SIN_SEMANAS = [];

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

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

function mesActualISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

function fechaHoyISO() {
  const hoy = new Date();
  return [
    hoy.getFullYear(),
    String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0"),
  ].join("-");
}

function partesPeriodo(periodo) {
  const [anio, mes] = String(periodo).split("-").map(Number);
  return { anio, mes };
}

function mesLargo(valor) {
  if (!valor) return "—";
  const [anio, mes] = String(valor).split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
  }).format(new Date(anio, mes - 1, 1));
}

export default function DashboardPage() {
  const { can } = usePermissions();
  const canExport = can("Dashboard", "Exportar reporte");
  const [periodo, setPeriodo] = useState(mesActualISO);
  const [semanaElegida, setSemanaElegida] = useState(null);
  const [exportando, setExportando] = useState(null);
  const [exportError, setExportError] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const { resumen, loading, error, reload } = useDashboard({ mes: periodo });

  const periodoActivo = resumen?.periodo?.mes ?? periodo;
  const { anio: anioSeleccionado, mes: mesSeleccionado } = partesPeriodo(periodoActivo);
  const hoy = new Date();
  const anioActual = hoy.getFullYear();
  const mesActual = hoy.getMonth() + 1;
  const aniosDisponibles = resumen?.disponibilidad?.aniosDisponibles ?? [];
  const aniosBase = aniosDisponibles.length ? aniosDisponibles : [anioActual];
  const opcionesAnio = [...new Set([...aniosBase, anioSeleccionado])]
    .filter((anio) => anio <= anioActual)
    .sort((a, b) => a - b);

  const semanas = resumen?.semanasMes?.data ?? SIN_SEMANAS;
  const indicePorDefecto = useMemo(() => {
    if (!semanas.length) return 0;
    if (resumen?.periodo?.mes !== mesActualISO()) return 0;

    const hoyTexto = fechaHoyISO();
    const indice = semanas.findIndex((semana) =>
      semana.dias.some((dia) => dia.fecha === hoyTexto)
    );
    return indice >= 0 ? indice : 0;
  }, [semanas, resumen?.periodo?.mes]);
  const indiceElegido =
    semanaElegida?.periodo === periodoActivo ? semanaElegida.indice : null;
  const semanaIndice = Math.min(
    indiceElegido ?? indicePorDefecto,
    Math.max(semanas.length - 1, 0)
  );
  const semanaSeleccionada = semanas[semanaIndice] ?? null;
  const diasSemana = semanaSeleccionada?.dias ?? [];
  const periodoMesLargo = mesLargo(periodoActivo);

  useEffect(() => {
    if (!menuAbierto) return undefined;

    const cerrar = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuAbierto(false);
    };
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setMenuAbierto(false);
    };

    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [menuAbierto]);

  const cambiarMes = (event) => {
    const nuevoMes = Number(event.target.value);
    setPeriodo(`${anioSeleccionado}-${String(nuevoMes).padStart(2, "0")}`);
  };

  const cambiarAnio = (event) => {
    const nuevoAnio = Number(event.target.value);
    const mesDestino =
      nuevoAnio === anioActual ? Math.min(mesSeleccionado, mesActual) : mesSeleccionado;
    setPeriodo(`${nuevoAnio}-${String(mesDestino).padStart(2, "0")}`);
  };

  const moverAnio = (destino) => {
    if (!destino) return;
    const mesDestino =
      destino === anioActual ? Math.min(mesSeleccionado, mesActual) : mesSeleccionado;
    setPeriodo(`${destino}-${String(mesDestino).padStart(2, "0")}`);
  };

  const handleExport = async (formato) => {
    setMenuAbierto(false);
    setExportError("");
    setExportando(formato);

    try {
      await dashboardService.descargarReporte(formato, { mes: periodoActivo });
    } catch (err) {
      setExportError(err?.message || "No se pudo exportar el reporte.");
    } finally {
      setExportando(null);
    }
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
          hint: `Ingresos de ${periodoMesLargo}`,
          delta: construirDelta(resumen.kpis.variacionPorcentual),
        },
        {
          icon: "fa-star",
          iconColor: "var(--primario)",
          value: resumen.kpis.productoMasVendido || "Sin ventas",
          label: "Producto más vendido del mes",
          hint: `Producto más vendido de ${periodoMesLargo}`,
        },
      ]
    : [];

  const tabsSemana = semanas.map((semana, indice) => ({
    label: semana.label,
    active: indice === semanaIndice,
    onClick: () => setSemanaElegida({ periodo: periodoActivo, indice }),
  }));

  return (
    <div className="dashboard-page" aria-busy={loading}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">¡Bienvenida a ChocoBerry!</h1>
        <p className="dashboard-subtitle">
          Aquí tienes un resumen del comportamiento de tu negocio.
        </p>
      </div>

      <div className="dashboard-toolbar">
        <div className="dashboard-period-selector">
          <span className="dashboard-period-title">
            <i className="fa-solid fa-calendar" aria-hidden="true" />
            Periodo
          </span>
          <select
            className="dashboard-period-select"
            aria-label="Mes"
            value={mesSeleccionado}
            onChange={cambiarMes}
            disabled={loading}
          >
            {MESES.map((nombre, indice) => {
              const valor = indice + 1;
              return (
                <option
                  key={nombre}
                  value={valor}
                  disabled={anioSeleccionado === anioActual && valor > mesActual}
                >
                  {nombre}
                </option>
              );
            })}
          </select>
          <select
            className="dashboard-period-select"
            aria-label="Año"
            value={anioSeleccionado}
            onChange={cambiarAnio}
            disabled={loading}
          >
            {opcionesAnio.map((anio) => (
              <option key={anio} value={anio}>
                {anio}
              </option>
            ))}
          </select>
          {loading && (
            <span className="dashboard-period-loading" role="status" aria-live="polite">
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              Actualizando...
            </span>
          )}
        </div>

        {canExport && (
          <div className="dashboard-report-actions">
            <div className="dashboard-export" ref={menuRef}>
              <button
                type="button"
                className="btn-export"
                onClick={() => setMenuAbierto((abierto) => !abierto)}
                disabled={Boolean(exportando)}
                aria-haspopup="menu"
                aria-expanded={menuAbierto}
              >
                <i className={`fa-solid ${exportando ? "fa-spinner fa-spin" : "fa-download"}`} />
                {exportando ? "Descargando..." : "Descargar reporte"}
                <i className="fa-solid fa-chevron-down" />
              </button>
              {menuAbierto && (
                <div className="dashboard-export-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => handleExport("pdf")}>
                    <i className="fa-solid fa-file-pdf" />
                    Descargar PDF
                  </button>
                  <button type="button" role="menuitem" onClick={() => handleExport("excel")}>
                    <i className="fa-solid fa-file-excel" />
                    Descargar Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {exportError && (
        <p className="dashboard-inline-error" role="alert">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          {exportError}
        </p>
      )}

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
                subtitle={
                  semanaSeleccionada
                    ? `${semanaSeleccionada.label} · ${semanaSeleccionada.rango}`
                    : "Sin semanas para este mes"
                }
                data={diasSemana}
                formatValue={formatPrice}
                periodLabel={periodoMesLargo}
                tabs={tabsSemana}
              />
            </div>
            <div className="col-12 col-lg-5 dashboard-col">
              <TopProductsList
                products={resumen.topProductos}
                periodo={periodoMesLargo}
              />
            </div>
          </div>

          <div className="row dashboard-row">
            <div className="col-12 dashboard-col">
              <BarChart
                title="Ventas por mes"
                subtitle="Enero a diciembre"
                data={resumen.ventasMes.data}
                formatValue={formatPrice}
                periodLabel={String(resumen.ventasMes.anio)}
                onPrevious={
                  resumen.ventasMes.anterior
                    ? () => moverAnio(resumen.ventasMes.anterior)
                    : undefined
                }
                onNext={
                  resumen.ventasMes.siguiente
                    ? () => moverAnio(resumen.ventasMes.siguiente)
                    : undefined
                }
                previousLabel="Año anterior"
                nextLabel="Año siguiente"
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