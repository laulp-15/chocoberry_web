// src/config/db.js
// Pool de conexiones MySQL. Es la ÚNICA puerta de entrada a la base de datos:
// los "models" son los únicos que deben importar este módulo, y siempre con
// consultas parametrizadas (nunca concatenando strings en el SQL).
import mysql from 'mysql2/promise';
import env from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // SSL opcional para bases de datos en la nube: se activa con DB_SSL=true.
  ...(env.db.ssl ? { ssl: { rejectUnauthorized: true } } : {}),
});

/** Ejecuta una consulta parametrizada usando el pool. */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Toma una conexión del pool (para transacciones). Recuerda liberarla. */
export function getConnection() {
  return pool.getConnection();
}

/**
 * Ejecuta un callback dentro de una transacción:
 * hace commit si todo va bien y rollback si algo falla.
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/** Verifica que la conexión a la BD funcione (se usa al arrancar el servidor). */
export async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

export default pool;
