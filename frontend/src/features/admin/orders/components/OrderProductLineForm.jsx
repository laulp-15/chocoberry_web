// src/features/admin/orders/components/OrderProductLineForm.jsx
import { useRef } from "react";
import FormSelect from "../../../../shared/components/FormSelect";
import FormTextField from "../../../../shared/components/FormTextField";
import useFormValidation from "../../../../shared/hooks/useFormValidation";
import { formatPrice } from "../../../../shared/utils/formatPrice";
import "./OrderProductLineForm.css";

const EMPTY_LINE = {
  productoId: "",
  presentacionId: "",
  colorId: "",
  unidades: "1",
  mensajePersonalizado: "",
  personalizacionAdicional: "",
};

function contarCaracteres(texto) {
  return Array.from(String(texto ?? "")).length;
}

/**
 * Formulario para configurar UN producto y agregarlo a la lista del pedido.
 * No mantiene la lista en sí — solo emite `onAdd(line)` con la línea armada.
 *
 * @param {object} props
 * @param {(line: object) => void} props.onAdd
 * @param {{ productos: object[], presentaciones: object[], glaseados: object[] }} props.options
 */
export default function OrderProductLineForm({ onAdd, options }) {
  const productos = options?.productos ?? [];
  const presentaciones = options?.presentaciones ?? [];
  const glaseados = options?.glaseados ?? [];
  const nextLineId = useRef(0);

  const { values: line, errors, setField, handleBlur, validateAll, reset } =
    useFormValidation({
      initialValues: EMPTY_LINE,
      validators: {
        productoId: (l) => (l.productoId ? "" : "El producto es obligatorio."),
        presentacionId: (l) =>
          l.presentacionId ? "" : "La presentación es obligatoria.",
        colorId: (l) => (l.colorId ? "" : "El color de glaseado es obligatorio."),
        unidades: (l) => {
          const numero = Number(l.unidades);
          if (!String(l.unidades ?? "").trim()) {
            return "La cantidad es obligatoria.";
          }
          if (!Number.isInteger(numero) || numero <= 0) {
            return "La cantidad debe ser un entero mayor que cero.";
          }
          if (numero > 100) return "La cantidad máxima por línea es 100.";
          return "";
        },
        mensajePersonalizado: (l) => {
          const presentacion = presentaciones.find(
            (p) => String(p.id) === String(l.presentacionId)
          );
          const maximo = presentacion?.cantidadFresas ?? 255;
          if (contarCaracteres(l.mensajePersonalizado) > maximo) {
            return `Máximo ${maximo} caracteres para esta presentación (una letra por fresa).`;
          }
          return "";
        },
        personalizacionAdicional: (l) =>
          contarCaracteres(l.personalizacionAdicional) > 255
            ? "La personalización adicional no puede superar los 255 caracteres."
            : "",
      },
      immediate: ["productoId", "presentacionId", "colorId"],
    });

  const update = (field, value) => setField(field, value);

  const presentacion = presentaciones.find(
    (p) => String(p.id) === String(line.presentacionId)
  );
  const maxMensaje = presentacion?.cantidadFresas ?? 255;
  const mensajeValido = contarCaracteres(line.mensajePersonalizado) <= maxMensaje;
  const extraValido = contarCaracteres(line.personalizacionAdicional) <= 255;

  const productoOptions = productos.map((producto) => ({
    value: String(producto.id),
    label: producto.nombre,
  }));
  const presentacionOptions = presentaciones.map((item) => ({
    value: String(item.id),
    label: `${item.cantidadFresas} fresas — ${formatPrice(item.precio)}`,
  }));
  const colorOptions = glaseados.map((glaseado) => ({
    value: String(glaseado.id),
    label: glaseado.nombre,
  }));

  const canAdd =
    line.productoId &&
    line.presentacionId &&
    line.colorId &&
    Number(line.unidades) > 0 &&
    mensajeValido &&
    extraValido;

  const handleAdd = () => {
    if (!validateAll()) return;

    const producto = productos.find(
      (p) => String(p.id) === String(line.productoId)
    );
    const glaseado = glaseados.find(
      (g) => String(g.id) === String(line.colorId)
    );
    if (!producto || !presentacion || !glaseado) return;

    onAdd({
      lineId: `nueva-${nextLineId.current++}`,
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoImagen: producto.imagen,
      presentacionId: presentacion.id,
      cantidadFresas: presentacion.cantidadFresas,
      unidades: Number(line.unidades),
      precioUnitario: presentacion.precio,
      colorId: glaseado.id,
      colorNombre: glaseado.nombre,
      colorHex: glaseado.hex,
      mensajePersonalizado: line.mensajePersonalizado.trim(),
      personalizacionAdicional: line.personalizacionAdicional.trim(),
    });

    reset(EMPTY_LINE);
  };

  return (
    <div className="order-line-form">
      <div className="order-line-form-grid">
        <FormSelect
          label="Producto"
          required
          value={line.productoId}
          onChange={(v) => update("productoId", v)}
          onBlur={() => handleBlur("productoId")}
          options={productoOptions}
          placeholder="Selecciona un producto"
          error={errors.productoId}
        />
        <FormSelect
          label="Presentación"
          required
          value={line.presentacionId}
          onChange={(v) => update("presentacionId", v)}
          onBlur={() => handleBlur("presentacionId")}
          options={presentacionOptions}
          placeholder="Fresas y precio"
          error={errors.presentacionId}
        />
        <FormSelect
          label="Color de glaseado"
          required
          value={line.colorId}
          onChange={(v) => update("colorId", v)}
          onBlur={() => handleBlur("colorId")}
          options={colorOptions}
          placeholder="Selecciona un color"
          error={errors.colorId}
        />
        <FormTextField
          label="Cantidad"
          type="number"
          required
          value={line.unidades}
          onChange={(v) => update("unidades", v)}
          onBlur={() => handleBlur("unidades")}
          error={errors.unidades}
        />
      </div>

      <FormTextField
        label="Mensaje decorativo (chocolate)"
        value={line.mensajePersonalizado}
        onChange={(v) => update("mensajePersonalizado", v)}
        onBlur={() => handleBlur("mensajePersonalizado")}
        placeholder={
          presentacion
            ? `Máximo ${maxMensaje} caracteres (una letra por fresa)`
            : "Ej: TE AMO"
        }
        error={errors.mensajePersonalizado}
      />
      <FormTextField
        label="Personalización extra"
        value={line.personalizacionAdicional}
        onChange={(v) => update("personalizacionAdicional", v)}
        onBlur={() => handleBlur("personalizacionAdicional")}
        placeholder="Ej: quitar decoraciones de mariposa"
        multiline
        minRows={1}
        error={errors.personalizacionAdicional}
      />

      <div className="order-line-form-footer">
        <span className="order-line-unit-price">
          {presentacion
            ? `Precio unitario: ${formatPrice(presentacion.precio)}`
            : ""}
        </span>
        <button
          type="button"
          className="btn-add-line"
          disabled={!canAdd}
          onClick={handleAdd}
        >
          <i className="fa-solid fa-plus" />
          Agregar producto
        </button>
      </div>
    </div>
  );
}
