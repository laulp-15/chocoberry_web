// tests/validators.test.js
// Pruebas unitarias de los esquemas de validación (no requieren base de datos).
import { loginSchema, registroSchema } from '../src/validators/auth.validator.js';

const registroValido = {
  nombres: 'Laura',
  apellidos: 'Gómez',
  tipoDocumento: 'CC',
  numeroDocumento: '1017123456',
  correo: 'Laura.Gomez@Example.com',
  contrasena: 'Segura123!',
  telefono: '300 123 4567',
  direccion: 'Calle 10 #43-12',
  barrio: 'Centro',
};

describe('Validadores - registro', () => {
  it('acepta un registro válido y normaliza el correo a minúsculas', () => {
    const r = registroSchema.safeParse(registroValido);
    expect(r.success).toBe(true);
    expect(r.data.correo).toBe('laura.gomez@example.com');
  });

  it('rechaza una contraseña débil', () => {
    const r = registroSchema.safeParse({ ...registroValido, contrasena: 'debil' });
    expect(r.success).toBe(false);
    expect(r.error.issues.some((i) => i.path.includes('contrasena'))).toBe(true);
  });

  it('rechaza un tipo de documento no permitido', () => {
    const r = registroSchema.safeParse({ ...registroValido, tipoDocumento: 'XX' });
    expect(r.success).toBe(false);
  });

  it('rechaza un documento que no sea numérico', () => {
    const r = registroSchema.safeParse({ ...registroValido, numeroDocumento: 'ABC123' });
    expect(r.success).toBe(false);
  });

  it('permite teléfono/dirección/barrio vacíos (opcionales)', () => {
    const r = registroSchema.safeParse({
      ...registroValido,
      telefono: '',
      direccion: '',
      barrio: '',
    });
    expect(r.success).toBe(true);
  });
});

describe('Validadores - login', () => {
  it('no exige la política completa de contraseña (permite contraseñas antiguas)', () => {
    const r = loginSchema.safeParse({ correo: 'admin@chocoberry.com', contrasena: 'x' });
    expect(r.success).toBe(true);
  });

  it('rechaza un correo inválido', () => {
    const r = loginSchema.safeParse({ correo: 'no-es-correo', contrasena: 'loquesea' });
    expect(r.success).toBe(false);
  });
});
