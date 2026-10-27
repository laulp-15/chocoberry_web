// src/routes/dashboard.routes.js
// Dashboard administrativo: métricas de pedidos, ventas y reseñas.
import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { verifyToken } from '../middlewares/auth.js';
import { checkPermiso } from '../middlewares/checkPermiso.js';
import { validar } from '../middlewares/validate.js';
import { filtrosDashboardSchema } from '../validators/dashboard.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/resumen',
  checkPermiso('Dashboard', 'Ver'),
  validar(filtrosDashboardSchema, 'query'),
  dashboardController.resumen
);

export default router;
