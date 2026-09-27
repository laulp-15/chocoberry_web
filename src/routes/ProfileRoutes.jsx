// src/routes/ProfileRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// Componentes del perfil
import ProfileLayout from "../features/profile/layout/ProfileLayout";
import ProfileWelcome from "../features/profile/pages/ProfileWelcome";
import PersonalInfo from "../features/profile/components/PersonalInfo";
import UserOrders from "../features/profile/components/UserOrders";

export default function ProfileRoutes() {
  return (
    <Routes>
      <Route element={<ProfileLayout />}>
        {/* Redirige por defecto a listdomicilios si entran solo a /users */}
        <Route index element={<Navigate to="listdomicilios" replace />} />
        
        {/* Ruta principal de bienvenida y domicilios que estás buscando */}
        <Route path="listdomicilios" element={<ProfileWelcome />} />
        
        {/* Información personal (ver y editar) */}
        <Route path="informacion-personal" element={<PersonalInfo />} />
        
        {/* Mis Pedidos */}
        <Route path="orders" element={<UserOrders />} />
      </Route>
    </Routes>
  );
}