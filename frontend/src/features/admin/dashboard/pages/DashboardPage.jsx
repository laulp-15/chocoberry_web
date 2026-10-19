// src/features/admin/dashboard/pages/DashboardPage.jsx
import React, { useMemo } from "react";
import KpiCard from "../../../../shared/components/KpiCard";
import BarChart from "../../../../shared/components/BarChart";
import DonutChart from "../../../../shared/components/DonutChart";
import PieChart from "../../../../shared/components/PieChart";
import TopProductsList from "../components/TopProductsList";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import { MUNICIPIOS } from "../../../cart/data/Shipping";
import { ORDER_STATUSES } from "../../orders/data/orderStatus";
import { INITIAL_ORDERS } from "../../orders/data/MockOrders";
import "./DashboardPage.css";

// TODO: reemplazar todo por datos reales del backend (features/admin/dashboard/services)
const KPIS = [
  { icon: "fa-clock", iconColor: "#F49505", value: "12", label: "Pedidos pendientes" },
  {
    icon: "fa-circle-check",
    iconColor: "#24943C",
    value: "48",
    label: "Pedidos entregados",
  },
  {
    icon: "fa-sack-dollar",
    iconColor: "var(--primario)",
    value: formatPrice(7850000),
    label: "Ingresos del mes",
    delta: { text: "10% más respecto al mes anterior", positive: true },
  },
  { icon: "fa-star", iconColor: "var(--primario)", value: "Caja Amor de Fresa", label: "Producto más vendido" },
];

const SALES_BY_WEEKDAY = [
  { label: "Lun", value: 42 },
  { label: "Mar", value: 58 },
  { label: "Mié", value: 30 },
  { label: "Jue", value: 74 },
  { label: "Vie", value: 50 },
  { label: "Sáb", value: 68 },
  { label: "Dom", value: 60 },
];

const SALES_BY_MONTH = [
  { label: "Ene", value: 20 }, { label: "Feb", value: 24 }, { label: "Mar", value: 18 },
  { label: "Abr", value: 22 }, { label: "May", value: 16 }, { label: "Jun", value: 40 },
  { label: "Jul", value: 38 }, { label: "Ago", value: 36 }, { label: "Sep", value: 42 },
  { label: "Oct", value: 39 }, { label: "Nov", value: 44 }, { label: "Dic", value: 41 },
];

const TOP_PRODUCTS = [
  { name: "Caja Amor de Fresa", sold: 86 },
  { name: "Corazón de Chocolate", sold: 64 },
  { name: "Dulce Antojo", sold: 51 },
  { name: "Fresas Rosadas", sold: 37 },
  { name: "Caja Especial Cumpleaños", sold: 29 },
];

// Mock ratings data (1-5 estrellas) - constante fuera del componente
const RATINGS_DATA = [
  { label: "5 estrellas", value: 42, color: "var(--success-100)" },
  { label: "4 estrellas", value: 28, color: "var(--success-80)" },
  { label: "3 estrellas", value: 15, color: "var(--warning-80)" },
  { label: "2 estrellas", value: 5, color: "var(--error-80)" },
  { label: "1 estrella", value: 3, color: "var(--error-100)" },
];
const RATINGS_TOTAL = RATINGS_DATA.reduce((s, r) => s + r.value, 0);
const RATINGS_AVG = (
  [5, 4, 3, 2, 1].reduce((s, star, i) => s + star * RATINGS_DATA[i].value, 0) / RATINGS_TOTAL
).toFixed(1);

export default function DashboardPage() {
  // Datos para las nuevas gráficas (useMemo DENTRO del componente)
  const ORDERS_BY_MUNICIPIO = useMemo(() => {
    const counts = {};
    INITIAL_ORDERS.forEach((o) => {
      if (o.municipio) {
        counts[o.municipio] = (counts[o.municipio] || 0) + 1;
      }
    });
    return MUNICIPIOS.map((m) => ({
      label: m.label,
      value: counts[m.value] || 0,
    })).filter((m) => m.value > 0)
      .sort((a, b) => b.value - a.value);
  }, []);

  const ORDERS_BY_STATUS = useMemo(() => {
    const counts = {};
    INITIAL_ORDERS.forEach((o) => {
      counts[o.estado] = (counts[o.estado] || 0) + 1;
    });
    return ORDER_STATUSES.map((s) => ({
      label: s.label,
      value: counts[s.value] || 0,
      color: s.color,
    })).filter((s) => s.value > 0);
  }, []);

  const handleGenerate = () => {
    console.log("TODO: generar reporte");
  };

  const handleExport = () => {
    console.log("TODO: exportar reporte (PDF/Excel)");
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">¡Bienvenida a ChocoBerry!</h1>
          <p className="dashboard-subtitle">Aquí tienes un resumen del comportamiento de tu negocio.</p>
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

      <div className="row dashboard-kpis">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="col-12 col-sm-6 col-lg-3 dashboard-col">
            <KpiCard {...kpi} />
          </div>
        ))}
      </div>

      <div className="row dashboard-row">
        <div className="col-12 col-lg-7 dashboard-col">
          <BarChart title="Ventas por semana" data={SALES_BY_WEEKDAY} />
        </div>
        <div className="col-12 col-lg-5 dashboard-col">
          <TopProductsList products={TOP_PRODUCTS} />
        </div>
      </div>

      <div className="row dashboard-row">
        <div className="col-12 dashboard-col">
          <BarChart title="Ventas por mes" data={SALES_BY_MONTH} />
        </div>
      </div>

      <div className="row dashboard-row">
        <div className="col-12 col-lg-4 dashboard-col">
          <DonutChart
            title="Pedidos por municipio"
            subtitle="Dónde se concentran las entregas"
            data={ORDERS_BY_MUNICIPIO}
            unit="pedidos"
          />
        </div>
        <div className="col-12 col-lg-4 dashboard-col">
          <PieChart
            title="Pedidos por estado"
            subtitle="Avance de los pedidos actuales"
            data={ORDERS_BY_STATUS}
            unit="pedidos"
          />
        </div>
        <div className="col-12 col-lg-4 dashboard-col">
          <DonutChart
            title="Calificaciones de los clientes"
            subtitle={`${RATINGS_TOTAL} reseñas`}
            data={RATINGS_DATA}
            centerValue={RATINGS_AVG}
            centerCaption="promedio"
          />
        </div>
      </div>
    </div>
  );
}