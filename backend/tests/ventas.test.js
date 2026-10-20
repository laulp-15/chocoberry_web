// tests/ventas.test.js
// Pruebas de integración del módulo de Ventas: vista de solo lectura de los
// pedidos confirmados. Cubre permisos, inclusión de Cancelado, exclusión de
// Pendiente/Rechazado, detalle y filtros.
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import app from '../src/app.js';
import { uploadsDir } from '../src/middlewares/upload.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';
const COMPROBANTE = Buffer.from('89504e470d0a1a0a', 'hex');
const ESTADOS_VENTA = ['En preparación', 'Despachado', 'Entregado', 'Cancelado'];

describe('Módulo de ventas', () => {
  let tokenAdmin;
  let tokenCliente;
  let tokenRepartidor;

  let clienteId;
  let repartidorId;

  let producto;
  let presentacion;
  let municipio;
  let color;

  let pendienteId;
  let preparacionId;
  let despachadoId;
  let entregadoId;
  let canceladoId;
  let rechazadoId;

  const pedidosCreados = [];
  const archivosCreados = new Set();
  const s = Date.now().toString().slice(-7);

  const auth = (peticion, token = tokenAdmin) =>
    peticion.set('Authorization', `Bearer ${token}`);

  async function crearUsuario({ rol, sufijo, nombres, apellidos }) {
    const res = await auth(request(app).post('/api/usuarios')).send({
      nombres,
      apellidos,
      tipoDocumento: 'CC',
      numeroDocumento: `9${s}${sufijo}`,
      correo: `ventas.${sufijo}.${s}@chocoberry.com`,
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

  async function crearPedido() {
    const res = await auth(request(app).post('/api/pedidos'))
      .field('mensajeTarjeta', 'Venta de prueba')
      .field('fechaEntrega', '2026-12-24')
      .field('direccion', 'Calle 10 # 20-30')
      .field('barrio', 'Centro')
      .field('idMunicipio', String(municipio.id))
      .field('nombreReceptor', 'Receptor Ventas')
      .field('telefonoReceptor', '3001234567')
      .field('idUsuario', String(clienteId))
      .field(
        'lineas',
        JSON.stringify([
          {
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 1,
            idColorGlaseado: color.id,
            mensajePersonalizado: 'OK',
          },
        ])
      )
      .attach('comprobante', COMPROBANTE, {
        filename: 'comprobante-venta.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(201);
    pedidosCreados.push(res.body.data.id);
    if (res.body.data.comprobantePago) {
      archivosCreados.add(path.join(uploadsDir, path.basename(res.body.data.comprobantePago)));
    }
    return res.body.data;
  }

  async function cambiarEstado(id, estado) {
    const res = await auth(request(app).patch(`/api/pedidos/${id}/estado`)).send({ estado });
    expect(res.status).toBe(200);
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
      apellidos: 'Ventas',
    });
    repartidorId = await crearUsuario({
      rol: 2,
      sufijo: '02',
      nombres: 'Repartidor',
      apellidos: 'Ventas',
    });

    tokenCliente = await iniciarSesion(`ventas.01.${s}@chocoberry.com`);
    tokenRepartidor = await iniciarSesion(`ventas.02.${s}@chocoberry.com`);

    const productos = await request(app).get('/api/catalogo/productos');
    const presentaciones = await request(app).get('/api/catalogo/presentaciones');
    const municipios = await request(app).get('/api/catalogo/municipios');
    const colores = await request(app).get('/api/catalogo/glaseados');

    producto = productos.body.data[0];
    presentacion = presentaciones.body.data[0];
    municipio = municipios.body.data.find((m) => m.nombre === 'Medellín') ?? municipios.body.data[0];
    color = colores.body.data[0];

    expect(producto?.id).toBeGreaterThan(0);
    expect(presentacion?.id).toBeGreaterThan(0);
    expect(municipio?.id).toBeGreaterThan(0);
    expect(color?.id).toBeGreaterThan(0);

    const pendiente = await crearPedido();
    pendienteId = pendiente.id;

    const preparacion = await crearPedido();
    preparacionId = preparacion.id;
    await cambiarEstado(preparacionId, 'en_preparacion');

    const despachado = await crearPedido();
    despachadoId = despachado.id;
    await cambiarEstado(despachadoId, 'en_preparacion');
    await cambiarEstado(despachadoId, 'despachado');

    const entregado = await crearPedido();
    entregadoId = entregado.id;
    await cambiarEstado(entregadoId, 'en_preparacion');
    await cambiarEstado(entregadoId, 'despachado');
    await cambiarEstado(entregadoId, 'entregado');

    const cancelado = await crearPedido();
    canceladoId = cancelado.id;
    await cambiarEstado(canceladoId, 'en_preparacion');
    await cambiarEstado(canceladoId, 'despachado');
    await cambiarEstado(canceladoId, 'cancelado');

    const rechazado = await crearPedido();
    rechazadoId = rechazado.id;
    const rechazo = await auth(
      request(app).patch(`/api/pedidos/${rechazadoId}/rechazar`)
    ).send({ motivo: 'Pago no confirmado.' });
    expect(rechazo.status).toBe(200);
  });

  afterAll(async () => {
    for (const id of [...pedidosCreados].reverse()) {
      await auth(request(app).delete(`/api/pedidos/${id}`));
    }

    for (const id of [repartidorId, clienteId]) {
      if (id) await auth(request(app).delete(`/api/usuarios/${id}`));
    }

    for (const archivo of archivosCreados) {
      fs.rmSync(archivo, { force: true });
    }
  });

  it('GET /api/ventas sin token devuelve 401', async () => {
    const res = await request(app).get('/api/ventas');
    expect(res.status).toBe(401);
  });

  it('un cliente no puede consultar ventas (403)', async () => {
    const res = await auth(request(app).get('/api/ventas'), tokenCliente);
    expect(res.status).toBe(403);
  });

  it('un repartidor no puede consultar ventas (403)', async () => {
    const res = await auth(request(app).get('/api/ventas'), tokenRepartidor);
    expect(res.status).toBe(403);
  });

  it('lista solo pedidos confirmados e incluye Cancelado', async () => {
    const res = await auth(request(app).get('/api/ventas'));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);

    const ids = res.body.data.map((venta) => venta.id);
    expect(ids).toEqual(
      expect.arrayContaining([preparacionId, despachadoId, entregadoId, canceladoId])
    );
    expect(ids).not.toContain(pendienteId);
    expect(ids).not.toContain(rechazadoId);
    expect(
      res.body.data.every((venta) => ESTADOS_VENTA.includes(venta.estado.nombre))
    ).toBe(true);
  });

  it('ordena las ventas por fecha descendente', async () => {
    const res = await auth(request(app).get('/api/ventas'));
    const fechas = res.body.data.map((venta) => new Date(venta.fecha).getTime());

    for (let i = 1; i < fechas.length; i += 1) {
      expect(fechas[i - 1]).toBeGreaterThanOrEqual(fechas[i]);
    }
  });

  it('GET /api/ventas/:id devuelve el detalle de una venta', async () => {
    const res = await auth(request(app).get(`/api/ventas/${entregadoId}`));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(entregadoId);
    expect(res.body.data.estado.nombre).toBe('Entregado');
    expect(res.body.data.lineas).toHaveLength(1);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.comprobantePago).toMatch(/^\/uploads\//);
  });

  it('un pedido Pendiente o Rechazado no se puede ver como venta (404)', async () => {
    const pendiente = await auth(request(app).get(`/api/ventas/${pendienteId}`));
    expect(pendiente.status).toBe(404);

    const rechazado = await auth(request(app).get(`/api/ventas/${rechazadoId}`));
    expect(rechazado.status).toBe(404);
  });

  it('filtra por estado de venta y mantiene solo ese estado', async () => {
    const res = await auth(request(app).get('/api/ventas').query({ estado: 'cancelado' }));

    expect(res.status).toBe(200);
    expect(res.body.data.map((venta) => venta.id)).toContain(canceladoId);
    expect(res.body.data.every((venta) => venta.estado.nombre === 'Cancelado')).toBe(true);
  });

  it('rechaza un filtro por estado que no es venta (422)', async () => {
    const res = await auth(request(app).get('/api/ventas').query({ estado: 'pendiente' }));

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/no hace parte de Ventas/i);
  });
});
