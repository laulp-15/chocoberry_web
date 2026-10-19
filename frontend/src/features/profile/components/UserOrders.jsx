// src/features/profile/components/UserOrders.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../login/hooks/useAuth';
import { formatPrice } from '../../../shared/utils/formatPrice';
import { COLOR_OPTIONS } from '../../catalog/data/Colors';
import { PRODUCTS, getProductById } from '../../catalog/data/Products';
import { PRICE_BY_QUANTITY, getPriceByQuantity } from '../../catalog/data/Pricing';
import { MUNICIPIOS, getShippingCost } from '../../cart/data/Shipping';

const UserOrders = () => {
  const { theme } = useOutletContext();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const [expandedOrders, setExpandedOrders] = useState({});
  const [hoveredOrder, setHoveredOrder] = useState(null);

  const [orders] = useState([
    {
      id: '1024',
      date: '15 Sep 2026',
      status: 'Despachado',
      municipio: 'envigado',
      items: [
        {
          cartItemId: 'item-1',
          productId: 'caja-romance',
          name: 'Caja Romance',
          quantity: 12,
          color: 'Rosa',
          units: 1,
          decorativeMessage: 'Feliz Aniversario mi amor',
          extraCustomization: 'Empaque premium con lazo dorado',
        },
        {
          cartItemId: 'item-2',
          productId: 'ramo-dulce-mama',
          name: 'Ramo Dulce Mamá',
          quantity: 6,
          color: 'Blanco',
          units: 1,
          decorativeMessage: '',
          extraCustomization: 'Tarjeta: "Para la mejor mamá"',
        },
      ],
    },
    {
      id: '1019',
      date: '02 Sep 2026',
      status: 'Entregado',
      municipio: 'bello',
      items: [
        {
          cartItemId: 'item-3',
          productId: 'ramo-dulce-mama',
          name: 'Ramo Dulce Mamá',
          quantity: 8,
          color: 'Blanco',
          units: 1,
          decorativeMessage: 'Te quiero mucho mamá',
          extraCustomization: 'Chocolate blanco con sprinkles rosados',
        },
      ],
    },
    {
      id: '1005',
      date: '20 Ago 2026',
      status: 'Entregado',
      municipio: 'itagui',
      items: [
        {
          cartItemId: 'item-4',
          productId: 'set-fuerza-papa',
          name: 'Set Fuerza Papá',
          quantity: 16,
          color: 'Chocolate',
          units: 1,
          decorativeMessage: 'Feliz Dia Papa Eres mi heroe',
          extraCustomization: 'Caja de madera grabada whisky mini',
        },
        {
          cartItemId: 'item-5',
          productId: 'caja-clasica-papa',
          name: 'Caja Clásica Papá',
          quantity: 12,
          color: 'Rosa',
          units: 1,
          decorativeMessage: '',
          extraCustomization: '',
        },
      ],
    },
  ]);

  const colors = {
    title: '#d90429',
    primary: '#d90429',
    primaryHover: '#e63946',
    border: isDark ? '#3d2c30' : '#fde2e4',
    borderActive: '#d90429',
    emptyText: isDark ? '#b8a3a7' : '#888',
    cardBg: isDark ? '#23161a' : '#fff5f6',
    cardBorder: isDark ? '#3d2c30' : '#fde2e4',
    textMain: isDark ? '#f7f1f2' : '#4a4a4a',
    textTotal: isDark ? '#f7f1f2' : '#2b2d42',
    textDate: isDark ? '#b8a3a7' : '#8c7a6b',
    textMuted: isDark ? '#b8a3a7' : '#6c757d',
    inputBg: isDark ? '#181013' : '#ffffff',
    inputBorder: isDark ? '#3d2c30' : '#fde2e4',
    badgeDeliveredBg: isDark ? '#1a3a2a' : '#d8f3dc',
    badgeDeliveredText: isDark ? '#52b788' : '#2d6a4f',
    badgeTransitBg: isDark ? '#3a2a1a' : '#ffe8d6',
    badgeTransitText: isDark ? '#f4a261' : '#bc6c25',
    accordionBg: isDark ? '#1a1215' : '#fafafa',
    divider: isDark ? '#3d2c30' : '#fde2e4',
  };

  const getColorHex = (colorName) => {
    const found = COLOR_OPTIONS.find(c => c.label.toLowerCase() === colorName.toLowerCase());
    return found ? found.hex : '#d90429';
  };

  const getProductImage = (productId) => {
    const product = getProductById(productId);
    return product ? product.image : null;
  };

  const getMunicipioLabel = (value) => {
    const found = MUNICIPIOS.find(m => m.value === value);
    return found ? found.label : value;
  };

  const calculateOrderTotal = (order) => {
    const priceByQuantity = {
      6: 45000,
      8: 55000,
      12: 85000,
      16: 95000,
    };
    return order.items.reduce((sum, item) => {
      const basePrice = priceByQuantity[item.quantity] || 85000;
      return sum + basePrice * item.units;
    }, 0);
  };

  const getStatusColors = (status) => {
    const statusConfig = {
      Entregado: { bg: '#2E8B571F', text: '#2E8B57' },
      Despachado: { bg: '#24943C1F', text: '#24943C' },
    };
    const cfg = statusConfig[status] || { bg: colors.badgeTransitBg, text: colors.badgeTransitText };
    return cfg;
  };

  const renderOrderItems = (items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {items.map((item) => {
        const colorHex = getColorHex(item.color);
        const productImage = getProductImage(item.productId);

        return (
          <div key={item.cartItemId} style={{
            display: 'flex',
            gap: '16px',
            padding: '16px',
            background: colors.cardBg,
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '10px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              flexShrink: 0,
              borderRadius: '8px',
              overflow: 'hidden',
              background: colors.inputBg,
              border: `1px solid ${colors.inputBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {productImage ? (
                <img
                  src={productImage}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: colorHex,
                }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{
                    margin: '0 0 4px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: colors.textMain,
                  }}>
                    {item.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '25px', fontSize: '13px', color: colors.textMuted }}>
                    <span>Cantidad: <strong style={{ color: colors.textMain }}>{item.quantity} fresas</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>Glaseado:</strong>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: colorHex,
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                      <span style={{ textTransform: 'capitalize' }}>{item.color}</span>
                    </span>
                    <span style={{ fontSize: '13px', color: colors.textMain, fontWeight: '600' }}>
                      {formatPrice(getPriceByQuantity(item.quantity) * item.units)}
                    </span>
                  </div>
                </div>
              </div>

              {item.decorativeMessage && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  background: isDark ? '#2d1e22' : '#fff0f1',
                  borderRadius: '8px',
                  border: `1px solid ${colors.divider}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Mensaje decorativo (chocolate)
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMain, fontStyle: 'italic', lineHeight: 1.4 }}>
                        "{item.decorativeMessage}"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {item.extraCustomization && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  background: isDark ? '#2d1e22' : '#fff8f0',
                  borderRadius: '8px',
                  border: `1px solid ${colors.divider}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Personalización extra
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMain, lineHeight: 1.4 }}>
                        {item.extraCustomization}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderOrderSummary = (order, orderTotal) => {
    const shippingCost = getShippingCost(order.municipio);
    const municipioLabel = getMunicipioLabel(order.municipio);
    const totalWithShipping = orderTotal + shippingCost;

    return (
      <div style={{
        padding: '16px',
        background: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        marginTop: '8px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: `1px solid ${colors.divider}`,
          marginBottom: '12px',
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textMain }}>
            Resumen del pedido
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.textMain }}>
            <span>Subtotal ({order.items.length} producto{order.items.length > 1 ? 's' : ''})</span>
            <strong style={{ color: colors.textTotal }}>{formatPrice(orderTotal)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.textMain }}>
            <span>Envío a {municipioLabel}</span>
            <strong style={{ color: colors.textTotal }}>{formatPrice(shippingCost)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', color: colors.textTotal, paddingTop: '8px', borderTop: `1px solid ${colors.divider}` }}>
            <span>Total</span>
            <span>{formatPrice(totalWithShipping)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderExpandedContent = (order) => {
    const orderTotal = calculateOrderTotal(order);
    return (
      <div style={{ paddingTop: '20px' }}>
        {renderOrderItems(order.items)}
        {renderOrderSummary(order, orderTotal)}
      </div>
    );
  };

  return (
    <div>
      {/* Mensaje de bienvenida */}
      <div style={{ textAlign: 'left', marginBottom: '30px' }}>
        <h1 style={{ color: colors.title, fontSize: '28px', marginBottom: '15px', fontWeight: '800' }}>
          Bienvenida, {user?.fullName || 'Usuario'}!
        </h1>
        <p style={{ color: colors.textMain, lineHeight: '1.7', fontSize: '16px', transition: 'color 0.3s ease' }}>
          ¡Qué alegría tenerte nuevamente en Chocoberry! En este espacio podrás hacer seguimiento a tus pedidos, consultar tus compras y verificar su estado.
        </p>
      </div>

      {/* Divisor sin título */}
      <div style={{
        borderBottom: `2px solid ${colors.border}`,
        marginBottom: '20px',
      }} />

      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: colors.emptyText, marginTop: '40px', fontSize: '16px' }}>
          NO HAY DOMICILIOS
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {orders.map((order) => {
            const isExpanded = expandedOrders[order.id] === true;
            const orderTotal = calculateOrderTotal(order);
            const statusColors = getStatusColors(order.status);

            const currentBorderColor = isExpanded
              ? colors.borderActive
              : colors.cardBorder;

            const currentBoxShadow = isExpanded
              ? (isDark
                ? '0 4px 16px rgba(217,4,41,0.12)'
                : '0 4px 16px rgba(217,4,41,0.08)')
              : 'none';

            const isHovered = hoveredOrder === order.id;

            const hoverBorderColor = isHovered
              ? colors.primary
              : currentBorderColor;

            const hoverBoxShadow = isHovered
              ? (isDark
                ? '0 6px 20px rgba(217,4,41,0.16)'
                : '0 6px 20px rgba(217,4,41,0.10)')
              : currentBoxShadow;

            const hoverTransform = isHovered
              ? 'translateY(-2px)'
              : 'none';

            const cardBg = colors.cardBg;


            return (
              <div key={order.id} style={{
                border: `1.5px solid ${hoverBorderColor}`,
                borderRadius: '12px',
                background: cardBg,
                boxShadow: hoverBoxShadow,
                overflow: 'hidden',
                transform: hoverTransform,
                transition: 'all 0.3s ease',
                padding: '18px 20px',

              }}
                onMouseEnter={() => setHoveredOrder(order.id)}
                onMouseLeave={() => setHoveredOrder(null)}
              >
                <button
                  type="button"
                  onClick={() => setExpandedOrders(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '0',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'none',
                  }}
                >
                  <div>
                    <strong style={{ color: colors.primary, fontSize: '16px' }}>Pedido #{order.id}</strong>
                    <p style={{ margin: '4px 0 2px', fontSize: '14px', color: colors.textMain, fontWeight: '600' }}>
                      {order.items.length} producto{order.items.length > 1 ? 's' : ''}
                    </p>
                    <span style={{ fontSize: '13px', color: colors.textDate }}>Fecha: {order.date}</span>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: colors.textTotal, fontSize: '16px' }}>
                      {formatPrice(orderTotal)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '12px',
                        background: statusColors.bg,
                        color: statusColors.text,
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap'
                      }}>
                        {order.status}
                      </span>
                      <i
                        className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}
                        style={{
                          fontSize: '14px',
                          color: isHovered ? colors.primary : colors.textMuted,
                          transition: 'transform 0.3s ease, color 0.3s ease',
                          transform: isExpanded ? 'rotate(180deg)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                </button>


                <div style={{
                  maxHeight: isExpanded ? '2000px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-out',
                  padding: isExpanded ? '16px 0 0' : '0',
                  background: 'transparent',
                  borderTop: 'none',
                }}>
                  {isExpanded && renderExpandedContent(order)}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
