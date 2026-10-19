
// src/routes/AdminRoutes.jsx

import { Routes, Route } from "react-router-dom";
import ScrollToTopWrapper from "../shared/components/ScrollToTopWrapper";

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
        <Route index element={<DashboardPage />} />

         {/* Crear/Editar rol es un modal dentro de RolesListPage (RoleFormModal),
          no una ruta aparte — por eso aquí solo hay una entrada para "roles". */}
      <Route
        path="roles"
        element={
          <RolesProvider>
            <RolesListPage />
          </RolesProvider>
        }
      />
        
       {/* Usuarios y accesos */}

        <Route path="usuarios" element={<UsersListPage />} />
        <Route path="usuarios/:id" element={<UserDetailPage />} />


        {/* Catálogo de productos */}
        <Route path="categorias" element={<CategoriesListPage />} />
        <Route path="productos" element={<ProductsListPage />} />
        

        {/* Pedidos y ventas */}
        <Route path="pedidos" element={<OrdersListPage />} />
        <Route path="ventas" element={<SalesListPage />} />
        <Route path="ventas/:id" element={<SaleDetailPage />} />

         <Route path="entregas" element={<DeliveriesListPage />} />
         <Route path="clientes" element={<CustomersListPage />} />
         <Route path="resenas" element={<ReviewsListPage />} />

        {/* Configuraciones */}
        <Route path="presentaciones" element={<PresentationsListPage />} />
        <Route path="municipios" element={<MunicipalitiesListPage />} />
        <Route path="glaseados" element={<FrostingsListPage />} />

      </Route>
      </Route>
    </Routes>
  );
}

