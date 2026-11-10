// src/shared/components/FormSearchableSelect.jsx
import { Autocomplete, TextField } from "@mui/material";
import "./FormFields.css";
import "./FormAutocomplete.css";

/** Normaliza texto para buscar sin distinguir mayúsculas ni acentos. */
function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Select "buscable": igual que un FormSelect normal (solo se puede elegir
 * una de las opciones reales, no texto libre), pero además permite escribir
 * para filtrar la lista mientras se busca. Úsalo cuando el campo debe
 * quedar ligado a un valor real (ej. un producto del catálogo) — para un
 * campo de texto libre con sugerencias (ej. nombre de cliente), usa
 * FormAutocomplete en su lugar.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value - el `value` de la opción seleccionada (ej. el id del producto)
 * @param {(value: string) => void} props.onChange
 * @param {{ value: string, label: string }[]} props.options
 * @param {string} [props.placeholder]
 * @param {string} [props.noOptionsText]
 * @param {string} [props.error]
 * @param {boolean} [props.required]
 * @param {() => void} [props.onBlur] - se dispara al salir del campo.
 */
export default function FormSearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Escribe para buscar...",
  noOptionsText = "Sin resultados",
  error,
  required,
  onBlur,
}) {
  const selectedOption =
    options.find((opt) => String(opt.value) === String(value)) ?? null;

  // Búsqueda insensible a mayúsculas y acentos sobre el label visible.
  const filtrarOpciones = (lista, { inputValue }) => {
    const busqueda = normalizarTexto(inputValue);
    if (!busqueda) return lista;
    return lista.filter((opt) =>
      normalizarTexto(opt.label).includes(busqueda)
    );
  };

  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label} {required && "*"}
        </label>
      )}
      <Autocomplete
        className={`form-autocomplete ${error ? "has-error" : ""}`}
        options={options}
        value={selectedOption}
        filterOptions={filtrarOpciones}
        noOptionsText={noOptionsText}
        getOptionLabel={(opt) => opt?.label ?? ""}
        isOptionEqualToValue={(opt, val) =>
          String(opt?.value) === String(val?.value)
        }
        onChange={(_, newValue) => onChange(newValue?.value ?? "")}
        onBlur={onBlur}
        renderInput={(params) => (
          <TextField {...params} className="form-input" placeholder={placeholder} />
        )}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}