// src/features/admin/orders/components/OrderProductLineForm.jsx
import FormSelect from "../../../../shared/components/FormSelect";
import FormSearchableSelect from "../../../../shared/components/FormSearchableSelect";
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

function toLineValues(line) {
  if (!line) return EMPTY_LINE;

  return {
    productoId: line.productoId != null ? String(line.productoId) : "",
    presentacionId:
      line.presentacionId != null ? String(line.presentacionId) : "",
    colorId: line.colorId != null ? String(line.colorId) : "",
    unidades: line.unidades != null ? String(line.unidades) : "1",
    mensajePersonalizado: line.mensajePersonalizado ?? "",
    personalizacionAdicional: line.personalizacionAdicional ?? "",
  };
}

function contarCaracteres(texto) {
  return Array.from(String(texto ?? "")).length;
}

/**
 * Formulario para configurar UN producto y agregarlo a la lista del pedido.
 * También se reutiliza para editar una línea existente: recibe `initialLine`,
 * precarga sus valores y emite `onUpdate` en lugar de `onAdd`.
 *
 * @param {object} props
 * @param {(line: object) => void} props.onAdd
 * @param {(line: object) => void} [props.onUpdate]
 * @param {() => void} [props.onCancelEdit]
 * @param {object} [props.initialLine] Línea que se está editando, si aplica.
 * @param {{ productos: object[], presentaciones: object[], glaseados: object[] }} props.options
 */
export default function OrderProductLineForm({
  onAdd,
  onUpdate,
  onCancelEdit,
  initialLine = null,
  options,
}) {
  const isEditing = Boolean(initialLine);

  // Se copian las listas para poder agregar temporalmente los valores actuales
  // de una línea antigua aunque su producto/presentación/glaseado ya esté
  // inactivo. Así el formulario no pierde la selección al abrir la edición.
  const productos = [...(options?.productos ?? [])];
  const presentaciones = [...(options?.presentaciones ?? [])];
  const glaseados = [...(options?.glaseados ?? [])];

  if (
    initialLine &&
    !productos.some(
      (producto) => String(producto.id) === String(initialLine.productoId)
    )
  ) {
    productos.push({
      id: initialLine.productoId,
      nombre: initialLine.productoNombre || "Producto actual",
      imagen: initialLine.productoImagen ?? "",
    });
  }

  if (
    initialLine &&
    !presentaciones.some(
      (presentacion) =>
        String(presentacion.id) === String(initialLine.presentacionId)
    )
  ) {
    presentaciones.push({
      id: initialLine.presentacionId,
      cantidadFresas: Number(initialLine.cantidadFresas ?? 0),
      precio: Number(initialLine.precioUnitario ?? 0),
    });
  }

  if (
    initialLine &&
    !glaseados.some(
      (glaseado) => String(glaseado.id) === String(initialLine.colorId)
    )
  ) {
    glaseados.push({
      id: initialLine.colorId,
      nombre: initialLine.colorNombre || "Color actual",
      hex: initialLine.colorHex ?? "",
    });
  }

  const { values: line, errors, setField, handleBlur, validateAll, reset } =
    useFormValidation({
      initialValues: toLineValues(initialLine),
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

  // Si la línea conserva producto, presentación y glaseado, se mantiene su
  // precio histórico. Al cambiar cualquiera de esos datos se muestra el precio
  // actual del catálogo, igual que lo validará el backend.
  const conservaDatosDePrecio =
    isEditing &&
    String(initialLine.productoId) === String(line.productoId) &&
    String(initialLine.presentacionId) === String(line.presentacionId) &&
    String(initialLine.colorId) === String(line.colorId);
  const precioUnitario = conservaDatosDePrecio
    ? Number(initialLine.precioUnitario ?? 0)
    : Number(presentacion?.precio ?? 0);

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

  const canSave =
    line.productoId &&
    line.presentacionId &&
    line.colorId &&
    Number(line.unidades) > 0 &&
    mensajeValido &&
    extraValido;

  const handleSubmit = () => {
    if (!validateAll()) return;

    const producto = productos.find(
      (p) => String(p.id) === String(line.productoId)
    );
    const glaseado = glaseados.find(
      (g) => String(g.id) === String(line.colorId)
    );
    if (!producto || !presentacion || !glaseado) return;

    const datosLinea = {
      productoId: producto.id,
      productoNombre: producto.nombre,
      productoImagen: producto.imagen,
      presentacionId: presentacion.id,
      cantidadFresas: presentacion.cantidadFresas,
      unidades: Number(line.unidades),
      precioUnitario,
      colorId: glaseado.id,
      colorNombre: glaseado.nombre,
      colorHex: glaseado.hex,
      mensajePersonalizado: line.mensajePersonalizado.trim(),
      personalizacionAdicional: line.personalizacionAdicional.trim(),
    };

    if (isEditing) {
      onUpdate?.(datosLinea);
      return;
    }

    onAdd(datosLinea);
    reset(EMPTY_LINE);
  };

  return (
    <div className="order-line-form">
      {isEditing && (
        <div className="order-line-form-title">
          <i className="fa-solid fa-pen" />
          Editando producto
        </div>
      )}

      <div className="order-line-form-grid">
        <FormSearchableSelect
          label="Producto"
          required
          value={line.productoId}
          onChange={(v) => update("productoId", v)}
          onBlur={() => handleBlur("productoId")}
          options={productoOptions}
          placeholder="Escribe para buscar un producto"
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
          {presentacion ? `Precio unitario: ${formatPrice(precioUnitario)}` : ""}
        </span>
        <div className="order-line-form-actions">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              className="btn-cancel-line"
              onClick={onCancelEdit}
            >
              Cancelar edición
            </button>
          )}
          <button
            type="button"
            className="btn-add-line"
            disabled={!canSave}
            onClick={handleSubmit}
          >
            <i className={`fa-solid ${isEditing ? "fa-check" : "fa-plus"}`} />
            {isEditing ? "Guardar cambios" : "Agregar producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
