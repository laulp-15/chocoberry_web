// tests/resenas.test.js
// Pruebas de integración del módulo de Reseñas: lectura pública, creación
// autenticada, permisos del panel y cambio de estado.
//
// Las reseñas son generales (no tienen producto ni pedido asociado). Las
// pruebas crean usuarios y reseñas temporales y las eliminan al final.
import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';

describe('Módulo de reseñas', () => {
  let tokenAdmin;
  let tokenCliente;
  let tokenRepartidor;

  let clienteId;
  let repartidorId;

  let resenaActivaId;
  let resenaInactivaId;
  let resenaToggleId;

  const resenasCreadas = [];
  const s = Date.now().toString().slice(-7);

  const auth = (peticion, token = tokenAdmin) =>
    peticion.set('Authorization', `Bearer ${token}`);

  async function crearUsuario({ rol, sufijo, nombres, apellidos }) {
    const res = await auth(request(app).post('/api/usuarios')).send({
      nombres,
      apellidos,
      tipoDocumento: 'CC',
      numeroDocumento: `9${s}${sufijo}`,
      correo: `resenas.${sufijo}.${s}@chocoberry.com`,
      contrasena: CLAVE_PRUEBA,
      id_rol: rol,
    });
    expect(res.status).toBe(201);
    return res.body.data.id;
  }

  async function iniciarSesion(correo) {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: CLAVE_PRUEBA });
    expect(res.status).toBe(200);
    return res.body.data.token;
  }

  async function crearResena({ token = tokenCliente, calificacion, comentario }) {
    const res = await auth(request(app).post('/api/resenas'), token).send({
      calificacion,
      comentario,
    });
    expect(res.status).toBe(201);
    resenasCreadas.push(res.body.data.id);
    return res.body.data;
  }

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send(ADMIN);
    tokenAdmin = login.body?.data?.token;
    expect(tokenAdmin).toBeTruthy();

    clienteId = await crearUsuario({
      rol: 3,
      sufijo: '01',
      nombres: 'Cliente',
      apellidos: 'Reseñas',
    });
    repartidorId = await crearUsuario({
      rol: 2,
      sufijo: '02',
      nombres: 'Repartidor',
      apellidos: 'Reseñas',
    });

    tokenCliente = await iniciarSesion(`resenas.01.${s}@chocoberry.com`);
    tokenRepartidor = await iniciarSesion(`resenas.02.${s}@chocoberry.com`);

    const activa = await crearResena({
      calificacion: 5,
      comentario: `Reseña activa de prueba ${s}.`,
    });
    resenaActivaId = activa.id;

    const inactiva = await crearResena({
      calificacion: 4,
      comentario: `Reseña inactiva de prueba ${s}.`,
    });
    resenaInactivaId = inactiva.id;

    const toggle = await crearResena({
      calificacion: 3,
      comentario: `Reseña para cambiar estado ${s}.`,
    });
    resenaToggleId = toggle.id;

    const desactivar = await auth(
      request(app).patch(`/api/resenas/${resenaInactivaId}/estado`)
    ).send({ estado: false });
    expect(desactivar.status).toBe(200);
    expect(desactivar.body.data.estado).toBe(false);
  });

  afterAll(async () => {
    if (resenasCreadas.length) {
      const marcadores = resenasCreadas.map(() => '?').join(', ');
      await query(`DELETE FROM resena WHERE id IN (${marcadores})`, resenasCreadas);
    }

    for (const id of [repartidorId, clienteId]) {
      if (id) await auth(request(app).delete(`/api/usuarios/${id}`));
    }
  });

  it('GET /api/catalogo/resenas es público y solo devuelve activas', async () => {
    const res = await request(app).get('/api/catalogo/resenas');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const ids = res.body.data.map((resena) => resena.id);
    expect(ids).toContain(resenaActivaId);
    expect(ids).not.toContain(resenaInactivaId);
    expect(res.body.data.every((resena) => resena.estado === true)).toBe(true);
  });

  it('GET /api/catalogo/resenas filtra por calificación', async () => {
    const res = await request(app).get('/api/catalogo/resenas').query({ calificacion: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.map((resena) => resena.id)).toContain(resenaActivaId);
    expect(res.body.data.every((resena) => resena.calificacion === 5)).toBe(true);
  });

  it('POST /api/resenas sin token devuelve 401', async () => {
    const res = await request(app)
      .post('/api/resenas')
      .send({ calificacion: 5, comentario: 'Sin sesión.' });

    expect(res.status).toBe(401);
  });

  it('un repartidor no puede crear reseñas (403)', async () => {
    const res = await auth(request(app).post('/api/resenas'), tokenRepartidor).send({
      calificacion: 5,
      comentario: 'El repartidor no tiene permiso.',
    });

    expect(res.status).toBe(403);
  });

  it('crea la reseña a nombre del usuario autenticado e ignora nombre, fecha y estado', async () => {
    const res = await auth(request(app).post('/api/resenas'), tokenCliente).send({
      calificacion: 5,
      comentario: `El servidor decide los campos ${s}.`,
      clientName: 'Nombre Falso',
      fecha: '2000-01-01',
      estado: false,
      tag: 'Compra verificada',
    });

    expect(res.status).toBe(201);
    resenasCreadas.push(res.body.data.id);

    expect(res.body.data.cliente).toBe('Cliente Reseñas');
    expect(res.body.data.usuarioId).toBe(clienteId);
    expect(res.body.data.estado).toBe(true);
    expect(res.body.data.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(res.body.data.fecha).not.toBe('2000-01-01');
  });

  it('rechaza una calificación fuera de 1 a 5 (422)', async () => {
    const res = await auth(request(app).post('/api/resenas'), tokenCliente).send({
      calificacion: 6,
      comentario: 'Calificación inválida.',
    });

    expect(res.status).toBe(422);
  });

  it('rechaza un comentario vacío (422)', async () => {
    const res = await auth(request(app).post('/api/resenas'), tokenCliente).send({
      calificacion: 5,
      comentario: '   ',
    });

    expect(res.status).toBe(422);
  });

  it('rechaza un comentario de más de 300 caracteres (422)', async () => {
    const res = await auth(request(app).post('/api/resenas'), tokenCliente).send({
      calificacion: 5,
      comentario: 'a'.repeat(301),
    });

    expect(res.status).toBe(422);
  });

  it('GET /api/resenas es solo para administradores', async () => {
    const admin = await auth(request(app).get('/api/resenas'));
    expect(admin.status).toBe(200);
    const ids = admin.body.data.map((resena) => resena.id);
    expect(ids).toEqual(expect.arrayContaining([resenaActivaId, resenaInactivaId]));

    const cliente = await auth(request(app).get('/api/resenas'), tokenCliente);
    expect(cliente.status).toBe(403);

    const repartidor = await auth(request(app).get('/api/resenas'), tokenRepartidor);
    expect(repartidor.status).toBe(403);
  });

  it('el panel filtra por estado inactivo y por cliente', async () => {
    const inactivas = await auth(request(app).get('/api/resenas').query({ estado: 'inactivo' }));
    expect(inactivas.status).toBe(200);
    expect(inactivas.body.data.map((resena) => resena.id)).toContain(resenaInactivaId);
    expect(inactivas.body.data.every((resena) => resena.estado === false)).toBe(true);

    const porCliente = await auth(
      request(app).get('/api/resenas').query({ cliente: 'Cliente Reseñas' })
    );
    expect(porCliente.status).toBe(200);
    expect(porCliente.body.data.map((resena) => resena.id)).toEqual(
      expect.arrayContaining([resenaActivaId, resenaInactivaId, resenaToggleId])
    );
  });

  it('rechaza un filtro de estado inválido (422)', async () => {
    const res = await auth(request(app).get('/api/resenas').query({ estado: 'otro' }));
    expect(res.status).toBe(422);
  });

  it('GET /api/resenas/:id devuelve el detalle solo al administrador', async () => {
    const admin = await auth(request(app).get(`/api/resenas/${resenaActivaId}`));
    expect(admin.status).toBe(200);
    expect(admin.body.data.id).toBe(resenaActivaId);
    expect(admin.body.data.cliente).toBe('Cliente Reseñas');

    const cliente = await auth(
      request(app).get(`/api/resenas/${resenaActivaId}`),
      tokenCliente
    );
    expect(cliente.status).toBe(403);

    const inexistente = await auth(request(app).get('/api/resenas/99999999'));
    expect(inexistente.status).toBe(404);
  });

  it('cambia el estado y la reseña desaparece o reaparece en la vista pública', async () => {
    const desactivar = await auth(
      request(app).patch(`/api/resenas/${resenaToggleId}/estado`)
    ).send({ estado: false });
    expect(desactivar.status).toBe(200);
    expect(desactivar.body.data.estado).toBe(false);

    const publicaOculta = await request(app).get('/api/catalogo/resenas');
    expect(publicaOculta.body.data.map((resena) => resena.id)).not.toContain(resenaToggleId);

    const activar = await auth(
      request(app).patch(`/api/resenas/${resenaToggleId}/estado`)
    ).send({ estado: true });
    expect(activar.status).toBe(200);
    expect(activar.body.data.estado).toBe(true);

    const publicaVisible = await request(app).get('/api/catalogo/resenas');
    expect(publicaVisible.body.data.map((resena) => resena.id)).toContain(resenaToggleId);
  });

  it('un cliente no puede cambiar el estado de una reseña (403)', async () => {
    const res = await auth(
      request(app).patch(`/api/resenas/${resenaToggleId}/estado`),
      tokenCliente
    ).send({ estado: false });

    expect(res.status).toBe(403);
  });
});
