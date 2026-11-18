// src/features/catalog/pages/ProductDetail.jsx
import { useState, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { useCart } from "../../cart/hooks/UseCart";
import ProductGallery from "../components/ProductGallery";
import QuantitySelector from "../components/QuantitySelector";
import ColorSelector from "../components/ColorSelector";
import FeatureHighlights from "../components/FeatureHighlights";
import RelatedProducts from "../components/RelatedProducts";
import useProducto from "../hooks/useProducto";
import QuantityStepper from "../../../shared/components/QuantityStepper";
import { formatPrice } from "../../../shared/utils/formatPrice";
import {
  CONTACT_MESSAGE,
  MAX_CART_UNITS,
  totalUnidades,
} from "../../../shared/utils/orderRules";
import "./ProductDetail.css";

// Descripción recortada a 2 líneas; el botón "Ver más" solo aparece si el
// texto realmente se corta (se mide, así que se adapta a cualquier pantalla).
function ProductDescription({ text }) {
  const textRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return undefined;

    const measure = () => {
      if (expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, expanded]);

  return (
    <div className="product-description-wrap">
      <p
        ref={textRef}
        className={`product-description${expanded ? "" : " is-collapsed"}`}
      >
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          className={`product-description-toggle${expanded ? " is-open" : ""}`}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? "Ver menos" : "Ver más"}
          <i className="fa-solid fa-chevron-down" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { producto, relacionados, presentaciones, glaseados, loading, error, reload } =
    useProducto(id);

  // Cantidad de fresas elegida; se ajusta a las presentaciones disponibles.
  const [quantity, setQuantity] = useState(12);
  // Número de cajas/unidades que se añadirán al carrito.
  const [units, setUnits] = useState(1);
  const [color, setColor] = useState("");
  const [limitAlertOpen, setLimitAlertOpen] = useState(false);

  if (error) {
    return (
      <div className="detail-page">
        <div className="container detail-wrap">
          <p>{error}</p>
          <Button variant="outlined" onClick={reload}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="container detail-wrap">
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="detail-page">
        <div className="container detail-wrap">
          <p>No encontramos este producto.</p>
        </div>
      </div>
    );
  }

  const quantityOptions = presentaciones.map(
    (presentacion) => presentacion.cantidadFresas
  );
  const selectedQuantity = quantityOptions.includes(quantity)
    ? quantity
    : quantityOptions.includes(12)
      ? 12
      : (quantityOptions[0] ?? quantity);

  // El precio depende de la cantidad de fresas, no del producto.
  const selectedPresentation = presentaciones.find(
    (presentacion) => presentacion.cantidadFresas === selectedQuantity
  );
  const currentPrice = selectedPresentation?.precio ?? 0;
  const minPrice = presentaciones.length
    ? Math.min(...presentaciones.map((presentacion) => presentacion.precio))
    : 0;

  // Mantiene el rosa como opción inicial (como en el diseño original) y usa
  // el primer glaseado activo si ese color ya no existe.
  const defaultColor =
    glaseados.find((c) => (c.nombre ?? "").toLowerCase() === "rosa") ??
    glaseados[0];
  const selectedColor =
    glaseados.find((c) => c.value === color) ?? defaultColor;
  const selectedColorValue = selectedColor?.value ?? "";

  // Cupo disponible según las unidades que ya hay en el carrito.
  const totalEnCarrito = totalUnidades(items);
  const remainingUnits = Math.max(0, MAX_CART_UNITS - totalEnCarrito);
  const maxUnits = Math.max(1, remainingUnits);
  const selectedUnits = Math.min(Math.max(1, units), maxUnits);
  const canAddToCart = Boolean(
    selectedPresentation && selectedColor && remainingUnits > 0
  );

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    const resultado = addItem({
      productId: producto.id,
      name: producto.name,
      image: producto.image,
      quantity: selectedQuantity,
      presentationId: selectedPresentation.id,
      unitPrice: currentPrice,
      colorId: Number(selectedColor.id),
      color: selectedColor.label,
      colorHex: selectedColor.hex,
      units: selectedUnits,
    });
    // El carrito ya suma 20 unidades: no se agrega y se muestra el contacto.
    if (resultado?.limitReached) {
      setLimitAlertOpen(true);
      return;
    }
    // Se añadió al carrito (con o sin sesión), navegar al carrito.
    if (resultado?.merged !== undefined) {
      navigate("/carrito", resultado.merged ? { state: { merged: true } } : undefined);
    }
  };

  const handleRelatedViewDetail = (p) => {
    navigate(`/productos/${p.id}`);
  };

  const handleViewAll = () => {
    navigate("/productos");
  };

  return (
    <div className="detail-page">
      <div className="container detail-wrap">
        <div className="row detail-top">
          <div className="col-12 col-lg-6">
            <ProductGallery
              key={producto.id}
              images={producto.images}
              alt={producto.name}
            />
          </div>
          <div className="col-12 col-lg-6 detail-info-col">
            <div className="product-info">
              <h1 className="product-title">{producto.name}</h1>
              <div className="product-price">{formatPrice(currentPrice)}</div>
              <hr className="product-divider" />

              <ProductDescription key={producto.id} text={producto.desc} />

              <QuantitySelector
                options={quantityOptions}
                value={selectedQuantity}
                onChange={setQuantity}
              />

              <ColorSelector
                options={glaseados}
                value={selectedColorValue}
                onChange={setColor}
              />

              {glaseados.length === 0 && (
                <p className="form-error">
                  No hay colores de glaseado disponibles en este momento.
                </p>
              )}

              <div className="product-add-block">
                <div className="product-personalize-note" role="note">
                  <span className="product-personalize-icon" aria-hidden="true">
                    <i className="fa-solid fa-wand-magic-sparkles" />
                  </span>
                  <div className="product-personalize-body">
                    <p className="product-personalize-title">
                      ¡Personaliza tus fresas!
                    </p>
                    <p className="product-personalize-text">
                      <strong>
                        Si no ingresas letras, recibirás el diseño de la imagen
                        de referencia.
                      </strong>
                    </p>
                    <p className="product-personalize-hint">
                      Podrás escribirlas en el carrito: máximo{" "}
                      {selectedQuantity} letras (una por fresa).
                    </p>
                  </div>
                </div>

                <div className="selector-label">Cantidad de cajas</div>
                <div className="product-add-row">
                  <QuantityStepper
                    value={selectedUnits}
                    onChange={setUnits}
                    max={maxUnits}
                    disabled={remainingUnits <= 0}
                    ariaLabel="Cantidad de cajas"
                  />
                  <Button
                    className="btn-add-to-cart"
                    variant="contained"
                    disableRipple
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    startIcon={<i className="fa-solid fa-cart-plus" />}
                  >
                    Añadir al Carrito
                  </Button>
                </div>
                {remainingUnits <= 0 && (
                  <p className="product-limit-inline">{CONTACT_MESSAGE}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <FeatureHighlights />

        <RelatedProducts
          products={relacionados}
          minPrice={minPrice}
          onViewAll={handleViewAll}
          onViewDetail={handleRelatedViewDetail}
        />
      </div>

      {limitAlertOpen && (
        <div className="product-limit-alert" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>{CONTACT_MESSAGE}</span>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={() => setLimitAlertOpen(false)}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
    </div>
  );
}