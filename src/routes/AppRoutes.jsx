// src/routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
import StoreLayout from "../shared/components/StoreLayout";

import Home from "../features/home/pages/HomePage";
import ProductCatalog from "../features/catalog/pages/ProductCatalog";
import ProductDetail from "../features/catalog/pages/ProductDetail";
import CartPage from "../features/cart/pages/CartPage";
import CheckoutPage from "../features/cart/pages/CheckoutPage";
import ReviewsPage from "../features/reviews/pages/ReviewsPage";
import AboutPage from "../features/about/pages/AboutPage";

import LoginPage from "../features/login/pages/LoginPage";
import RegisterPage from "../features/login/pages/RegisterPage";
import ForgotPasswordPage from "../features/login/pages/ForgotPasswordPage";
import ChangePasswordPage from "../features/login/pages/ChangePasswordPage";
import RequireAuth from "../shared/components/RequireAuth";

import AdminRoutes from "./AdminRoutes";
import ProfileRoutes from "./ProfileRoutes";

export default function AppRoutes() {
  return (
    <Routes>
      {/* TIENDA PÚBLICA Y PERFIL PROTEGIDO */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/productos" element={<ProductCatalog />} />
        <Route path="/productos/:id" element={<ProductDetail />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/carrito/pago" element={<CheckoutPage />} />
        <Route path="/reseñas" element={<ReviewsPage />} />
        <Route path="/conocenos" element={<AboutPage />} />

        {/* Panel de cliente protegido */}
        <Route
          path="/users/*"
          element={
            <RequireAuth>
              <ProfileRoutes />
            </RequireAuth>
          }
        />
      </Route>

      {/* AUTENTICACIÓN Y ADMIN */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
      <Route
        path="/cambiar-contrasena"
        element={
          <RequireAuth>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />
      
      {/* Panel de administración protegido con RequireAuth */}
      <Route
        path="/admin/*"
        element={
          <RequireAuth>
            <AdminRoutes />
          </RequireAuth>
        }
      />
    </Routes>
  );
}