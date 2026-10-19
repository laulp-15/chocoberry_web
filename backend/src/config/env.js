// src/config/env.js
// Carga y valida las variables de entorno. La conexión a la BD y los secretos
// se leen SOLO desde aquí; nunca se escriben valores sensibles en el código.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// El .env vive en la raíz de /backend (dos niveles arriba de src/config).
export const rootDir = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(rootDir, '.env') });

/** Convierte strings de entorno ('true'/'1'/'yes'/'si') a booleano. */
const toBool = (value, defaultValue = false) => {
  if (value === undefined || value === '') return defaultValue;
  return ['true', '1', 'yes', 'si', 'sí'].includes(String(value).trim().toLowerCase());
};

// Variables obligatorias: si falta alguna, es mejor fallar al arrancar que
// descubrir el problema en la primera petición.
const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'FRONTEND_URL'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Faltan variables de entorno obligatorias: ${missing.join(', ')}. ` +
      'Revisa tu archivo .env (usa .env.example como plantilla).'
  );
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  frontendUrl: process.env.FRONTEND_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME,
    ssl: toBool(process.env.DB_SSL, false),
  },
};

export default env;
