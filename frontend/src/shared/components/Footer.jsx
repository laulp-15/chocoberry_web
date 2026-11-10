// src/shared/components/Footer.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const MOBILE_QUERY = "(max-width: 768px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isMobile;
}

/* Redes sociales (se reutiliza en escritorio y móvil) */
function SocialLinks() {
  return (
    <div className="footer-social">
      <a
        href="https://www.instagram.com/fresasmedellin_?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
        target="_blank"
        rel="noopener noreferrer"
        title="Instagram - @fresasmedellin_"
        aria-label="Instagram"
      >
        <i className="fa-brands fa-instagram" />
      </a>
      <a
        href="https://www.tiktok.com/@fresasmedellin?is_from_webapp=1&sender_device=pc"
        target="_blank"
        rel="noopener noreferrer"
        title="TikTok - @fresasmedellin"
        aria-label="TikTok"
      >
        <i className="fa-brands fa-tiktok" />
      </a>
    </div>
  );
}

/* Sección del footer: columna fija en escritorio, desplegable en móvil */
function FooterSection({ id, title, isMobile, isOpen, onToggle, titleClass = "", children }) {
  const open = isMobile && isOpen;

  return (
    <div className={`footer-col footer-section ${open ? "is-open" : ""}`}>
      <h4 className={`footer-title ${titleClass}`}>
        <button
          type="button"
          className="footer-toggle"
          id={`footer-toggle-${id}`}
          aria-expanded={isMobile ? open : undefined}
          aria-controls={`footer-panel-${id}`}
          onClick={() => isMobile && onToggle(id)}
          tabIndex={isMobile ? 0 : -1}
        >
          <span className="footer-toggle-label">{title}</span>
          <i className="fa-solid fa-chevron-down footer-chevron" aria-hidden="true" />
        </button>
      </h4>

      <div
        className="footer-collapse"
        id={`footer-panel-${id}`}
        role="region"
        aria-labelledby={`footer-toggle-${id}`}
      >
        <div className="footer-collapse-inner">
          <div className="footer-collapse-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  const isMobile = useIsMobile();
  const [openId, setOpenId] = useState(null);

  const handleToggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* 1. MARCA: logo + descripción + redes (escritorio/tablet) */}
          <div className="footer-col footer-brand">
            <Link to="/" className="footer-logo-link">
              <img
                src="/img/Logo/LogoDark_2.png"
                alt="ChocoBerry"
                className="footer-logo"
              />
            </Link>
            <p className="footer-description">
              Detalles artesanales y fresas cubiertas con chocolate de alta
              calidad para endulzar momentos especiales.
            </p>

            {/* Redes: solo escritorio/tablet (en móvil van al final) */}
            <div className="footer-social-desktop">
              <h5 className="footer-subtitle">Síguenos</h5>
              <SocialLinks />
            </div>
          </div>

          {/* 2. NAVEGACIÓN */}
          <FooterSection
            id="navegacion"
            title="Navegación"
            isMobile={isMobile}
            isOpen={openId === "navegacion"}
            onToggle={handleToggle}
          >
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/productos">Catálogo de Productos</Link></li>
              <li><Link to="/conocenos">Sobre Nosotros</Link></li>
              <li><Link to="/reseñas">Reseñas de Clientes</Link></li>
            </ul>
          </FooterSection>

          {/* 3. CONTACTO */}
          <FooterSection
            id="contacto"
            title="Contacto"
            isMobile={isMobile}
            isOpen={openId === "contacto"}
            onToggle={handleToggle}
          >
            <ul className="footer-contact">
              <li>
                <i className="fa-solid fa-location-dot" />
                <span>Medellín, Colombia</span>
              </li>
              <li>
                <i className="fa-solid fa-phone" />
                <span>+57 316 499 8627</span>
              </li>
            </ul>
          </FooterSection>

          {/* 4. HORARIOS */}
          <FooterSection
            id="horarios"
            title="Horarios"
            titleClass="footer-title-icon"
            isMobile={isMobile}
            isOpen={openId === "horarios"}
            onToggle={handleToggle}
          >
            <div className="footer-hours">
              <div>
                <p className="footer-hours-label">Atención</p>
                <p className="footer-hours-time">7:00 a. m. - 12:00 p. m.</p>
              </div>
              <div>
                <p className="footer-hours-label">Entregas</p>
                <p className="footer-hours-time">1:00 p. m. - 7:00 p. m.</p>
              </div>
            </div>
          </FooterSection>

          {/* 5. DESARROLLADORES */}
          <FooterSection
            id="desarrolladores"
            title="Desarrolladores"
            titleClass="footer-title-icon"
            isMobile={isMobile}
            isOpen={openId === "desarrolladores"}
            onToggle={handleToggle}
          >
            <ul className="footer-developers">
              <li>Ana María Mesa E.</li>
              <li>Laura Sofia Ulloa P.</li>
              <li>Mariana Cardona M.</li>
            </ul>
          </FooterSection>
        </div>

        {/* REDES  */}
        <div className="footer-social-mobile">
          <SocialLinks />
        </div>

        {/* DERECHOS DE AUTOR */}
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ChocoBerry. Hecho con amor</span>
          <span>para endulzar tus días.</span>
        </div>
      </div>
    </footer>
  );
}