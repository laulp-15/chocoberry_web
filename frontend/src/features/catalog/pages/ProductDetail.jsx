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
import { COLOR_OPTIONS } from "../data/Colors";
import { formatPrice } from "../../../shared/utils/formatPrice";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const { producto, relacionados, presentaciones, loading, error, reload } =
    useProducto(id);

  // Cantidad de fresas elegida; se ajusta a las presentaciones disponibles.
  const [quantity, setQuantity] = useState(12);
  const [color, setColor] = useState("rosa");

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

  const selectedColor = COLOR_OPTIONS.find((c) => c.value === color);

  const handleAddToCart = () => {
    const { merged } = addItem(
      {
        productId: producto.id,
        name: producto.name,
        image: producto.image,
        quantity: selectedQuantity,
        color: selectedColor?.label ?? color,
        colorHex: selectedColor?.hex,
      },
      { fromPath: location.pathname }
    );
    // Si el usuario ya estaba logueado y se añadió al carrito, navegar al carrito
    if (merged !== undefined) {
      navigate("/carrito", merged ? { state: { merged: true } } : undefined);
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
              images={producto.image ? [producto.image] : []}
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
                options={COLOR_OPTIONS}
                value={color}
                onChange={setColor}
              />

              <Button
                className="btn-add-to-cart"
                variant="contained"
                disableRipple
                fullWidth
                onClick={handleAddToCart}
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
    </div>
  );
}
