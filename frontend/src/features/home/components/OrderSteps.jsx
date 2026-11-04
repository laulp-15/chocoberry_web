// src/features/home/components/OrderSteps.jsx
// "Cómo hacer tu pedido": pasos con iconos en un carrusel horizontal.

import ScrollRail from "./ScrollRail";
import { ORDER_STEPS } from "../data/homeContent";
import "./OrderSteps.css";

export default function OrderSteps() {
  return (
    <section className="order-steps">
      <div className="home-head" data-reveal>
        <h2 className="home-title">Proceso de compra</h2>
        
      </div>

      <ScrollRail label="Creemos tu pedido">
        {ORDER_STEPS.map((step, index) => (
          <article key={step.id} className="order-step">
            <div className="order-step__icon" data-reveal="zoom" style={{ "--reveal-delay": `${index * 110}ms` }}>
              <i className={`fa-solid ${step.icon}`} aria-hidden="true" />
              <span className="order-step__num">{index + 1}</span>
            </div>
            <h3 className="order-step__title">{step.title}</h3>
            <p className="order-step__text">{step.text}</p>
          </article>
        ))}
      </ScrollRail>
    </section>
  );
}
