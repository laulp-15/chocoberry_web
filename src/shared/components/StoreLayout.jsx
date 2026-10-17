import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function StoreLayout() {
  const location = useLocation();
  const isProfile = location.pathname.startsWith('/users');

  return (
    <div
    style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "var(--bg-main)",
      }}
    >
      {/* Barra de navegación superior */}
      <Navbar />

      {/* Contenido dinámico de las páginas públicas (Home, Catálogo, Reseñas, etc.) */}
      <main style={{ flex: 1, paddingTop: 'var(--navbar-height)', scrollMarginTop: 'var(--navbar-height)' }}>
        <Outlet />
      </main>

      {/* Pie de página (oculto en perfil de cliente) */}
      {!isProfile && <Footer />}
    </div>
  );
}