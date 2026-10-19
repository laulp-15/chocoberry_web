// tests/roles.test.js
// Pruebas de integración del módulo de roles y permisos.
// Requieren la base de datos con los datos iniciales (roles y permisos del seed).
//
// Nota: las pruebas crean un rol temporal y lo eliminan al final del mismo
// archivo, así que la base de datos queda igual que como estaba.
import request from 'supertest';
import app from '../src/app.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };

describe('Módulo de roles y permisos', () => {
  let token;
  let rolTemporalId;

  const auth = (peticion) => peticion.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    token = res.body?.data?.token;
  });

  it('GET /api/roles sin token devuelve 401', async () => {
    const res = await request(app).get('/api/roles');
    expect(res.status).toBe(401);
  });

  it('GET /api/roles devuelve la lista con conteo de permisos y usuarios', async () => {
    const res = await auth(request(app).get('/api/roles'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const administrador = res.body.data.find((rol) => rol.nombre === 'Administrador');
    expect(administrador).toBeDefined();
    expect(administrador.permisos).toBeGreaterThan(0);
    expect(administrador.usuarios).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/roles?nombre=repartidor filtra por nombre', async () => {
    const res = await auth(request(app).get('/api/roles?nombre=repartidor'));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((rol) => /repartidor/i.test(rol.nombre))).toBe(true);
  });

  it('GET /api/roles/:id inexistente devuelve 404', async () => {
    const res = await auth(request(app).get('/api/roles/999999'));
    expect(res.status).toBe(404);
  });

  it('GET /api/modulos devuelve el catálogo de módulos', async () => {
    const res = await auth(request(app).get('/api/modulos'));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(9);
    expect(res.body.data.some((m) => m.nombre === 'Roles')).toBe(true);
  });

  it('GET /api/acciones devuelve el catálogo de acciones', async () => {
    const res = await auth(request(app).get('/api/acciones'));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(7);
    expect(res.body.data.some((a) => a.nombre === 'Ver')).toBe(true);
  });

  it('GET /api/permisos devuelve los permisos con su módulo y acción', async () => {
    const res = await auth(request(app).get('/api/permisos'));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(41);
    expect(res.body.data[0].modulo).toBeDefined();
    expect(res.body.data[0].accion).toBeDefined();
  });

  it('GET /api/permisos?modulo=Roles filtra por módulo', async () => {
    const res = await auth(request(app).get('/api/permisos?modulo=Roles'));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.every((p) => p.modulo.nombre === 'Roles')).toBe(true);
  });

  it('POST /api/roles sin permisos devuelve 422', async () => {
    const res = await auth(request(app).post('/api/roles')).send({ nombre: 'Rol sin permisos' });
    expect(res.status).toBe(422);
  });

  it('POST /api/roles con nombre repetido devuelve 409', async () => {
    const res = await auth(request(app).post('/api/roles')).send({
      nombre: 'Administrador',
      permisos: [1],
    });

    expect(res.status).toBe(409);
  });

  it('POST /api/roles con un permiso inexistente devuelve 400', async () => {
    const res = await auth(request(app).post('/api/roles')).send({
      nombre: 'Rol permiso malo',
      permisos: [999999],
    });

    expect(res.status).toBe(400);
  });

  it('POST /api/roles crea un rol con sus permisos', async () => {
    const res = await auth(request(app).post('/api/roles')).send({
      nombre: 'Rol de prueba',
      permisos: [1, 14],
    });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('Rol de prueba');
    expect(res.body.data.permisos).toBe(2);
    rolTemporalId = res.body.data.id;
  });

  it('GET /api/roles/:id/permisos devuelve los permisos asignados', async () => {
    const res = await auth(request(app).get(`/api/roles/${rolTemporalId}/permisos`));

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.id).sort()).toEqual([1, 14]);
  });

  it('PUT /api/roles/:id/permisos reemplaza la asignación', async () => {
    const res = await auth(request(app).put(`/api/roles/${rolTemporalId}/permisos`)).send({
      permisos: [14],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.id)).toEqual([14]);
  });

  it('PUT /api/roles/:id actualiza el nombre del rol', async () => {
    const res = await auth(request(app).put(`/api/roles/${rolTemporalId}`)).send({
      nombre: 'Rol de prueba editado',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Rol de prueba editado');
    // Al no enviar permisos, se conservan los actuales ([14]).
    expect(res.body.data.permisos).toBe(1);
  });

  it('DELETE /api/roles/:id de un rol con usuarios devuelve 409', async () => {
    const res = await auth(request(app).delete('/api/roles/1'));
    expect(res.status).toBe(409);
  });

  it('DELETE /api/permisos/:id de un permiso en uso devuelve 409', async () => {
    // El permiso 1 pertenece al rol Administrador, que tiene usuarios.
    const res = await auth(request(app).delete('/api/permisos/1'));
    expect(res.status).toBe(409);
  });

  it('DELETE /api/roles/:id elimina un rol sin usuarios', async () => {
    const res = await auth(request(app).delete(`/api/roles/${rolTemporalId}`));

    expect(res.status).toBe(200);

    const comprobacion = await auth(request(app).get(`/api/roles/${rolTemporalId}`));
    expect(comprobacion.status).toBe(404);
  });
});
