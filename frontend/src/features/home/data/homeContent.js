// src/features/home/data/homeContent.js
// Contenido estático del Home (textos que no vienen del API).

// Cuántos productos como máximo se muestran en el carrusel del Home
export const CATALOG_CAROUSEL_LIMIT = 12;

// Cantidad de productos que muestra la sección "Los más vendidos". El backend
// entrega como máximo 4 según las ventas reales.
export const BEST_SELLER_COUNT = 4;

export const ORDER_STEPS = [
  { id: "registro", icon: "fa-user-plus", title: "Regístrate en la página", text: "Crea tu cuenta." },
  { id: "catalogo", icon: "fa-book-open", title: "Mira el catálogo", text: "Elige entre nuestros productos." },
  { id: "productos", icon: "fa-cart-plus", title: "Agrega al carrito", text: "Define cantidad, color y mensaje." },
  { id: "pedido", icon: "fa-clipboard-list", title: "Crea tu pedido", text: "Confirma y edita tus datos." },
  { id: "pago", icon: "fa-money-bill-transfer", title: "Realiza el pago", text: "Cancelas completo y por transferencia." },
  { id: "entrega", icon: "fa-truck-fast", title: "Espera la entrega", text: "Lo recibes en la fecha elegida." },
];



export const FAQS = [
  {
    id: "domicilios",
    question: "¿Hacen domicilios?",
    answer:
      "Sí, tenemos cobertura en el Valle de Aburrá: Medellín, Bello, Copacabana, Envigado, Itagüí, La Estrella y Sabaneta. El costo del envío se determina según el destino.",
  },
  {
    id: "tiempo",
    question: "¿Cuánto tiempo se demora en llegar el pedido?",
    answer:
      "Una vez realizado el pedido, se despacha en la fecha escojida, en los horarios de la tarde, de 1:00 p. m. a 7:00 p. m.",
  },
  {
    id: "pago",
    question: "¿Cómo se realiza el pago?",
    answer:
      "El pago se realiza completo y por transferencia, mediante consignación a nuestra cuenta Nequi. Actualmente no manejamos tarjetas de crédito (Visa, MasterCard, American Express, Diners), tarjetas débito (cuenta corriente o de ahorros) ni cheques posfechados.",
  },
  {
    id: "ausente",
    question: "¿Qué pasa si estoy ausente en el momento de la entrega?",
    answer:
      "Quien reciba el pedido en la dirección indicada debe ser mayor de edad. Si prefieres que se entregue en portería, escríbelo en las indicaciones de entrega. Cuando el pedido llegue debe haber alguien que lo reciba; de lo contrario, se reprogramará la entrega para el día siguiente.",
  },
  {
    id: "estado",
    question: "¿Cómo verifico el estado de mi pedido?",
    answer:
      "Inicia sesión con tu usuario y clave, entra a «Mi cuenta» (arriba a la derecha) y abre la opción «Mis pedidos». Allí verás todos los pedidos que has hecho con su estado.",
  },
  {
    id: "maximo",
    question: "¿Cuántas unidades máximas puedo llevar por cada producto?",
    answer: "El máximo es de 20 unidades diarias.",
  },
];

