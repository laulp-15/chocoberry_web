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

// ---------------------------------------------------------------------------
// Módulos pendientes:
//   router.use('/productos', productoRoutes);
//   router.use('/pedidos', pedidoRoutes);
//   router.use('/entregas', entregaRoutes);
//   router.use('/ventas', ventaRoutes);
//   router.use('/resenas', resenaRoutes);
//   router.use('/dashboard', dashboardRoutes);
// ---------------------------------------------------------------------------

export default router;
