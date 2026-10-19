// src/app.js
// Configuración de Express: middlewares globales, rutas y manejo de errores.
// No arranca el servidor (eso lo hace server.js), lo que facilita las pruebas.
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env, { rootDir } from './config/env.js';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// No revelar el framework en la cabecera.
app.disable('x-powered-by');

// Cabeceras de seguridad. crossOriginResourcePolicy permite que el frontend
// (otro origen) muestre las imágenes servidas desde /uploads.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS: solo se permite el origen configurado en FRONTEND_URL.
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

// Parseo del cuerpo de las peticiones.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones HTTP (se silencia en las pruebas).
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Servir los archivos subidos (imágenes de producto, comprobantes, evidencias).
app.use('/uploads', express.static(path.join(rootDir, 'uploads')));

// Rutas de la API.
app.use('/api', routes);

// 404 para rutas no encontradas y manejador central de errores (siempre al final).
app.use(notFound);
app.use(errorHandler);

export default app;
