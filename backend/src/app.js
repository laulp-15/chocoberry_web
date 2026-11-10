// src/app.js
// Configuración de Express: middlewares globales, rutas y manejo de errores.
// No arranca el servidor (eso lo hace server.js), lo que facilita las pruebas.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import notFound from './middlewares/notFound.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Render (y otros PaaS) termina TLS en un proxy delante de Express. Esto hace
// que express-rate-limit lea correctamente la IP del cliente.
app.set('trust proxy', 1);

// No revelar el framework en la cabecera.
app.disable('x-powered-by');

// Cabeceras de seguridad. Las imágenes se sirven desde Cloudinary, no desde
// este backend.
app.use(helmet());

// CORS: solo se permite el origen configurado en FRONTEND_URL.
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  })
);

// Parseo del cuerpo de las peticiones.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones HTTP (se silencia en las pruebas).
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Rutas de la API.
app.use('/api', routes);

// 404 para rutas no encontradas y manejador central de errores (siempre al final).
app.use(notFound);
app.use(errorHandler);

export default app;
