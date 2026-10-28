// src/features/admin/orders/components/OrderStatusSelector.jsx
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { getNextStatuses, getStatusMeta } from "../data/orderStatus";
import "./OrderStatusBadge.css";

const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;

function getMenuPosition(trigger, menu) {
  const triggerRect = trigger.getBoundingClientRect();
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;

  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const shouldOpenUp =
    spaceBelow < menuHeight + MENU_GAP + VIEWPORT_MARGIN &&
    spaceAbove > spaceBelow;

  const maxLeft = Math.max(
    VIEWPORT_MARGIN,
    window.innerWidth - menuWidth - VIEWPORT_MARGIN
  );
  const maxTop = Math.max(
    VIEWPORT_MARGIN,
    window.innerHeight - menuHeight - VIEWPORT_MARGIN
  );

  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, triggerRect.left),
    maxLeft
  );
  const desiredTop = shouldOpenUp
    ? triggerRect.top - menuHeight - MENU_GAP
    : triggerRect.bottom + MENU_GAP;

  return {
    left,
    top: Math.min(Math.max(VIEWPORT_MARGIN, desiredTop), maxTop),
  };
}

export default function OrderStatusSelector({
  status,
  onChange,
  disabled,
  lockedReason,
  canReject = true,
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const meta = getStatusMeta(status);

  // Solo las transiciones que acepta el backend. "Rechazado" se aplica por
  // el endpoint de rechazo (con motivo), no por el cambio de estado normal.
  const options = disabled
    ? []
    : getNextStatuses(status).filter(
        (value) => value !== "rechazado" || canReject
      );

  useEffect(() => {
    function handleClickOutside(e) {
      const insideTrigger = ref.current?.contains(e.target);
      const insideMenu = menuRef.current?.contains(e.target);
      if (!insideTrigger && !insideMenu) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;

    function updatePosition() {
      if (!ref.current || !menuRef.current) return;
      setMenuPosition(getMenuPosition(ref.current, menuRef.current));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  if (options.length === 0) {
    return (
      <span
        className="order-status-badge"
        style={{
          color: meta.color,
          backgroundColor: `${meta.color}1F`,
          cursor: "default",
        }}
        title={lockedReason}
      >
        {meta.label}
      </span>
    );
  }

  return (
    <div className="order-status-selector" ref={ref}>
      <span
        className="order-status-badge"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (disabled || (e.key !== "Enter" && e.key !== " ")) return;
          e.preventDefault();
          setOpen((o) => !o);
        }}
        style={{
          color: meta.color,
          backgroundColor: `${meta.color}1F`,
          cursor: disabled ? "default" : "pointer",
        }}
        title={disabled ? lockedReason : "Seleccionar estado"}
      >
        {meta.label}
        {!disabled && (
          <i
            className="fa-solid fa-chevron-down"
            style={{ marginLeft: "4px", fontSize: "10px" }}
          />
        )}
      </span>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="order-status-dropdown"
            style={{
              left: menuPosition?.left ?? 0,
              top: menuPosition?.top ?? 0,
              visibility: menuPosition ? "visible" : "hidden",
            }}
          >
            {options.map((optValue) => {
              const opt = getStatusMeta(optValue);
              const isCurrent = optValue === status;
              return (
                <button
                  key={optValue}
                  type="button"
                  className={`order-status-option ${isCurrent ? "current" : ""}`}
                  onClick={() => {
                    onChange(optValue);
                    setOpen(false);
                  }}
                  disabled={isCurrent}
                  style={{
                    color: opt.color,
                    opacity: isCurrent ? 0.5 : 1,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
