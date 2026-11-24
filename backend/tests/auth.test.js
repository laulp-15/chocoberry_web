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
    expect(Array.isArray(res.body.data.usuario.permisos)).toBe(true);
    expect(res.body.data.usuario.permisos).toEqual(
      expect.arrayContaining([{ modulo: 'Dashboard', accion: 'Ver' }])
    );
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
    expect(Array.isArray(res.body.data.permisos)).toBe(true);
    expect(res.body.data.permisos).toEqual(
      expect.arrayContaining([{ modulo: 'Roles', accion: 'Ver' }])
    );
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

  it('GET /api/usuarios?page=1&limit=2 devuelve data y meta', async () => {
    const res = await request(app)
      .get('/api/usuarios?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
    expect(res.body.data.data.length).toBeLessThanOrEqual(2);
    expect(res.body.data.meta).toEqual(
      expect.objectContaining({
        page: 1,
        limit: 2,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      })
    );
  });

  it('GET /api/usuarios?buscar=... busca por nombre o correo', async () => {
    const res = await request(app)
      .get('/api/usuarios?buscar=admin@chocoberry.com')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((u) => u.correo === ADMIN.correo)).toBe(true);
  });

  it('GET /api/usuarios?rol=cliente&page=1&limit=2 pagina respetando el rol', async () => {
    const res = await request(app)
      .get('/api/usuarios?rol=cliente&page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeLessThanOrEqual(2);
    expect(res.body.data.data.every((u) => u.rol.slug === 'cliente')).toBe(true);
  });

  it('GET /api/usuarios?limit=51 devuelve 422', async () => {
    const res = await request(app)
      .get('/api/usuarios?limit=51')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(422);
  });

  it('GET /api/usuarios/:id inexistente devuelve 404', async () => {
    const res = await request(app)
      .get('/api/usuarios/999999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
