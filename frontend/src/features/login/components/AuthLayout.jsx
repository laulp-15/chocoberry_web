// src/features/login/components/AuthLayout.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../../shared/context/ThemeContext";
import "./AuthLayout.css";

// Textos por defecto del panel visual. Cada página puede sobreescribirlos.
const DEFAULT_VISUAL = {
  title: "Dulzura que se siente.",
  quote:
    "Las fresas llegaron perfectas: el sabor y la presentación superaron lo que esperaba.",
  author: "Cliente ChocoBerry",
  role: "Reseña de cliente",
};

// El panel visual siempre es chocolate (oscuro), así que lleva
// la versión del logo pensada para fondos oscuros.
const VISUAL_LOGO_SRC = "/img/Login/logo_login.png  ";

/**
 * Recuerda si la página anterior usaba el layout ancho (registro).
 * Como cada página monta su propio <AuthLayout>, este valor permite
 * arrancar con el ancho anterior y animar hasta el nuevo.
 */
let lastWide = null;

export default function AuthLayout({
  variant = "split",
  wide = false,
  image,
  imageAlt = "Chocoberry",
  visualTitle = DEFAULT_VISUAL.title,
  visualQuote = DEFAULT_VISUAL.quote,
  visualAuthor = DEFAULT_VISUAL.author,
  visualRole = DEFAULT_VISUAL.role,
  title,
  subtitle,
  children,
  footer,
}) {
  const { theme } = useTheme();

  const targetWide = variant === "split" && Boolean(wide);

  // Empieza con el ancho de la página anterior (si existe) y luego pasa
  // al ancho real: la transición CSS hace el resto.
  const [isWide, setIsWide] = useState(lastWide ?? targetWide);

  useEffect(() => {
    lastWide = targetWide;

    // Doble rAF: garantiza que el navegador pinte el estado inicial
    // antes de aplicar el final, si no la transición no se dispara.
    let frame2;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => setIsWide(targetWide));
    });

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
    };
  }, [targetWide]);

  // Logo del formulario (solo se ve cuando no hay panel visual:
  // vista centrada o pantallas pequeñas).
  const formLogoSrc =
    theme === "dark"
      ? "/img/Logo/LogoDark_2.png"
      : "/img/Login/logo_login.png";

  const showVisual = variant === "split" && image;

  return (
    <main
      className={`auth-layout auth-layout--${variant} ${
        isWide ? "auth-layout--wide" : ""
      }`}
      data-theme={theme}
    >
      <div className="auth-container">
        {/* ================= PANEL DEL FORMULARIO (izquierda) ================= */}
        <section className="auth-panel">
          <div className="auth-panel-inner">
            {/* Con panel visual, el logo vive allí; esta barra solo
                aparece en pantallas pequeñas (CSS) o sin panel visual. */}
            <div
              className={`auth-panel-topbar ${
                showVisual ? "auth-panel-topbar--with-visual" : ""
              }`}
            >
              <Link
                to="/"
                className="auth-logo-link"
                aria-label="Ir al inicio de Chocoberry"
              >
                <img src={formLogoSrc} alt="Chocoberry" className="auth-logo" />
              </Link>
            </div>

            {(title || subtitle) && (
              <header className="auth-panel-header">
                {title && <h1 className="auth-panel-title">{title}</h1>}
                {subtitle && (
                  <p className="auth-panel-subtitle">{subtitle}</p>
                )}
              </header>
            )}

            <div className="auth-panel-content">{children}</div>

            {footer && (
              <footer className="auth-panel-footer">{footer}</footer>
            )}
          </div>
        </section>

        {/* ================= PANEL VISUAL (derecha) ================= */}
        {showVisual && (
          <aside className="auth-visual">
            {/* Foto: anclada arriba, no se re-escala si la tarjeta crece */}
            <div className="auth-visual-media">
              <img
                src={image}
                alt={imageAlt}
                className="auth-visual-image"
              />
            </div>

            {/* Degradado de color: cubre toda la tarjeta */}
            <div className="auth-visual-overlay" />

            <div className="auth-visual-content">
              {/* Fila superior: estrella a la izquierda, logo centrado */}
              <div className="auth-visual-top">
                <span className="auth-visual-badge" aria-hidden="true">
                  <i className="fa-solid fa-star" />
                </span>

                <Link
                  to="/"
                  className="auth-visual-logo-link"
                  aria-label="Ir al inicio de Chocoberry"
                >
                  <img
                    src={VISUAL_LOGO_SRC}
                    alt="Chocoberry"
                    className="auth-visual-logo"
                  />
                </Link>
              </div>

              <div className="auth-visual-body">
                <h2 className="auth-visual-title">{visualTitle}</h2>

                <figure className="auth-visual-quote">
                  <blockquote>“{visualQuote}”</blockquote>

                  <figcaption className="auth-visual-author">
                    <i
                      className="fa-solid fa-circle-user auth-visual-avatar"
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{visualAuthor}</strong>
                      <small>{visualRole}</small>
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}