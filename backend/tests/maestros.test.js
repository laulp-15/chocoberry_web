// tests/maestros.test.js
// Pruebas de integración del CRUD de municipios y glaseados del panel.
// Comprueba permisos (módulo Productos), validación, unicidad de nombres,
// filtros por estado, lectura pública y bloqueo de eliminación en uso.
//
// Las pruebas crean sus propios registros y los eliminan al final.
import request from 'supertest';
import app from '../src/app.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';

describe('Módulo de maestros (municipios y glaseados)', () => {
  let tokenAdmin;
  let tokenCliente;
  let clienteId;

  let municipioId;
  let glaseadoId;

  const s = Date.now().toString().slice(-7);
  const nombreMunicipio = `Zona Maestros ${s}`;
  const nombreGlaseado = `Color Maestros ${s}`;

  const auth = (peticion, token = tokenAdmin) =>
    peticion.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send(ADMIN);
    tokenAdmin = login.body?.data?.token;
    expect(tokenAdmin).toBeTruthy();

    // Cliente temporal: tiene "Productos · Ver" pero no Crear/Editar/Eliminar.
    const correo = `maestros.${s}@chocoberry.com`;
    const creado = await auth(request(app).post('/api/usuarios')).send({
      nombres: 'Cliente',
      apellidos: 'Maestros',
      tipoDocumento: 'CC',
      numeroDocumento: `8${s}99`,
      correo,
      contrasena: CLAVE_PRUEBA,
      id_rol: 3,
    });
    expect(creado.status).toBe(201);
    clienteId = creado.body.data.id;

    const loginCliente = await request(app)
      .post('/api/auth/login')
      .send({ correo, contrasena: CLAVE_PRUEBA });
    expect(loginCliente.status).toBe(200);
    tokenCliente = loginCliente.body.data.token;
  });

  afterAll(async () => {
    if (municipioId) await auth(request(app).delete(`/api/municipios/${municipioId}`));
    if (glaseadoId) await auth(request(app).delete(`/api/glaseados/${glaseadoId}`));
    if (clienteId) await auth(request(app).delete(`/api/usuarios/${clienteId}`));
  });

  describe('Municipios', () => {
    it('GET /api/municipios sin token devuelve 401', async () => {
      const res = await request(app).get('/api/municipios');
      expect(res.status).toBe(401);
    });

    it('GET /api/municipios lista los municipios para el administrador', async () => {
      const res = await auth(request(app).get('/api/municipios'));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(8);
      expect(res.body.data[0]).toHaveProperty('precioDomicilio');
    });

    it('POST /api/municipios crea con el alias costoEnvio', async () => {
      const res = await auth(request(app).post('/api/municipios')).send({
        nombre: nombreMunicipio,
        costoEnvio: 11000,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.nombre).toBe(nombreMunicipio);
      expect(res.body.data.precioDomicilio).toBe(11000);
      expect(res.body.data.estado).toBe(true);
      municipioId = res.body.data.id;
    });

    it('POST /api/municipios rechaza un nombre duplicado sin importar mayúsculas', async () => {
      const res = await auth(request(app).post('/api/municipios')).send({
        nombre: nombreMunicipio.toUpperCase(),
        precioDomicilio: 9000,
      });
      expect(res.status).toBe(409);
    });

    it('POST /api/municipios exige el costo de envío', async () => {
      const res = await auth(request(app).post('/api/municipios')).send({
        nombre: `Zona Sin Precio ${s}`,
      });
      expect(res.status).toBe(422);
      expect(res.body.errors?.[0]?.campo).toBe('precioDomicilio');
    });

    it('POST /api/municipios rechaza un costo negativo', async () => {
      const res = await auth(request(app).post('/api/municipios')).send({
        nombre: `Zona Negativa ${s}`,
        precioDomicilio: -1,
      });
      expect(res.status).toBe(422);
    });

    it('un cliente no puede crear municipios (403)', async () => {
      const res = await auth(
        request(app).post('/api/municipios').send({
          nombre: `Zona Cliente ${s}`,
          precioDomicilio: 8000,
        }),
        tokenCliente
      );
      expect(res.status).toBe(403);
    });

    it('PUT /api/municipios/:id actualiza nombre y precio', async () => {
      const res = await auth(request(app).put(`/api/municipios/${municipioId}`)).send({
        nombre: `${nombreMunicipio} Editado`,
        precioDomicilio: 12500,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe(`${nombreMunicipio} Editado`);
      expect(res.body.data.precioDomicilio).toBe(12500);
    });

    it('PUT /api/municipios/:id rechaza el nombre de otro municipio', async () => {
      const existentes = await auth(request(app).get('/api/municipios'));
      const otro = existentes.body.data.find((m) => m.id !== municipioId);

      const res = await auth(request(app).put(`/api/municipios/${municipioId}`)).send({
        nombre: otro.nombre,
      });
      expect(res.status).toBe(409);
    });

    it('PATCH /api/municipios/:id/estado desactiva el municipio', async () => {
      const res = await auth(
        request(app).patch(`/api/municipios/${municipioId}/estado`).send({ estado: false })
      );

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe(false);
    });

    it('el administrador puede filtrar los inactivos y el cliente no los ve', async () => {
      const admin = await auth(request(app).get('/api/municipios?estado=false'));
      expect(admin.status).toBe(200);
      expect(admin.body.data.some((m) => m.id === municipioId)).toBe(true);

      const cliente = await auth(request(app).get('/api/municipios'), tokenCliente);
      expect(cliente.status).toBe(200);
      expect(cliente.body.data.some((m) => m.id === municipioId)).toBe(false);
      expect(cliente.body.data.every((m) => m.estado === true)).toBe(true);
    });

    it('el catálogo público no incluye municipios inactivos', async () => {
      const res = await request(app).get('/api/catalogo/municipios');
      expect(res.status).toBe(200);
      expect(res.body.data.some((m) => m.id === municipioId)).toBe(false);
    });

    it('DELETE /api/municipios/:id elimina un municipio sin pedidos', async () => {
      const res = await auth(request(app).delete(`/api/municipios/${municipioId}`));
      expect(res.status).toBe(200);

      const buscar = await auth(request(app).get(`/api/municipios/${municipioId}`));
      expect(buscar.status).toBe(404);
      municipioId = null;
    });
  });

  describe('Glaseados', () => {
    it('GET /api/glaseados sin token devuelve 401', async () => {
      const res = await request(app).get('/api/glaseados');
      expect(res.status).toBe(401);
    });

    it('POST /api/glaseados crea con el alias hex y normaliza el color', async () => {
      const res = await auth(request(app).post('/api/glaseados')).send({
        nombre: nombreGlaseado,
        hex: '#abcdef',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.nombre).toBe(nombreGlaseado);
      expect(res.body.data.codigoHex).toBe('#ABCDEF');
      expect(res.body.data.estado).toBe(true);
      glaseadoId = res.body.data.id;
    });

    it('POST /api/glaseados rechaza un nombre duplicado', async () => {
      const res = await auth(request(app).post('/api/glaseados')).send({
        nombre: nombreGlaseado.toUpperCase(),
        codigoHex: '#111111',
      });
      expect(res.status).toBe(409);
    });

    it('POST /api/glaseados exige un hexadecimal válido', async () => {
      const res = await auth(request(app).post('/api/glaseados')).send({
        nombre: `Color Inválido ${s}`,
        hex: 'azul',
      });
      expect(res.status).toBe(422);
    });

    it('POST /api/glaseados exige el color', async () => {
      const res = await auth(request(app).post('/api/glaseados')).send({
        nombre: `Color Sin Hex ${s}`,
      });
      expect(res.status).toBe(422);
      expect(res.body.errors?.[0]?.campo).toBe('codigoHex');
    });

    it('un cliente no puede crear glaseados (403)', async () => {
      const res = await auth(
        request(app).post('/api/glaseados').send({
          nombre: `Color Cliente ${s}`,
          codigoHex: '#000000',
        }),
        tokenCliente
      );
      expect(res.status).toBe(403);
    });

    it('PUT /api/glaseados/:id actualiza nombre y color', async () => {
      const res = await auth(request(app).put(`/api/glaseados/${glaseadoId}`)).send({
        nombre: `${nombreGlaseado} Editado`,
        codigoHex: '#123456',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe(`${nombreGlaseado} Editado`);
      expect(res.body.data.codigoHex).toBe('#123456');
    });

    it('PATCH /api/glaseados/:id/estado desactiva el glaseado', async () => {
      const res = await auth(
        request(app).patch(`/api/glaseados/${glaseadoId}/estado`).send({ estado: false })
      );

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe(false);
    });

    it('el catálogo público no incluye glaseados inactivos', async () => {
      const res = await request(app).get('/api/catalogo/glaseados');
      expect(res.status).toBe(200);
      expect(res.body.data.some((c) => c.id === glaseadoId)).toBe(false);
    });

    it('DELETE /api/glaseados/:id elimina un glaseado sin pedidos', async () => {
      const res = await auth(request(app).delete(`/api/glaseados/${glaseadoId}`));
      expect(res.status).toBe(200);

      const buscar = await auth(request(app).get(`/api/glaseados/${glaseadoId}`));
      expect(buscar.status).toBe(404);
      glaseadoId = null;
    });
  });
});
