// src/features/admin/orders/components/ReprogramDeliveryControl.jsx
import { useState } from "react";
import { Popover } from "@mui/material";
import ConfirmModal from "../../../../shared/components/ConfirmModal";
import { formatDisplayDate, formatLongDate } from "../utils/orderDisplay";
import {
  canReprogramOrder,
  getReprogramDateOptions,
} from "../utils/orderReprogram";

/**
 * Botón y confirmación para reprogramar la entrega de un pedido cancelado.
 *
 * @param {object} props
 * @param {object} props.order
 * @param {(fechaEntrega: string) => Promise<void>} props.onReprogram
 * @param {boolean} [props.submitting]
 */
export default function ReprogramDeliveryControl({
  order,
  onReprogram,
  submitting = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const canReprogram = canReprogramOrder(order) && Boolean(onReprogram);

  if (!canReprogram) return null;

  const options = getReprogramDateOptions();
  const optionsOpen = Boolean(anchorEl);

  const handleSelectDate = (fechaEntrega) => {
    setAnchorEl(null);
    setSelectedDate(fechaEntrega);
  };

  const handleConfirm = async () => {
    if (!selectedDate) return;
    await onReprogram(selectedDate);
  };

  return (
    <div className="reprogram-delivery">
      <button
        type="button"
        className="reprogram-delivery-btn"
        onClick={(event) =>
          setAnchorEl((actual) => (actual ? null : event.currentTarget))
        }
        disabled={submitting}
        aria-haspopup="dialog"
        aria-expanded={optionsOpen}
        aria-controls={optionsOpen ? "reprogram-delivery-options" : undefined}
      >
        <i className="fa-solid fa-calendar-plus" />
        Reprogramar entrega
      </button>

      <Popover
        id="reprogram-delivery-options"
        open={optionsOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: { className: "reprogram-delivery-popover" },
        }}
      >
        <div className="reprogram-delivery-options">
          <div className="reprogram-delivery-options-header">
            <span className="reprogram-delivery-options-icon">
              <i className="fa-solid fa-calendar-days" />
            </span>
            <div>
              <strong>Nueva fecha de entrega</strong>
              <span>Elige una de las opciones disponibles</span>
            </div>
          </div>

          <div className="reprogram-delivery-date-list">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className="reprogram-delivery-date"
                onClick={() => handleSelectDate(option.value)}
                disabled={submitting}
              >
                <span className="reprogram-delivery-date-icon">
                  <i className="fa-solid fa-calendar" />
                </span>
                <span className="reprogram-delivery-date-text">
                  <strong>{option.label}</strong>
                  <span>{formatDisplayDate(option.value)}</span>
                </span>
                <i className="fa-solid fa-chevron-right reprogram-delivery-date-arrow" />
              </button>
            ))}
          </div>
        </div>
      </Popover>

      <ConfirmModal
        open={Boolean(selectedDate)}
        onClose={() => setSelectedDate("")}
        onConfirm={handleConfirm}
        variant="warning"
        title="¿Reprogramar la entrega?"
        description={`El pedido se entregará el ${formatLongDate(
          selectedDate
        )} y su estado se actualizará a Despachado.`}
        confirmLabel="Sí, reprogramar"
      />
    </div>
  );
}
