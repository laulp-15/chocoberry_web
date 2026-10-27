// src/shared/pages/NoAccessPage.jsx
import { Link, useLocation } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import "./NoAccessPage.css";

export default function NoAccessPage() {
  const { firstAllowedPath, roleName } = usePermissions();
  const location = useLocation();
  const rutaSolicitada = location.state?.from;

  return (
    <div className="no-access-page">
      <div className="no-access-card">
        <span className="no-access-icon" aria-hidden="true">
          <i className="fa-solid fa-lock" />
        </span>
        <h1>Sin acceso a este módulo</h1>
        <p>
          {roleName
            ? `El rol ${roleName} no tiene los permisos necesarios`
            : "Tu rol no tiene los permisos necesarios"}{" "}
          para ver esta sección.
          {rutaSolicitada ? " Puedes continuar desde otra área del panel." : ""}
        </p>
        <div className="no-access-actions">
          <Link className="no-access-primary" to={firstAllowedPath || "/admin"}>
            Volver al panel
          </Link>
          <Link className="no-access-secondary" to="/productos">
            Ir a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
