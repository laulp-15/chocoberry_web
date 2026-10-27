// tests/usuarios.test.js
// Pruebas de integración de la unicidad del número de documento.
// Requieren la base de datos con los datos iniciales (usuario admin) y la
// restricción uq_usuario_numero_documento aplicada.
import request from 'supertest';
import app from '../src/app.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const PASSWORD = 'Clave123!';

describe('Unicidad del número de documento', () => {
  let token;
  let usuarioAId;
  let usuarioBId;

  // Sufijo numérico único por corrida para no chocar con datos existentes.
  // Los documentos quedan de 14 dígitos, dentro del rango permitido (6-15).
  const unico = `${Date.now()}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0')}`.slice(-12);
  const docA = `9${unico}1`;
  const docB = `9${unico}2`;
  const correoA = `doc.${docA}@chocoberry.test`;
  const correoB = `doc.${docB}@chocoberry.test`;
  const correoNuevo = `doc.${docA}.nuevo@chocoberry.test`;

  const auth = (peticion) => peticion.set('Authorization', `Bearer ${token}`);

  const payloadUsuario = (numeroDocumento, correo, nombres = 'Prueba') => ({
    nombres,
    apellidos: 'Documento',
    tipoDocumento: 'CC',
    numeroDocumento,
    correo,
    contrasena: PASSWORD,
    telefono: '3001234567',
    direccion: 'Calle 1 # 2-3',
    barrio: 'Centro',
    estado: true,
    rol: 'cliente',
  });

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    token = res.body?.data?.token;
  });

  afterAll(async () => {
    if (usuarioBId) await auth(request(app).delete(`/api/usuarios/${usuarioBId}`));
    if (usuarioAId) await auth(request(app).delete(`/api/usuarios/${usuarioAId}`));
  });

  it('crea el primer usuario con un documento nuevo', async () => {
    const res = await auth(request(app).post('/api/usuarios')).send(
      payloadUsuario(docA, correoA, 'Primer')
    );

    expect(res.status).toBe(201);
    expect(res.body.data.numeroDocumento).toBe(docA);
    usuarioAId = res.body.data.id;
  });

  it('rechaza crear otro usuario con el documento del primero', async () => {
    const res = await auth(request(app).post('/api/usuarios')).send(
      payloadUsuario(docA, correoNuevo, 'Segundo')
    );

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DOCUMENT_TAKEN');
  });

  it('crea un segundo usuario con un documento distinto', async () => {
    const res = await auth(request(app).post('/api/usuarios')).send(
      payloadUsuario(docB, correoB, 'Segundo')
    );

    expect(res.status).toBe(201);
    usuarioBId = res.body.data.id;
  });

  it('permite guardar el mismo documento del propio usuario', async () => {
    const res = await auth(
      request(app).put(`/api/usuarios/${usuarioBId}`)
    ).send({ numeroDocumento: docB });

    expect(res.status).toBe(200);
    expect(res.body.data.numeroDocumento).toBe(docB);
  });

  it('rechaza editar un usuario con el documento de otro', async () => {
    const res = await auth(
      request(app).put(`/api/usuarios/${usuarioBId}`)
    ).send({ numeroDocumento: docA });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DOCUMENT_TAKEN');
  });

  it('PUT /api/usuarios/:id no cambia el estado', async () => {
    const res = await auth(
      request(app).put(`/api/usuarios/${usuarioBId}`)
    ).send({ estado: false });

    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe(true);
  });

  it('rechaza el registro público con un documento existente', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombres: 'Tercer',
      apellidos: 'Documento',
      tipoDocumento: 'CC',
      numeroDocumento: docA,
      correo: correoNuevo,
      contrasena: PASSWORD,
      telefono: '3001234567',
      direccion: 'Calle 1 # 2-3',
      barrio: 'Centro',
    });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DOCUMENT_TAKEN');
  });

  it('rechaza editar el propio perfil con el documento de otro', async () => {
    const login = await request(app).post('/api/auth/login').send({
      correo: correoB,
      contrasena: PASSWORD,
    });
    const tokenB = login.body?.data?.token;

    const res = await request(app)
      .put('/api/auth/me')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ numeroDocumento: docA });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DOCUMENT_TAKEN');
  });
});
