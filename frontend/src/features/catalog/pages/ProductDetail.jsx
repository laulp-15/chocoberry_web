// src/features/catalog/pages/ProductDetail.jsx
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@mui/material";
import { useCart } from "../../cart/hooks/UseCart";
import ProductGallery from "../components/ProductGallery";
import QuantitySelector from "../components/QuantitySelector";
import ColorSelector from "../components/ColorSelector";
import FeatureHighlights from "../components/FeatureHighlights";
import RelatedProducts from "../components/RelatedProducts";
import useProducto from "../hooks/useProducto";
import { formatPrice } from "../../../shared/utils/formatPrice";
import { CONTACT_MESSAGE } from "../../../shared/utils/orderRules";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const { producto, relacionados, presentaciones, glaseados, loading, error, reload } =
    useProducto(id);

  // Cantidad de fresas elegida; se ajusta a las presentaciones disponibles.
  const [quantity, setQuantity] = useState(12);
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
  const canAddToCart = Boolean(selectedPresentation && selectedColor);

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    const resultado = addItem(
      {
        productId: producto.id,
        name: producto.name,
        image: producto.image,
        quantity: selectedQuantity,
        presentationId: selectedPresentation.id,
        unitPrice: currentPrice,
        colorId: Number(selectedColor.id),
        color: selectedColor.label,
        colorHex: selectedColor.hex,
      },
      { fromPath: location.pathname }
    );
    // El carrito ya suma 20 unidades: no se agrega y se muestra el contacto.
    if (resultado?.limitReached) {
      setLimitAlertOpen(true);
      return;
    }
    // Si el usuario ya estaba logueado y se añadió al carrito, navegar al carrito
    if (resultado?.merged !== undefined) {
      navigate("/carrito", resultado.merged ? { state: { merged: true } } : undefined);
    }
    // Si no estaba logueado, addItem ya redirigió a login; el flush ocurrirá tras login
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
          <div className="col-12 col-lg-6">
            <div className="product-info">
              <h1 className="product-title">{producto.name}</h1>
              <div className="product-price">{formatPrice(currentPrice)}</div>
              <hr className="product-divider" />
              <p className="product-description">{producto.desc}</p>

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

              <Button
                className="btn-add-to-cart"
                variant="contained"
                disableRipple
                fullWidth
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                startIcon={<i className="fa-solid fa-cart-plus" />}
              >
                Añadir al Carrito
              </Button>
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
