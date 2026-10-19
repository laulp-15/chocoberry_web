// src/server.js
// Punto de entrada: verifica la conexión a la BD, levanta el servidor y
// gestiona un apagado ordenado.
import app from './app.js';
import env from './config/env.js';
import { testConnection, pool } from './config/db.js';

async function start() {
  try {
    await testConnection();
    // eslint-disable-next-line no-console
    console.log('[db] Conexión a MySQL establecida.');

    const server = app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] API escuchando en http://localhost:${env.port}/api (${env.nodeEnv})`);
    });

    // Apagado ordenado: cerrar el servidor y el pool de conexiones.
    const shutdown = async (signal) => {
      // eslint-disable-next-line no-console
      console.log(`\n[server] ${signal} recibido. Cerrando...`);
      server.close(async () => {
        await pool.end();
        // eslint-disable-next-line no-console
        console.log('[server] Cerrado correctamente.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[server] No se pudo iniciar la aplicación:', error.message);
    process.exit(1);
  }
}

start();
