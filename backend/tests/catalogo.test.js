// tests/catalogo.test.js
// Pruebas de integración del módulo de catálogo: categorías, productos,
// presentaciones y el catálogo público de la tienda.
// Requieren la base de datos con los datos iniciales (usuario admin).
//
// Las pruebas crean datos temporales y los eliminan al final (afterAll), así
// que la base de datos queda como estaba.
import request from 'supertest';
import app from '../src/app.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };

describe('Módulo de catálogo (categorías, productos y presentaciones)', () => {
  let token;
  let categoriaId;
  let productoId;
  let presentacionId;

  // Sufijo único por corrida para no chocar con datos existentes.
  const s = Date.now().toString().slice(-7);
  const nombreCategoria = `Bebidas ${s}`;
  const nombreProducto = `Fresas con chocolate ${s}`;

  const auth = (peticion) => peticion.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    token = res.body?.data?.token;
  });

  afterAll(async () => {
    if (productoId) await auth(request(app).delete(`/api/productos/${productoId}`));
    if (categoriaId) await auth(request(app).delete(`/api/categorias/${categoriaId}`));
    if (presentacionId) await auth(request(app).delete(`/api/presentaciones/${presentacionId}`));
  });

  describe('Categorías', () => {
    it('GET /api/categorias sin token devuelve 401', async () => {
      const res = await request(app).get('/api/categorias');
      expect(res.status).toBe(401);
    });

    it('POST /api/categorias crea una categoría', async () => {
      const res = await auth(request(app).post('/api/categorias')).send({ nombre: nombreCategoria });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeGreaterThan(0);
      expect(res.body.data.nombre).toBe(nombreCategoria);
      expect(res.body.data.estado).toBe(true);
      categoriaId = res.body.data.id;
    });

    it('POST /api/categorias con nombre repetido (otra capitalización) devuelve 409', async () => {
      const res = await auth(request(app).post('/api/categorias')).send({
        nombre: nombreCategoria.toUpperCase(),
      });
      expect(res.status).toBe(409);
    });

    it('GET /api/categorias filtra por nombre', async () => {
      const res = await auth(request(app).get('/api/categorias')).query({ nombre: nombreCategoria });

      expect(res.status).toBe(200);
      expect(res.body.data.map((c) => c.id)).toContain(categoriaId);
    });
  });

  describe('Productos', () => {
    it('POST /api/productos crea un producto con su categoría', async () => {
      const res = await auth(request(app).post('/api/productos')).send({
        nombre: nombreProducto,
        descripcion: 'Producto de prueba',
        id_categoria: categoriaId,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.categoria).toEqual({ id: categoriaId, nombre: nombreCategoria });
      expect(res.body.data.imagen).toBeNull();
      productoId = res.body.data.id;
    });

    it('POST /api/productos sin categoría devuelve 422', async () => {
      const res = await auth(request(app).post('/api/productos')).send({ nombre: `Sin cat ${s}` });
      expect(res.status).toBe(422);
    });

    it('POST /api/productos con categoría inexistente devuelve 400', async () => {
      const res = await auth(request(app).post('/api/productos')).send({
        nombre: `Producto sin categoría ${s}`,
        id_categoria: 999999,
      });
      expect(res.status).toBe(400);
    });

    it('POST /api/productos con nombre repetido devuelve 409', async () => {
      const res = await auth(request(app).post('/api/productos')).send({
        nombre: nombreProducto,
        id_categoria: categoriaId,
      });
      expect(res.status).toBe(409);
    });

    it('PUT /api/productos/:id actualiza la descripción y resuelve la categoría por nombre', async () => {
      const res = await auth(request(app).put(`/api/productos/${productoId}`)).send({
        descripcion: 'Descripción editada',
        categoria: nombreCategoria,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.descripcion).toBe('Descripción editada');
      expect(res.body.data.categoria.id).toBe(categoriaId);
    });

    it('GET /api/productos filtra por nombre', async () => {
      const res = await auth(request(app).get('/api/productos')).query({ nombre: nombreProducto });

      expect(res.status).toBe(200);
      expect(res.body.data[0].id).toBe(productoId);
    });

    it('DELETE /api/categorias/:id con productos asociados devuelve 409', async () => {
      const res = await auth(request(app).delete(`/api/categorias/${categoriaId}`));
      expect(res.status).toBe(409);
    });
  });

  describe('Presentaciones', () => {
    // Cantidad alta y poco probable (el máximo permitido es 1000).
    const cantidad = 900 + (Number(s.slice(-3)) % 100);

    it('POST /api/presentaciones crea una presentación', async () => {
      const res = await auth(request(app).post('/api/presentaciones')).send({
        cantidadFresas: cantidad,
        precio: '25900.50',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.cantidadFresas).toBe(cantidad);
      expect(res.body.data.precio).toBe(25900.5);
      expect(typeof res.body.data.precio).toBe('number');
      expect(res.body.data.estado).toBe(true);
      presentacionId = res.body.data.id;
    });

    it('POST /api/presentaciones con la misma cantidad devuelve 409', async () => {
      const res = await auth(request(app).post('/api/presentaciones')).send({
        cantidadFresas: cantidad,
        precio: 1000,
      });
      expect(res.status).toBe(409);
    });

    it('PATCH /api/presentaciones/:id/estado desactiva la presentación', async () => {
      const res = await auth(request(app).patch(`/api/presentaciones/${presentacionId}/estado`)).send({
        estado: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe(false);
    });
  });

  describe('Catálogo público (sin sesión)', () => {
    it('GET /api/catalogo/productos devuelve solo productos activos', async () => {
      const res = await request(app).get('/api/catalogo/productos');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.every((p) => p.estado === true)).toBe(true);
      expect(res.body.data.map((p) => p.id)).toContain(productoId);
    });

    it('GET /api/catalogo/productos/:id devuelve el producto activo', async () => {
      const res = await request(app).get(`/api/catalogo/productos/${productoId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(productoId);
    });

    it('GET /api/catalogo/productos/:id de un producto inactivo devuelve 404', async () => {
      const desactivado = await auth(request(app).patch(`/api/productos/${productoId}/estado`)).send({
        estado: false,
      });
      expect(desactivado.status).toBe(200);

      const res = await request(app).get(`/api/catalogo/productos/${productoId}`);
      expect(res.status).toBe(404);
    });

    it('GET /api/catalogo/categorias y /presentaciones responden sin sesión', async () => {
      const categorias = await request(app).get('/api/catalogo/categorias');
      const presentaciones = await request(app).get('/api/catalogo/presentaciones');

      expect(categorias.status).toBe(200);
      expect(presentaciones.status).toBe(200);
      expect(Array.isArray(categorias.body.data)).toBe(true);
      expect(Array.isArray(presentaciones.body.data)).toBe(true);
    });
  });

  describe('Autorización por permisos', () => {
    it('un Cliente puede ver productos (200) pero no crearlos (403)', async () => {
      const correo = `cliente.prueba.${s}@chocoberry.com`;

      const creado = await auth(request(app).post('/api/usuarios')).send({
        nombres: 'Prueba',
        apellidos: 'Cliente',
        tipoDocumento: 'CC',
        numeroDocumento: `9${s}00`,
        correo,
        contrasena: 'Prueba123!',
        id_rol: 3,
      });
      expect(creado.status).toBe(201);
      const usuarioId = creado.body.data.id;

      const login = await request(app)
        .post('/api/auth/login')
        .send({ correo, contrasena: 'Prueba123!' });
      const tokenCliente = login.body.data.token;

      const puedeVer = await request(app)
        .get('/api/productos')
        .set('Authorization', `Bearer ${tokenCliente}`);
      expect(puedeVer.status).toBe(200);

      const noPuedeCrear = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${tokenCliente}`)
        .send({ nombre: `No permitido ${s}`, id_categoria: categoriaId });
      expect(noPuedeCrear.status).toBe(403);

      await auth(request(app).delete(`/api/usuarios/${usuarioId}`));
    });
  });
});
