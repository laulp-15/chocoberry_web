import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* 1. LOGO */}
          <div className="footer-col">
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
          </div>

          {/* 2. NAVEGACIÓN */}
          <div className="footer-col">
            <h4 className="footer-title">Navegación</h4>
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/productos">Catálogo de Productos</Link></li>
              <li><Link to="/conocenos">Sobre Nosotros</Link></li>
              <li><Link to="/reseñas">Reseñas de Clientes</Link></li>
            </ul>
          </div>

          {/* 3. CONTACTO */}
          <div className="footer-col">
            <h4 className="footer-title">Contacto</h4>
            <ul className="footer-contact">
              <li>
                <i className="fa-solid fa-location-dot" />
                <span>Medellín, Colombia</span>
              </li>
              <li>
                <i className="fa-solid fa-phone" />
                <span>+57 300 000 0000</span>
              </li>
            </ul>

            <h5 className="footer-subtitle">Síguenos</h5>
            <div className="footer-social">
              <a
                href="https://www.instagram.com/fresasmedellin_?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram - @fresasmedellin_"
              >
                <i className="fa-brands fa-instagram" />
              </a>
              <a
                href="https://www.tiktok.com/@fresasmedellin?is_from_webapp=1&sender_device=pc"
                target="_blank"
                rel="noopener noreferrer"
                title="TikTok - @fresasmedellin"
              >
                <i className="fa-brands fa-tiktok" />
              </a>
            </div>
          </div>

          {/* 4. HORARIOS */}
          <div className="footer-col">
            <h4 className="footer-title footer-title-icon">
              
              Horarios
            </h4>
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
          </div>

          {/* 5. DESARROLLADORES */}
          <div className="footer-col">
            <h4 className="footer-title footer-title-icon">
              
              Desarrolladores
            </h4>
            <ul className="footer-developers">
              <li>Ana María Mesa E.</li>
              <li>Laura Sofia Ulloa P.</li>
              <li>Mariana Cardona M.</li>
            </ul>
          </div>
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
