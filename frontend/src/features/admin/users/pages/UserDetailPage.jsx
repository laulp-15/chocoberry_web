// src/features/admin/users/pages/UserDetailPage.jsx
import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useUsersAdmin from "../hooks/useUsersAdmin";
import RoleBadge from "../components/RoleBadge";
import { docTypeLabel } from "../../../../shared/utils/documentTypes";
import "./UserDetailPage.css";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, getUserById } = useUsersAdmin();
  const user = getUserById(id);

  // La lista se carga al entrar a la página (también por enlace directo),
  // así que esperamos a que termine antes de decidir que no existe.
  if (loading) {
    return (
      <div className="user-detail-page">
        <button type="button" className="user-detail-back" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left-long" /> Regresar al listado
        </button>
        <div className="user-detail-empty">
          <i className="fa-solid fa-spinner" />
          <p>Cargando el usuario...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail-page">
        <button type="button" className="user-detail-back" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left-long" /> Regresar al listado
        </button>
        <div className="user-detail-empty">
          <i className="fa-solid fa-circle-exclamation" />
          <p>
            {error || "No encontramos ese usuario. Puede que ya haya sido eliminado."}
          </p>
          <Link to="/admin/usuarios" className="btn-save" style={{ textDecoration: "none" }}>
            Ir al listado de usuarios
          </Link>
        </div>
      </div>
    );
  }

  const isActive = user.active !== false;

  // Nombres/apellidos: si el usuario es antiguo (solo fullName), los derivamos.
  const [derivedNombres, ...restName] = (user.fullName || "").trim().split(/\s+/);
  const nombres = user.nombres || derivedNombres || "";
  const apellidos = user.apellidos || restName.join(" ");
  const documento = user.idNumber
    ? `${docTypeLabel(user.docType)} ${user.idNumber}`.trim()
    : "—";

  // Iniciales para el avatar: nombres + apellidos, con respaldo en fullName.
  const rawInitials = `${nombres.charAt(0)}${apellidos.charAt(0)}`.trim();
  const initials = (rawInitials || user.fullName?.charAt(0) || "?").toUpperCase();

  return (
    <div className="user-detail-page">
      <button type="button" className="user-detail-back" onClick={() => navigate(-1)}>
        <i className="fa-solid fa-arrow-left-long" /> Regresar al listado
      </button>

      <div className="user-detail-heading-card">
        <span className="user-detail-avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="user-detail-heading-main">
          <h1 className="user-detail-name">{user.fullName}</h1>
          <p className="user-detail-email">
            <i className="fa-solid fa-envelope" /> {user.email}
          </p>
        </div>
        <div className="user-detail-heading-actions">
          <span className={`user-detail-status-pill ${isActive ? "is-active" : "is-inactive"}`}>
            {isActive ? "ACTIVO" : "INACTIVO"}
          </span>
        </div>
      </div>

      <div className="row user-detail-row">
        <div className="col-12 col-lg-6 user-detail-col">
          <div className="user-detail-card">
            <h2 className="user-detail-card-title">
              <i className="fa-solid fa-user" /> Datos personales
            </h2>
            <dl className="user-detail-fields">
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-user" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Nombres</dt>
                  <dd>{nombres || "—"}</dd>
                </div>
              </div>
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-user-tag" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Apellidos</dt>
                  <dd>{apellidos || "—"}</dd>
                </div>
              </div>
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-address-card" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Documento</dt>
                  <dd>{documento}</dd>
                </div>
              </div>
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-phone" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Teléfono</dt>
                  <dd>{user.phone || "—"}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>

        <div className="col-12 col-lg-6 user-detail-col">
          <div className="user-detail-card">
            <h2 className="user-detail-card-title">
              <i className="fa-solid fa-address-book" /> Contacto y cuenta
            </h2>
            <dl className="user-detail-fields">
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-location-dot" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Dirección</dt>
                  <dd>{user.address || "—"}</dd>
                </div>
              </div>
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-map" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Barrio</dt>
                  <dd>{user.neighborhood || "—"}</dd>
                </div>
              </div>
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-user-shield" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Rol de usuario</dt>
                  <dd>
                    <RoleBadge role={user.role} />
                  </dd>
                </div>
              </div>
              <div className="user-detail-field">
                <span className="user-detail-field-icon">
                  <i className="fa-solid fa-calendar" />
                </span>
                <div className="user-detail-field-body">
                  <dt>Fecha de creación</dt>
                  <dd>{formatDate(user.createdAt)}</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
