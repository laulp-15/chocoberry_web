// src/routes/ProfileRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTopWrapper from "../shared/components/ScrollToTopWrapper";

// Componentes del perfil
import ProfileLayout from "../features/profile/layout/ProfileLayout";
import PersonalInfo from "../features/profile/components/PersonalInfo";
import UserOrders from "../features/profile/components/UserOrders";

export default function ProfileRoutes() {
  return (
    <Routes>
      <Route element={<ScrollToTopWrapper />}>
        <Route element={<ProfileLayout />}>
          {/* Redirige por defecto a orders (mis pedidos) si entran solo a /users */}
          <Route index element={<Navigate to="orders" replace />} />
          
          {/* Información personal (ver y editar) */}
          <Route path="informacion-personal" element={<PersonalInfo />} />
          
          {/* Mis Pedidos - ahora incluye mensaje de bienvenida */}
          <Route path="orders" element={<UserOrders />} />
        </Route>
      </Route>
    </Routes>
  );
}