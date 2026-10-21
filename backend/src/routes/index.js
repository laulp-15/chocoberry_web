// src/routes/index.js
// Router raíz de la API (se monta en /api). Cada módulo se agrega aquí a
// medida que se implementa.
import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';
import authRoutes from './auth.routes.js';
import usuarioRoutes from './usuario.routes.js';
import rolRoutes from './rol.routes.js';
import moduloRoutes from './modulo.routes.js';
import accionRoutes from './accion.routes.js';
import permisoRoutes from './permiso.routes.js';
import categoriaRoutes from './categoria.routes.js';
import productoRoutes from './producto.routes.js';
import presentacionRoutes from './presentacion.routes.js';
import catalogoRoutes from './catalogo.routes.js';
import pedidoRoutes from './pedido.routes.js';
import ventaRoutes from './venta.routes.js';
import resenaRoutes from './resena.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import municipioRoutes from './municipio.routes.js';
import colorGlaseadoRoutes from './colorGlaseado.routes.js';

const router = Router();

// Comprobación de salud del servicio (no requiere autenticación ni BD).
router.get('/health', (req, res) =>
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'API operativa.')
);

// ---------------------------------------------------------------------------
// Módulos implementados
// ---------------------------------------------------------------------------
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/roles', rolRoutes);
router.use('/modulos', moduloRoutes);
router.use('/acciones', accionRoutes);
router.use('/permisos', permisoRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/productos', productoRoutes);
router.use('/presentaciones', presentacionRoutes);
// Catálogo público de la tienda (sin sesión, solo registros activos).
router.use('/catalogo', catalogoRoutes);
// Pedidos (clientes, panel y repartidor).
router.use('/pedidos', pedidoRoutes);
// Ventas (vista de solo lectura de pedidos confirmados).
router.use('/ventas', ventaRoutes);
// Reseñas: panel de administración y creación de reseñas autenticadas.
router.use('/resenas', resenaRoutes);
// Dashboard administrativo: resumen de ventas, pedidos y reseñas.
router.use('/dashboard', dashboardRoutes);
// Datos maestros del panel (con permisos). La tienda los lee, solo activos,
// desde /catalogo/municipios y /catalogo/glaseados.
router.use('/municipios', municipioRoutes);
router.use('/glaseados', colorGlaseadoRoutes);

// ---------------------------------------------------------------------------
// Módulos pendientes:
//   router.use('/entregas', entregaRoutes);
// ---------------------------------------------------------------------------

export default router;
