// Configuración de Jest para un proyecto con ES Modules ("type": "module").
// Se ejecuta con: npm test  (usa NODE_OPTIONS=--experimental-vm-modules).
export default {
  testEnvironment: 'node',
  // Sin transformadores: Node ejecuta los ESM directamente.
  transform: {},
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // Todas las suites comparten la misma base MySQL de desarrollo. Ejecutarlas
  // en serie evita que los pedidos temporales de una suite alteren los KPIs
  // globales que verifican otras (por ejemplo Dashboard).
  maxWorkers: 1,
  // El pool de MySQL se cierra en tests/setup.js; forceExit es una red de
  // seguridad por si quedara algún handle abierto.
  forceExit: true,
  verbose: true,
  clearMocks: true,
};
