// src/features/reviews/components/ReviewFormModal.jsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./ReviewFormModal.css";

const RATING_COPY = {
  1: { label: "Muy mala", hint: "Lamentamos que no haya sido lo que esperabas. Cuéntanos qué pasó." },
  2: { label: "Mala", hint: "Gracias por decírnoslo, queremos mejorar." },
  3: { label: "Regular", hint: "Cuéntanos cómo podemos hacerlo mejor." },
  4: { label: "Buena", hint: "¡Nos alegra! Cuéntanos qué podríamos mejorar." },
  5: { label: "¡Excelente!", hint: "¡Gracias! Nos alegra haber endulzado tu momento." },
};

const MAX_COMMENT = 300;
const EMPTY_FORM = { clientName: "", rating: 1, comment: "" };

/**
 * Modal para publicar una reseña.
 * - Las estrellas empiezan con UNA sola rellena; el cliente debe elegir su calificación
 *   (si intenta publicar sin elegir, se le avisa).
 * - Al publicar muestra una pantalla de agradecimiento y se cierra sola.
 * - Se renderiza en un portal sobre el <body>, así queda por encima de todo.
 *
 * onSubmit recibe: { clientName, rating, comment, date, tag }
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(review: object) => void} props.onSubmit
 */
export default function ReviewFormModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState(false); // ¿ya eligió una calificación?
  const [errors, setErrors] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  const [selectTick, setSelectTick] = useState(0);
  const [sent, setSent] = useState(false);

  const cardRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Al abrir: formulario limpio, foco en el modal, cierre con Escape y sin scroll de fondo.
  useEffect(() => {
    if (!isOpen) return undefined;

    setForm(EMPTY_FORM);
    setTouched(false);
    setErrors({});
    setHoverRating(0);
    setSent(false);
    cardRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Tras publicar, la pantalla de agradecimiento se cierra sola.
  useEffect(() => {
    if (!sent) return undefined;
    const timer = setTimeout(() => onCloseRef.current(), 2600);
    return () => clearTimeout(timer);
  }, [sent]);

  if (!isOpen) return null;

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const selectRating = (star) => {
    update("rating", star);
    setTouched(true);
    setSelectTick((t) => t + 1);
  };

  const validate = () => {
    const newErrors = {};
    if (!touched) newErrors.rating = "Elige cuántas estrellas le das a tu experiencia.";
    if (!form.clientName.trim()) newErrors.clientName = "Cuéntanos tu nombre.";
    if (!form.comment.trim()) newErrors.comment = "Escribe un comentario sobre tu pedido.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!validate()) return;

    onSubmit({
      clientName: form.clientName.trim(),
      rating: form.rating,
      comment: form.comment.trim(),
      date: "Hoy",
      tag: "Cliente Satisfecho",
    });
    setSent(true);
  };

  const shownRating = hoverRating || form.rating;
  const copy = hoverRating
    ? RATING_COPY[hoverRating]
    : touched
    ? RATING_COPY[form.rating]
    : { label: "¿Cómo fue tu experiencia?", hint: "Toca una estrella para calificar." };

  const firstName = form.clientName.trim().split(" ")[0];

  const modalContent = (
    <div className="review-modal-overlay" onClick={onClose}>
      <div
        ref={cardRef}
        tabIndex={-1}
        className="review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-modal-inner">
          {sent ? (
            /* ---------- PANTALLA DE AGRADECIMIENTO ---------- */
            <div className="review-success">
              <div className="review-success-icon">
                <i className="fa-solid fa-circle-check" aria-hidden="true" />
              </div>
              <h2 id="review-modal-title" className="review-success-title">
                ¡Gracias{firstName ? `, ${firstName}` : ""}!
              </h2>
              <p className="review-success-text">
                Tu reseña ya está publicada y nos ayuda a seguir endulzando momentos.
              </p>
              <button type="button" className="review-submit" onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* ---------- ENCABEZADO ---------- */}
              <div className="review-modal-header">
                <button
                  type="button"
                  className="review-modal-close"
                  onClick={onClose}
                  aria-label="Cerrar"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>

                <div className="review-modal-badge">
                  <i className="fa-solid fa-heart" aria-hidden="true" />
                </div>
                <h2 id="review-modal-title" className="review-modal-title">
                  Tu opinión nos inspira
                </h2>
                <p className="review-modal-subtitle">
                  Cuéntanos qué tal fue tu experiencia con ChocoBerry
                </p>
              </div>

              {/* ---------- FORMULARIO ---------- */}
              <form className="review-modal-body" onSubmit={handleSubmit} noValidate>
                {/* Calificación */}
                <div className="review-rating">
                  <div
                    className="review-stars"
                    role="radiogroup"
                    aria-label="Calificación"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = shownRating >= star;
                      const selected = touched && form.rating === star;
                      return (
                        <button
                          type="button"
                          key={star}
                          role="radio"
                          aria-checked={selected}
                          aria-label={`${star} de 5 estrellas`}
                          className={`review-star-btn ${selected ? "is-selected" : ""}`}
                          onClick={() => selectRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                        >
                          {/* El key cambia al elegir, para repetir la animación "pop" */}
                          <i
                            key={selected ? `sel-${selectTick}` : `star-${star}`}
                            className={`${active ? "fa-solid" : "fa-regular"} fa-star ${
                              active ? "is-on" : "is-off"
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p
                    className={`review-rating-label ${touched || hoverRating ? "is-set" : ""}`}
                    aria-live="polite"
                  >
                    {copy.label}
                  </p>
                  <p className="review-rating-hint">{copy.hint}</p>

                  {errors.rating && (
                    <p className="review-error review-error--center">
                      <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                      {errors.rating}
                    </p>
                  )}
                </div>

                {/* Nombre */}
                <div className="review-field">
                  <label className="review-label" htmlFor="review-name">
                    Tu nombre
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    className={`review-input ${errors.clientName ? "has-error" : ""}`}
                    placeholder="Ej. María Camila"
                    value={form.clientName}
                    onChange={(e) => update("clientName", e.target.value)}
                    autoComplete="name"
                  />
                  {errors.clientName && (
                    <p className="review-error">
                      <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                      {errors.clientName}
                    </p>
                  )}
                </div>

                {/* Comentario */}
                <div className="review-field">
                  <label className="review-label" htmlFor="review-comment">
                    Tu reseña
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    maxLength={MAX_COMMENT}
                    className={`review-input review-textarea ${errors.comment ? "has-error" : ""}`}
                    placeholder="¿Qué fue lo que más te gustó de tu pedido?"
                    value={form.comment}
                    onChange={(e) => update("comment", e.target.value)}
                  />
                  <div className="review-textarea-footer">
                    {errors.comment ? (
                      <p className="review-error">
                        <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                        {errors.comment}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span
                      className={`review-counter ${
                        form.comment.length >= MAX_COMMENT - 20 ? "is-near" : ""
                      }`}
                    >
                      {form.comment.length}/{MAX_COMMENT}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="review-actions">
                  <button type="button" className="review-cancel" onClick={onClose}>
                    Cancelar
                  </button>
                  <button type="submit" className="review-submit">
                    Publicar reseña
                    <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}