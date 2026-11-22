// src/features/admin/sales/components/SalesReportModal.jsx
// Modal para generar el reporte de ventas en Excel con rangos rápidos,
// validaciones y vista previa.
import { useEffect, useState } from "react";
import Modal from "../../../../shared/components/Modal";
import DatePicker from "../../../../shared/components/DatePicker";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import * as saleService from "../services/saleService";
import {
  RANGOS_RAPIDOS_REPORTE,
  calcularRangosRapidos,
  fechaHoyColombia,
  formatearFechaCorta,
  validarRangoReporte,
} from "../utils/salesReportRanges";
import "./SalesReportModal.css";

export default function SalesReportModal({ open, onClose }) {
  const [rango, setRango] = useState("hoy");
  const [fechas, setFechas] = useState(() => calcularRangosRapidos().hoy);
  const [previewState, setPreviewState] = useState({ key: "", data: null, error: "" });
  const [descargando, setDescargando] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const { desde, hasta } = fechas;
  const clave = `${desde}|${hasta}`;
  const hoy = fechaHoyColombia();
  const validationError = validarRangoReporte(desde, hasta, hoy);

  useEffect(() => {
    if (!open || validationError) return undefined;

    let activo = true;

    saleService
      .obtenerVistaPreviaReporte({ desde, hasta })
      .then((datos) => {
        if (activo) setPreviewState({ key: clave, data: datos, error: "" });
      })
      .catch((err) => {
        if (activo) {
          setPreviewState({
            key: clave,
            data: null,
            error: err?.message || "No se pudo calcular la vista previa.",
          });
        }
      });

    return () => {
      activo = false;
    };
  }, [open, desde, hasta, clave, validationError]);

  const handleRango = (id) => {
    setRango(id);
    setDownloadError("");

    if (id !== "personalizado") {
      setFechas(calcularRangosRapidos()[id]);
    }
  };

  const handleFecha = (campo, valor) => {
    setRango("personalizado");
    setFechas((actual) => ({ ...actual, [campo]: valor }));
    setDownloadError("");
  };

  const preview = previewState.key === clave ? previewState.data : null;
  const previewError = previewState.key === clave ? previewState.error : "";
  const loadingPreview =
    !validationError && !preview && !previewError && previewState.key !== clave;
  const hayVentas = Boolean(preview && preview.resumen.ventas > 0);
  const puedeDescargar =
    !validationError && !loadingPreview && !descargando && hayVentas;

  const handleDescargar = async () => {
    if (!puedeDescargar) return;

    setDownloadError("");
    setDescargando(true);

    try {
      await saleService.descargarReporteVentas({ desde, hasta });
      onClose?.();
    } catch (err) {
      setDownloadError(err?.message || "No se pudo descargar el reporte.");
    } finally {
      setDescargando(false);
    }
  };

  const footer = (
    <>
      <button type="button" className="report-btn-cancel" onClick={onClose}>
        Cancelar
      </button>
      <button
        type="button"
        className="report-btn-download"
        onClick={handleDescargar}
        disabled={!puedeDescargar}
      >
        <i
          className={`fa-solid ${
            descargando ? "fa-spinner fa-spin" : "fa-file-excel"
          }`}
        />
        {descargando ? "Descargando..." : "Descargar Excel"}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Exportar reporte de ventas"
      maxWidth="sm"
      footer={footer}
    >
      <div className="report-section">
        <span className="report-section-label">Rango</span>
        <div className="report-ranges" role="group" aria-label="Rango del reporte">
          {RANGOS_RAPIDOS_REPORTE.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              className={`report-range ${rango === opcion.id ? "is-active" : ""}`}
              onClick={() => handleRango(opcion.id)}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      </div>

      {rango === "personalizado" ? (
        <div className="report-dates">
          <DatePicker
            label="Desde"
            value={desde}
            onChange={(valor) => handleFecha("desde", valor)}
            maxDate={hoy}
          />
          <DatePicker
            label="Hasta"
            value={hasta}
            onChange={(valor) => handleFecha("hasta", valor)}
            maxDate={hoy}
          />
        </div>
      ) : (
        <p className="report-date-summary">
          Del {formatearFechaCorta(desde)} al {formatearFechaCorta(hasta)}
        </p>
      )}

      {validationError && (
        <p className="report-validation" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {validationError}
        </p>
      )}

      {!validationError && (
        <div className="report-preview" aria-live="polite">
          {loadingPreview && (
            <p className="report-preview-loading">
              <i className="fa-solid fa-spinner fa-spin" /> Calculando vista previa...
            </p>
          )}

          {!loadingPreview && previewError && (
            <p className="report-validation" role="alert">
              <i className="fa-solid fa-triangle-exclamation" /> {previewError}
            </p>
          )}

          {!loadingPreview && !previewError && preview && (
            hayVentas ? (
              <div className="report-preview-result">
                <strong>
                  {preview.resumen.ventas} ventas · {formatPrice(preview.resumen.total)}
                </strong>
                <span>{preview.resumen.canceladas} canceladas</span>
              </div>
            ) : (
              <p className="report-no-sales">No hay ventas en este rango</p>
            )
          )}
        </div>
      )}

      {downloadError && (
        <p className="report-validation" role="alert">
          <i className="fa-solid fa-triangle-exclamation" /> {downloadError}
        </p>
      )}
    </Modal>
  );
}
