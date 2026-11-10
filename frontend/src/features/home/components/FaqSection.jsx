
import { useState } from "react";
import { FAQS } from "../data/homeContent";
import "./FaqSection.css";

export default function FaqSection() {
  const [openId, setOpenId] = useState(null);

  return (
    <section
      className="faq"
      id="preguntas-frecuentes"
      aria-labelledby="faq-title"
    >
      <div className="home-head">
        <h2 className="home-title" id="faq-title">
          Preguntas frecuentes
        </h2>

        <p className="home-sub">
          Aquí resolvemos tus dudas sobre nuestros productos y pedidos.
        </p>
      </div>

      <div className="faq__list">
        {FAQS.map((item) => {
          const open = openId === item.id;

          return (
            <article
              key={item.id}
              className={`faq__item ${open ? "is-open" : ""}`}
            >
              <h3 className="faq__heading">
                <button
                  type="button"
                  className="faq__question"
                  aria-expanded={open}
                  aria-controls={`faq-panel-${item.id}`}
                  onClick={() =>
                    setOpenId(open ? null : item.id)
                  }
                >
                  <span>{item.question}</span>

                  <i
                    className="fa-solid fa-chevron-down faq__chevron"
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <div
                className="faq__panel"
                id={`faq-panel-${item.id}`}
                aria-hidden={!open}
              >
                <div className="faq__panel-inner">
                  <p>{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
