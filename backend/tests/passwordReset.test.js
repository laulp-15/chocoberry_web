// tests/passwordReset.test.js
// Pruebas de activación de cuenta y recuperación de contraseña con tokens de
// un solo uso. El correo no se envía en NODE_ENV=test; los tokens se crean
// directamente con el servicio para poder consumirlos en la API.
import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';
import * as tokenService from '../src/services/tokenContrasena.service.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const PASSWORD = 'Nueva123!';
const CORREO_INEXISTENTE = 'no-existe-password-reset@chocoberry.test';

describe('Activación y recuperación de contraseña', () => {
  let tokenAdmin;
  let usuarioId;
  let correo;

  const s = Date.now().toString().slice(-7);
  const numeroDocumento = `8${s}123`;

  const auth = (peticion) =>
    peticion.set('Authorization', `Bearer ${tokenAdmin}`);

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send(ADMIN);
    tokenAdmin = login.body?.data?.token;
    expect(tokenAdmin).toBeTruthy();

    correo = `activacion.${s}@chocoberry.test`;

    const creado = await auth(request(app).post('/api/usuarios')).send({
      nombres: 'Prueba',
      apellidos: 'Activación',
      tipoDocumento: 'CC',
      numeroDocumento,
      correo,
      telefono: '3001234567',
      direccion: 'Calle 1 # 2-3',
      barrio: 'Centro',
      estado: true,
      rol: 'cliente',
    });

    expect(creado.status).toBe(201);
    usuarioId = creado.body.data.id;
  });

  afterAll(async () => {
    if (usuarioId) {
      await query('DELETE FROM usuario WHERE id = ?', [usuarioId]);
    }
  });

  it('crea el usuario sin contraseña y genera un token de activación', async () => {
    const tokens = await query(
      `SELECT token_hash, tipo, usado
         FROM tokenContrasena
        WHERE id_usuario = ? AND tipo = 'activacion' AND usado = FALSE`,
      [usuarioId]
    );

    expect(tokens).toHaveLength(1);
    expect(tokens[0].token_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('restablece la contraseña con un token de activación y lo invalida', async () => {
    const token = await tokenService.crearToken(usuarioId, 'activacion');

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, contrasena: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.mensaje).toMatch(/puedes iniciar sesión/i);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: PASSWORD });
    expect(login.status).toBe(200);

    const repetido = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, contrasena: 'Otra123!' });
    expect(repetido.status).toBe(400);
  });

  it('olvidar contraseña responde igual exista o no el correo y crea el token', async () => {
    const existente = await request(app)
      .post('/api/auth/forgot-password')
      .send({ correo });
    const inexistente = await request(app)
      .post('/api/auth/forgot-password')
      .send({ correo: CORREO_INEXISTENTE });

    expect(existente.status).toBe(200);
    expect(inexistente.status).toBe(200);
    expect(existente.body.message).toBe(inexistente.body.message);

    const tokens = await query(
      `SELECT id
         FROM tokenContrasena
        WHERE id_usuario = ? AND tipo = 'recuperacion' AND usado = FALSE`,
      [usuarioId]
    );
    expect(tokens).toHaveLength(1);
  });

  it('rechaza un token inexistente, vencido o ausente', async () => {
    const invalido = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'token-que-no-existe', contrasena: PASSWORD });
    expect(invalido.status).toBe(400);

    const token = await tokenService.crearToken(usuarioId, 'recuperacion');
    await query(
      `UPDATE tokenContrasena
          SET fecha_expiracion = DATE_SUB(NOW(), INTERVAL 1 MINUTE)
        WHERE id_usuario = ? AND tipo = 'recuperacion' AND usado = FALSE`,
      [usuarioId]
    );

    const vencido = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, contrasena: PASSWORD });
    expect(vencido.status).toBe(400);

    const ausente = await request(app)
      .post('/api/auth/reset-password')
      .send({ contrasena: PASSWORD });
    expect(ausente.status).toBe(422);
  });
});
