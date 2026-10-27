
// src/routes/AdminRoutes.jsx

import { Routes, Route } from "react-router-dom";
import ScrollToTopWrapper from "../shared/components/ScrollToTopWrapper";
import RequirePermission from "../shared/components/RequirePermission";
import NoAccessPage from "../shared/pages/NoAccessPage";

// Layout
import AdminLayout from "../shared/layouts/AdminLayout";

// Páginas de Administración
import DashboardPage from "../features/admin/dashboard/pages/DashboardPage";

import RolesListPage from "../features/admin/roles/pages/RolesListPage";

import { RolesProvider } from "../features/admin/roles/context/RolesContext";

import CustomersListPage from "../features/admin/customers/pages/CustomersListPage";

import CategoriesListPage from "../features/admin/categories/pages/CategoriesListPage";

import ProductsListPage from "../features/admin/products/pages/ProductsListPage";

import ReviewsListPage from "../features/admin/admin-reviews/pages/ReviewsListPage";

import OrdersListPage from "../features/admin/orders/pages/OrdersListPage";

import SalesListPage from "../features/admin/sales/pages/SalesListPage";

import SaleDetailPage from "../features/admin/sales/pages/SaleDetailPage";

import UsersListPage from "../features/admin/users/pages/UsersListPage";
import UserDetailPage from "../features/admin/users/pages/UserDetailPage";

import DeliveriesListPage from "../features/admin/deliveries/pages/DeliveriesListPage";

// Configuraciones
import PresentationsListPage from "../features/admin/presentations/pages/PresentationsListPage";
import MunicipalitiesListPage from "../features/admin/municipalities/pages/MunicipalitiesListPage";
import FrostingsListPage from "../features/admin/frostings/pages/FrostingsListPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ScrollToTopWrapper />}>
        <Route element={<AdminLayout />}>
          {/* Panel principal */}
          <Route
            index
            element={
              <RequirePermission module="Dashboard">
                <DashboardPage />
              </RequirePermission>
            }
          />

          {/* Crear/Editar rol es un modal dentro de RolesListPage (RoleFormModal),
              no una ruta aparte — por eso aquí solo hay una entrada para "roles". */}
          <Route
            path="roles"
            element={
              <RequirePermission module="Roles">
                <RolesProvider>
                  <RolesListPage />
                </RolesProvider>
              </RequirePermission>
            }
          />

          {/* Usuarios y accesos */}
          <Route
            path="usuarios"
            element={
              <RequirePermission module="Usuarios">
                <UsersListPage />
              </RequirePermission>
            }
          />
          <Route
            path="usuarios/:id"
            element={
              <RequirePermission module="Usuarios">
                <UserDetailPage />
              </RequirePermission>
            }
          />

          {/* Catálogo de productos */}
          <Route
            path="categorias"
            element={
              <RequirePermission module="Categorías">
                <CategoriesListPage />
              </RequirePermission>
            }
          />
          <Route
            path="productos"
            element={
              <RequirePermission module="Productos">
                <ProductsListPage />
              </RequirePermission>
            }
          />

          {/* Pedidos y ventas */}
          <Route
            path="pedidos"
            element={
              <RequirePermission module="Pedidos">
                <OrdersListPage />
              </RequirePermission>
            }
          />
          <Route
            path="ventas"
            element={
              <RequirePermission module="Ventas">
                <SalesListPage />
              </RequirePermission>
            }
          />
          <Route
            path="ventas/:id"
            element={
              <RequirePermission module="Ventas">
                <SaleDetailPage />
              </RequirePermission>
            }
          />

          <Route
            path="entregas"
            element={
              <RequirePermission module="Pedidos">
                <DeliveriesListPage />
              </RequirePermission>
            }
          />
          <Route
            path="clientes"
            element={
              <RequirePermission module="Usuarios">
                <CustomersListPage />
              </RequirePermission>
            }
          />
          <Route
            path="resenas"
            element={
              <RequirePermission
                module="Reseñas"
                actions={["Ver", "Cambiar estado"]}
              >
                <ReviewsListPage />
              </RequirePermission>
            }
          />

          {/* Configuraciones */}
          <Route
            path="presentaciones"
            element={
              <RequirePermission module="Productos">
                <PresentationsListPage />
              </RequirePermission>
            }
          />
          <Route
            path="municipios"
            element={
              <RequirePermission module="Productos">
                <MunicipalitiesListPage />
              </RequirePermission>
            }
          />
          <Route
            path="glaseados"
            element={
              <RequirePermission module="Productos">
                <FrostingsListPage />
              </RequirePermission>
            }
          />

          <Route path="sin-acceso" element={<NoAccessPage />} />
          <Route path="*" element={<NoAccessPage />} />
        </Route>
      </Route>
    </Routes>
  );
}


