// tests/catalogo.test.js
// Pruebas de integración del módulo de catálogo: categorías, productos,
// presentaciones y el catálogo público de la tienda.
// Requieren la base de datos con los datos iniciales (usuario admin).
//
// Las pruebas crean datos temporales y los eliminan al final (afterAll), así
// que la base de datos queda como estaba.
import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };

describe('Módulo de catálogo (categorías, productos y presentaciones)', () => {
  let token;
  let categoriaId;
  let productoId;
  let productoArchivoId;
  let productoTokenId;
  let presentacionId;

  // Sufijo único por corrida para no chocar con datos existentes.
  const s = Date.now().toString().slice(-7);
  const nombreCategoria = `Bebidas ${s}`;
  const nombreProducto = `Fresas con chocolate ${s}`;
  const IMAGENES_PRODUCTO = [
    '/img/Productos/prueba-a.png',
    '/img/Productos/prueba-b.png',
  ];
  const IMAGEN_NUEVA = '/img/Productos/prueba-c.png';

  const auth = (peticion) => peticion.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    token = res.body?.data?.token;
  });

  afterAll(async () => {
    if (productoId) await auth(request(app).delete(`/api/productos/${productoId}`));
    if (productoArchivoId) {
      await auth(request(app).delete(`/api/productos/${productoArchivoId}`));
    }
    if (productoTokenId) {
      await auth(request(app).delete(`/api/productos/${productoTokenId}`));
    }
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
    it('POST /api/productos crea un producto con su categoría y sus imágenes', async () => {
      const res = await auth(request(app).post('/api/productos')).send({
        nombre: nombreProducto,
        descripcion: 'Producto de prueba',
        id_categoria: categoriaId,
        imagenesUrl: IMAGENES_PRODUCTO,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.categoria).toEqual({ id: categoriaId, nombre: nombreCategoria });
      expect(res.body.data.imagen).toBe(IMAGENES_PRODUCTO[0]);
      expect(res.body.data.imagenes.map((imagen) => imagen.url)).toEqual(IMAGENES_PRODUCTO);
      expect(res.body.data.imagenes.map((imagen) => imagen.orden)).toEqual([1, 2]);
      productoId = res.body.data.id;
    });

    it('POST /api/productos sin imágenes devuelve 422', async () => {
      const res = await auth(request(app).post('/api/productos')).send({
        nombre: `Sin imagen ${s}`,
        id_categoria: categoriaId,
      });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('al menos una imagen');
    });

    it('POST /api/productos con más de 4 imágenes devuelve 422', async () => {
      const res = await auth(request(app).post('/api/productos')).send({
        nombre: `Demasiadas imágenes ${s}`,
        id_categoria: categoriaId,
        imagenesUrl: [1, 2, 3, 4, 5].map((n) => `/img/Productos/prueba-${n}.png`),
      });

      expect(res.status).toBe(422);
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
        imagenesUrl: [IMAGENES_PRODUCTO[0]],
      });
      expect(res.status).toBe(409);
    });

    it('PUT /api/productos/:id actualiza la descripción y reordena las imágenes', async () => {
      const res = await auth(request(app).put(`/api/productos/${productoId}`)).send({
        descripcion: 'Descripción editada',
        categoria: nombreCategoria,
        ordenImagenes: [IMAGENES_PRODUCTO[1], IMAGENES_PRODUCTO[0]],
      });

      expect(res.status).toBe(200);
      expect(res.body.data.descripcion).toBe('Descripción editada');
      expect(res.body.data.categoria.id).toBe(categoriaId);
      expect(res.body.data.imagen).toBe(IMAGENES_PRODUCTO[1]);
      expect(res.body.data.imagenes.map((imagen) => imagen.url)).toEqual([
        IMAGENES_PRODUCTO[1],
        IMAGENES_PRODUCTO[0],
      ]);
    });

    it('PUT /api/productos/:id conserva las imágenes si no se envían', async () => {
      const res = await auth(request(app).put(`/api/productos/${productoId}`)).send({
        descripcion: 'Otra descripción',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.imagenes).toHaveLength(2);
    });

    it('PUT /api/productos/:id rechaza dejar un producto sin imágenes', async () => {
      const creado = await query(
        'INSERT INTO producto (nombre, estado, id_categoria) VALUES (?, TRUE, ?)',
        [`Producto legado sin imagen ${s}`, categoriaId]
      );
      const id = creado.insertId;

      try {
        const res = await auth(request(app).put(`/api/productos/${id}`)).send({
          descripcion: 'Intento de edición sin imágenes',
        });

        expect(res.status).toBe(422);
        expect(res.body.message).toContain('al menos una imagen');
      } finally {
        await query('DELETE FROM producto WHERE id = ?', [id]);
      }
    });

    it('PUT /api/productos/:id quita las imágenes que no se indican', async () => {
      const res = await auth(request(app).put(`/api/productos/${productoId}`)).send({
        ordenImagenes: [IMAGENES_PRODUCTO[1]],
      });

      expect(res.status).toBe(200);
      expect(res.body.data.imagen).toBe(IMAGENES_PRODUCTO[1]);
      expect(res.body.data.imagenes).toHaveLength(1);
    });

    it('PUT /api/productos/:id agrega una imagen nueva al final', async () => {
      const res = await auth(request(app).put(`/api/productos/${productoId}`)).send({
        imagenesUrl: [IMAGEN_NUEVA],
        ordenImagenes: [IMAGENES_PRODUCTO[1], IMAGEN_NUEVA],
      });

      expect(res.status).toBe(200);
      expect(res.body.data.imagenes.map((imagen) => imagen.url)).toEqual([
        IMAGENES_PRODUCTO[1],
        IMAGEN_NUEVA,
      ]);
    });

    it('POST /api/productos acepta archivos multipart', async () => {
      const res = await auth(request(app).post('/api/productos'))
        .field('nombre', `Producto con archivo ${s}`)
        .field('descripcion', 'Subida multipart')
        .field('id_categoria', String(categoriaId))
        .attach('imagenes', Buffer.from('89504e470d0a1a0a', 'hex'), {
          filename: 'producto-prueba.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.imagenes).toHaveLength(1);
      expect(res.body.data.imagenes[0].url).toMatch(/^\/uploads\//);
      productoArchivoId = res.body.data.id;
    });

    it('PUT /api/productos/:id ordena archivos nuevos y rutas existentes con tokens', async () => {
      const creado = await auth(request(app).post('/api/productos')).send({
        nombre: `Producto ordenado ${s}`,
        id_categoria: categoriaId,
        imagenesUrl: [IMAGENES_PRODUCTO[0]],
      });
      expect(creado.status).toBe(201);
      productoTokenId = creado.body.data.id;

      const res = await auth(request(app).put(`/api/productos/${productoTokenId}`))
        .field('ordenImagenes', JSON.stringify([IMAGENES_PRODUCTO[0], 'nueva:0']))
        .attach('imagenes', Buffer.from('89504e470d0a1a0a', 'hex'), {
          filename: 'segunda.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.imagenes).toHaveLength(2);
      expect(res.body.data.imagenes[0].url).toBe(IMAGENES_PRODUCTO[0]);
      expect(res.body.data.imagenes[1].url).toMatch(/^\/uploads\//);
      expect(res.body.data.imagen).toBe(IMAGENES_PRODUCTO[0]);
    });

    it('POST /api/productos rechaza un token de imagen nueva inexistente', async () => {
      const res = await auth(request(app).post('/api/productos')).send({
        nombre: `Token inválido ${s}`,
        id_categoria: categoriaId,
        ordenImagenes: ['nueva:3'],
      });

      expect(res.status).toBe(422);
    });

    it('GET /api/productos filtra por nombre', async () => {
      const res = await auth(request(app).get('/api/productos')).query({ nombre: nombreProducto });

      expect(res.status).toBe(200);
      expect(res.body.data[0].id).toBe(productoId);
    });

    it('al eliminar el producto se eliminan sus imágenes', async () => {
      const creado = await auth(request(app).post('/api/productos')).send({
        nombre: `Cascada ${s}`,
        id_categoria: categoriaId,
        imagenesUrl: ['/img/Productos/cascada.png'],
      });
      expect(creado.status).toBe(201);
      const id = creado.body.data.id;

      const antes = await query(
        'SELECT COUNT(*) AS total FROM imagenProducto WHERE id_producto = ?',
        [id]
      );
      expect(antes[0].total).toBe(1);

      const borrado = await auth(request(app).delete(`/api/productos/${id}`));
      expect(borrado.status).toBe(200);

      const despues = await query(
        'SELECT COUNT(*) AS total FROM imagenProducto WHERE id_producto = ?',
        [id]
      );
      expect(despues[0].total).toBe(0);
    });

    it('DELETE /api/categorias/:id con productos asociados devuelve 409', async () => {
      const res = await auth(request(app).delete(`/api/categorias/${categoriaId}`));
      expect(res.status).toBe(409);
    });

    it('PUT /api/categorias/:id no cambia el estado', async () => {
      const baja = await auth(
        request(app).patch(`/api/categorias/${categoriaId}/estado`).send({ estado: false })
      );
      expect(baja.status).toBe(200);

      const res = await auth(request(app).put(`/api/categorias/${categoriaId}`)).send({
        nombre: nombreCategoria,
        estado: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.estado).toBe(false);

      await auth(
        request(app).patch(`/api/categorias/${categoriaId}/estado`).send({ estado: true })
      );
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

    it('PUT /api/presentaciones/:id no cambia el estado', async () => {
      const res = await auth(
        request(app).put(`/api/presentaciones/${presentacionId}`)
      ).send({
        precio: 30000,
        estado: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.precio).toBe(30000);
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

      const producto = res.body.data.find((p) => p.id === productoId);
      expect(producto.imagen).toBe(IMAGENES_PRODUCTO[1]);
      expect(producto.imagenes.map((imagen) => imagen.url)).toEqual([
        IMAGENES_PRODUCTO[1],
        IMAGEN_NUEVA,
      ]);
    });

    it('GET /api/catalogo/productos/:id devuelve el producto activo', async () => {
      const res = await request(app).get(`/api/catalogo/productos/${productoId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(productoId);
      expect(res.body.data.imagenes).toHaveLength(2);
    });

    it('GET /api/catalogo/productos/:id de un producto inactivo devuelve 404', async () => {
      const desactivado = await auth(request(app).patch(`/api/productos/${productoId}/estado`)).send({
        estado: false,
      });
      expect(desactivado.status).toBe(200);

      const res = await request(app).get(`/api/catalogo/productos/${productoId}`);
      expect(res.status).toBe(404);
    });

    it('PUT /api/productos/:id no cambia el estado', async () => {
      const res = await auth(request(app).put(`/api/productos/${productoId}`)).send({
        descripcion: 'Intento de reactivación',
        estado: true,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.descripcion).toBe('Intento de reactivación');
      expect(res.body.data.estado).toBe(false);
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
