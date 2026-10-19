// tests/auth.test.js
// Pruebas de integración del módulo de acceso y usuarios.
// Requieren la base de datos creada y con los datos iniciales (usuario admin).
import request from 'supertest';
import app from '../src/app.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };

describe('Módulo de acceso y usuarios', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    token = res.body?.data?.token;
  });

  it('POST /api/auth/login con credenciales válidas devuelve token y usuario', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.usuario.correo).toBe(ADMIN.correo);
    expect(res.body.data.usuario.rol.slug).toBe('administrador');
    // La contraseña nunca se devuelve.
    expect(res.body.data.usuario.contrasena).toBeUndefined();
  });

  it('POST /api/auth/login con contraseña incorrecta devuelve 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...ADMIN, contrasena: 'Incorrecta123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login con datos inválidos devuelve 422 con detalle', async () => {
    const res = await request(app).post('/api/auth/login').send({ correo: 'no-es-correo' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('GET /api/auth/me sin token devuelve 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me con token devuelve el perfil', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.correo).toBe(ADMIN.correo);
  });

  it('GET /api/usuarios sin token devuelve 401', async () => {
    const res = await request(app).get('/api/usuarios');
    expect(res.status).toBe(401);
  });

  it('GET /api/usuarios con token de admin devuelve la lista', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/usuarios?rol=cliente filtra por rol', async () => {
    const res = await request(app)
      .get('/api/usuarios?rol=cliente')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every((u) => u.rol.slug === 'cliente')).toBe(true);
  });

  it('GET /api/usuarios/:id inexistente devuelve 404', async () => {
    const res = await request(app)
      .get('/api/usuarios/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
