// src/shared/components/PoliciesMenu.jsx
//
// Menú "Políticas" del header: despliega los documentos legales en PDF. Se
// abre al pasar el mouse, al enfocar con teclado o al pulsar (táctil).

import { useEffect, useRef, useState } from "react";
import { POLICY_DOCS } from "../utils/policyDocs";
import "./PoliciesMenu.css";

export default function PoliciesMenu() {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  // Cierra al hacer clic fuera o al pulsar Escape
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector(".pm__trigger")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="pm" ref={rootRef} data-open={open || undefined}>
      <button
        type="button"
        className="nav-link pm__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Políticas
        <i className="fa-solid fa-chevron-down pm__chevron" aria-hidden="true" />
      </button>

      <ul className="pm__panel">
        {POLICY_DOCS.map((doc) => (
          <li key={doc.id}>
            <a
              className="pm__item"
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <i className="fa-regular fa-file-pdf pm__file" aria-hidden="true" />
              <span className="pm__title">{doc.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
