// src/shared/components/PieChart.jsx
import React from "react";
import DonutChart from "./DonutChart";

/**
 * Gráfica de torta (sin hueco central). Reutiliza DonutChart con variant="pie",
 * así comparten estilos, interacción y leyenda.
 * Mismas props que DonutChart.
 */
export default function PieChart(props) {
  return <DonutChart {...props} variant="pie" />;
}