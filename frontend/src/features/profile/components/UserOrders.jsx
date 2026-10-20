// src/features/profile/components/UserOrders.jsx
//
// "Mis pedidos" del cliente contra el API real (/api/pedidos/mios). Muestra
// las líneas con los precios históricos del pedido, el domicilio congelado al
// crearlo y el estado actual. No recalcula totales: los usa tal como los
// devuelve el backend.
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../login/hooks/useAuth';
import { formatPrice } from '../../../shared/utils/formatPrice';
import * as orderService from '../../orders/services/orderService';

const STATUS_STYLES = {
  Pendiente: { bg: '#F59E0B1F', text: '#B45309' },
  'En preparación': { bg: '#3B82F61F', text: '#2563EB' },
  Despachado: { bg: '#24943C1F', text: '#24943C' },
  Entregado: { bg: '#2E8B571F', text: '#2E8B57' },
  Rechazado: { bg: '#DC26261F', text: '#B91C1C' },
  Cancelado: { bg: '#6B72801F', text: '#4B5563' },
};

function formatFecha(value) {
  if (!value) return '—';

  const texto = String(value);
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? new Date(`${texto}T00:00:00`)
    : new Date(texto);

  if (Number.isNaN(fecha.getTime())) return texto;

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(fecha)
    .replace('.', '');
}

const UserOrders = () => {
  const { theme } = useOutletContext();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [createdOrderId, setCreatedOrderId] = useState(
    () => location.state?.pedidoCreado ?? null
  );

  const [expandedOrders, setExpandedOrders] = useState({});
  const [hoveredOrder, setHoveredOrder] = useState(null);

  useEffect(() => {
    let activo = true;

    orderService
      .listarMios()
      .then((lista) => {
        if (!activo) return;
        setOrders(lista);
        setError('');
      })
      .catch((err) => {
        if (!activo) return;
        setError(err?.message || 'No se pudieron cargar tus pedidos.');
      })
      .finally(() => {
        if (activo) setLoading(false);
      });

    return () => {
      activo = false;
    };
  }, [reloadToken]);

  // Tras crear un pedido, el checkout navega aquí con el id. El aviso se
  // inicializa desde el estado de navegación y este se limpia de la historia.
  useEffect(() => {
    if (!location.state?.pedidoCreado) return;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  const reload = () => {
    setLoading(true);
    setError('');
    setReloadToken((valor) => valor + 1);
  };

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
    divider: isDark ? '#3d2c30' : '#fde2e4',
    successBg: isDark ? '#173225' : '#e7f7ee',
    successBorder: isDark ? '#2f6b4f' : '#b7e4c7',
    successText: isDark ? '#8fd6b4' : '#1b5e3f',
  };

  const getStatusColors = (status) =>
    STATUS_STYLES[status] ?? { bg: colors.cardBg, text: colors.textMuted };

  const renderOrderItems = (lineas) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {lineas.map((linea) => (
        <div key={linea.id} style={{
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
            {linea.imagen ? (
              <img
                src={linea.imagen}
                alt={linea.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: linea.colorHex || colors.primary,
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
                  {linea.nombre}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '13px', color: colors.textMuted }}>
                  <span>Cantidad: <strong style={{ color: colors.textMain }}>{linea.cantidadFresas} fresas</strong></span>
                  {linea.colorNombre && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>Glaseado:</strong>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: linea.colorHex || colors.primary,
                        border: '1px solid rgba(0,0,0,0.1)',
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                      <span style={{ textTransform: 'capitalize' }}>{linea.colorNombre}</span>
                    </span>
                  )}
                  <span>Unidades: <strong style={{ color: colors.textMain }}>{linea.unidades}</strong></span>
                  <span style={{ color: colors.textMain, fontWeight: '600' }}>
                    {formatPrice(linea.subtotal)}
                  </span>
                </div>
              </div>
            </div>

            {linea.mensajePersonalizado && (
              <div style={{
                marginTop: '10px',
                padding: '10px 12px',
                background: isDark ? '#2d1e22' : '#fff0f1',
                borderRadius: '8px',
                border: `1px solid ${colors.divider}`,
              }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mensaje decorativo (chocolate)
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMain, fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{linea.mensajePersonalizado}"
                </p>
              </div>
            )}

            {linea.personalizacionAdicional && (
              <div style={{
                marginTop: '10px',
                padding: '10px 12px',
                background: isDark ? '#2d1e22' : '#fff8f0',
                borderRadius: '8px',
                border: `1px solid ${colors.divider}`,
              }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Personalización extra
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMain, lineHeight: 1.4 }}>
                  {linea.personalizacionAdicional}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDeliveryInfo = (order) => {
    const filas = [
      ['Fecha de entrega', formatFecha(order.fechaEntrega)],
      ['Dirección', `${order.direccion}${order.barrio ? `, ${order.barrio}` : ''}`],
      ['Recibe', `${order.nombreReceptor}${order.telefonoReceptor ? ` · ${order.telefonoReceptor}` : ''}`],
    ];

    if (order.instruccionesEntrega) {
      filas.push(['Instrucciones', order.instruccionesEntrega]);
    }
    if (order.mensajeTarjeta) {
      filas.push(['Mensaje de tarjeta', `"${order.mensajeTarjeta}"`]);
    }
    if (order.motivoRechazo) {
      filas.push(['Motivo del rechazo', order.motivoRechazo]);
    }

    return (
      <div style={{
        padding: '16px',
        background: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '10px',
        marginTop: '12px',
      }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textMain, marginBottom: '10px' }}>
          Datos de entrega
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filas.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.5 }}>
              <span style={{ color: colors.textMuted, minWidth: '120px' }}>{label}</span>
              <span style={{
                color: label === 'Motivo del rechazo' ? '#B91C1C' : colors.textMain,
                fontWeight: label === 'Motivo del rechazo' ? '600' : 'normal',
              }}>
                {value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOrderSummary = (order) => (
    <div style={{
      padding: '16px',
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '10px',
      marginTop: '12px',
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
          <span>Subtotal ({order.lineas.length} producto{order.lineas.length > 1 ? 's' : ''})</span>
          <strong style={{ color: colors.textTotal }}>{formatPrice(order.subtotal)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: colors.textMain }}>
          <span>Envío a {order.municipio || '—'}</span>
          <strong style={{ color: colors.textTotal }}>{formatPrice(order.precioDomicilio)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', color: colors.textTotal, paddingTop: '8px', borderTop: `1px solid ${colors.divider}` }}>
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>
    </div>
  );

  const renderExpandedContent = (order) => (
    <div style={{ paddingTop: '20px' }}>
      {renderOrderItems(order.lineas)}
      {renderDeliveryInfo(order)}
      {renderOrderSummary(order)}
    </div>
  );

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

      {createdOrderId && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          marginBottom: '20px',
          borderRadius: '10px',
          background: colors.successBg,
          border: `1px solid ${colors.successBorder}`,
          color: colors.successText,
        }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: '20px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '14px' }}>
              Pedido #{createdOrderId} creado correctamente
            </strong>
            <span style={{ fontSize: '13px' }}>
              Tu pedido quedó registrado y está pendiente de confirmación.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCreatedOrderId(null)}
            style={{ border: 'none', background: 'transparent', color: colors.successText, cursor: 'pointer' }}
            aria-label="Cerrar aviso"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: '#fdecee',
          border: '1px solid #f5c2c7',
          color: '#842029',
          fontSize: '14px',
        }}>
          <i className="fa-solid fa-triangle-exclamation" />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={reload}
            style={{ border: 'none', background: 'transparent', color: '#842029', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      )}

      <div style={{ borderBottom: `2px solid ${colors.border}`, marginBottom: '20px' }} />

      {loading ? (
        <p style={{ textAlign: 'center', color: colors.emptyText, marginTop: '40px', fontSize: '16px' }}>
          Cargando tus pedidos...
        </p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: colors.emptyText, fontSize: '16px', marginBottom: '16px' }}>
            Aún no tienes pedidos.
          </p>
          <button
            type="button"
            onClick={() => navigate('/productos')}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: colors.primary,
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Ver catálogo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {orders.map((order) => {
            const isExpanded = expandedOrders[order.id] === true;
            const statusColors = getStatusColors(order.estado);
            const isHovered = hoveredOrder === order.id;

            const currentBorderColor = isExpanded ? colors.borderActive : colors.cardBorder;
            const hoverBorderColor = isHovered ? colors.primary : currentBorderColor;

            const currentBoxShadow = isExpanded
              ? (isDark
                ? '0 4px 16px rgba(217,4,41,0.12)'
                : '0 4px 16px rgba(217,4,41,0.08)')
              : 'none';
            const hoverBoxShadow = isHovered
              ? (isDark
                ? '0 6px 20px rgba(217,4,41,0.16)'
                : '0 6px 20px rgba(217,4,41,0.10)')
              : currentBoxShadow;

            return (
              <div key={order.id} style={{
                border: `1.5px solid ${hoverBorderColor}`,
                borderRadius: '12px',
                background: colors.cardBg,
                boxShadow: hoverBoxShadow,
                overflow: 'hidden',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                transition: 'all 0.3s ease',
                padding: '18px 20px',
              }}
                onMouseEnter={() => setHoveredOrder(order.id)}
                onMouseLeave={() => setHoveredOrder(null)}
              >
                <button
                  type="button"
                  onClick={() => setExpandedOrders((prev) => ({ ...prev, [order.id]: !prev[order.id] }))}
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
                  }}
                >
                  <div>
                    <strong style={{ color: colors.primary, fontSize: '16px' }}>Pedido #{order.id}</strong>
                    <p style={{ margin: '4px 0 2px', fontSize: '14px', color: colors.textMain, fontWeight: '600' }}>
                      {order.lineas.length} producto{order.lineas.length > 1 ? 's' : ''}
                    </p>
                    <span style={{ fontSize: '13px', color: colors.textDate }}>
                      Fecha: {formatFecha(order.fecha)} · Entrega: {formatFecha(order.fechaEntrega)}
                    </span>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px',
                  }}>
                    <span style={{ fontWeight: 'bold', color: colors.textTotal, fontSize: '16px' }}>
                      {formatPrice(order.total)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '12px',
                        background: statusColors.bg,
                        color: statusColors.text,
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}>
                        {order.estado}
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
