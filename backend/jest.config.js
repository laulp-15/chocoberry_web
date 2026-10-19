// Configuración de Jest para un proyecto con ES Modules ("type": "module").
// Se ejecuta con: npm test  (usa NODE_OPTIONS=--experimental-vm-modules).
export default {
  testEnvironment: 'node',
  // Sin transformadores: Node ejecuta los ESM directamente.
  transform: {},
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  // El pool de MySQL se cierra en tests/setup.js; forceExit es una red de
  // seguridad por si quedara algún handle abierto.
  forceExit: true,
  verbose: true,
  clearMocks: true,
};
