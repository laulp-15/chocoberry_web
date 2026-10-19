// tests/setup.js
// Se ejecuta una vez por archivo de pruebas (setupFilesAfterEnv).
// Cierra el pool de MySQL al terminar para que Jest pueda finalizar.
import { afterAll } from '@jest/globals';
import { pool } from '../src/config/db.js';

afterAll(async () => {
  await pool.end();
});
