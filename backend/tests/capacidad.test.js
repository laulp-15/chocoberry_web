// tests/capacidad.test.js
// Pruebas de integración de la capacidad diaria: consulta del mes y del día,
// excepciones, bloqueo, cupo al crear pedidos, edición y estados que ocupan cupo.
import request from 'supertest';
import app from '../src/app.js';
import { fijarTope, restablecerFechas } from './helpers/capacidad.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';
const COMPROBANTE = Buffer.from('89504e470d0a1a0a', 'hex');

/** Fecha ISO local de hoy + N días. */
function fechaISO(dias) {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function fechaCorta(iso) {
  const [anio, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${anio}`;
}

const F2 = fechaISO(2);
const F3 = fechaISO(3);
const FECHAS = [F2, F3, ...[16, 17, 18, 19, 20].map(fechaISO)];
const F16 = FECHAS[2];
const F17 = FECHAS[3];
const F18 = FECHAS[4];
const F19 = FECHAS[5];
const F20 = FECHAS[6];

describe('Módulo de capacidad diaria', () => {
  let tokenAdmin;
  let tokenCliente;
  let clienteId;

  let producto;
  let presentacion;
  let municipio;
  let color;

  const pedidosCreados = [];
  const s = Date.now().toString().slice(-7);

  const auth = (peticion, token = tokenAdmin) =>
    peticion.set('Authorization', `Bearer ${token}`);

  const linea = (cantidad) => ({
    idProducto: producto.id,
    idPresentacion: presentacion.id,
    cantidadProductos: cantidad,
    idColorGlaseado: color.id,
    letrasFresas: 'OK',
  });

  function solicitudPedido({
    fecha = F16,
    cantidad = 2,
    token = tokenAdmin,
    conComprobante = true,
  } = {}) {
    let peticion = auth(request(app).post('/api/pedidos'), token)
      .field('fechaEntrega', fecha)
      .field('direccion', 'Calle 10 # 20-30')
      .field('idMunicipio', String(municipio.id))
      .field('nombreReceptor', 'Receptor Capacidad')
      .field('telefonoReceptor', '3001234567')
      .field('lineas', JSON.stringify([linea(cantidad)]));

    if (conComprobante) {
      peticion = peticion.attach('comprobante', COMPROBANTE, {
        filename: 'comprobante-capacidad.png',
        contentType: 'image/png',
      });
    }

    return peticion;
  }

  async function crearPedidoOk(opciones) {
    const res = await solicitudPedido(opciones);
    expect(res.status).toBe(201);
    pedidosCreados.push(res.body.data.id);
    return res.body.data;
  }

  async function cambiarEstado(id, estado) {
    const payload = { estado };
    if (estado === 'cancelado') {
      payload.observacionesEntrega = 'Cancelación de prueba de capacidad.';
    }
    const res = await auth(
      request(app).patch(`/api/pedidos/${id}/estado`).send(payload)
    );
    expect(res.status).toBe(200);
    return res.body.data;
  }

  async function crearUsuarioCliente() {
    const res = await auth(request(app).post('/api/usuarios')).send({
      nombres: 'Cliente',
      apellidos: 'Capacidad',
      tipoDocumento: 'CC',
      numeroDocumento: `7${s}01`,
      correo: `capacidad.cliente.${s}@chocoberry.com`,
      contrasena: CLAVE_PRUEBA,
      id_rol: 3,
    });
    expect(res.status).toBe(201);
    return res.body.data.id;
  }

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send(ADMIN);
    tokenAdmin = login.body?.data?.token;
    expect(tokenAdmin).toBeTruthy();

    clienteId = await crearUsuarioCliente();
    const loginCliente = await request(app).post('/api/auth/login').send({
      correo: `capacidad.cliente.${s}@chocoberry.com`,
      contrasena: CLAVE_PRUEBA,
    });
    expect(loginCliente.status).toBe(200);
    tokenCliente = loginCliente.body.data.token;

    const productos = await request(app).get('/api/catalogo/productos');
    const presentaciones = await request(app).get('/api/catalogo/presentaciones');
    const municipios = await request(app).get('/api/catalogo/municipios');
    const colores = await request(app).get('/api/catalogo/glaseados');

    producto = productos.body.data[0];
    presentacion = presentaciones.body.data[0];
    municipio =
      municipios.body.data.find((m) => m.nombre === 'Medellín') ??
      municipios.body.data[0];
    color = colores.body.data[0];

    expect(producto?.id).toBeGreaterThan(0);
    expect(presentacion?.id).toBeGreaterThan(0);
    expect(municipio?.id).toBeGreaterThan(0);
    expect(color?.id).toBeGreaterThan(0);

    await Promise.all(FECHAS.map((fecha) => fijarTope(fecha)));
  });

  afterEach(async () => {
    for (const id of pedidosCreados.splice(0).reverse()) {
      await auth(request(app).delete(`/api/pedidos/${id}`));
    }
    await restablecerFechas(FECHAS, { conservar: true });
  });

  afterAll(async () => {
    if (clienteId) {
      await auth(request(app).delete(`/api/usuarios/${clienteId}`));
    }
    await restablecerFechas(FECHAS);
  });

  it('GET /api/capacidad sin token devuelve 401', async () => {
    const res = await request(app).get('/api/capacidad');
    expect(res.status).toBe(401);
  });

  it('un cliente no puede consultar ni editar la capacidad (403)', async () => {
    const consulta = await auth(request(app).get('/api/capacidad'), tokenCliente);
    expect(consulta.status).toBe(403);

    const edicion = await auth(
      request(app).put(`/api/capacidad/${F16}`).send({ maxFresas: 30 }),
      tokenCliente
    );
    expect(edicion.status).toBe(403);
  });

  it('lista el mes con el tope estándar y los días', async () => {
    const mes = F16.slice(0, 7);
    const res = await auth(request(app).get('/api/capacidad').query({ mes }));

    expect(res.status).toBe(200);
    expect(res.body.data.mes).toBe(mes);
    expect(res.body.data.topeEstandar).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.dias)).toBe(true);
    expect(res.body.data.dias.some((dia) => dia.fecha === F16)).toBe(true);
  });

  it('permite fijar, bloquear y restablecer el tope de un día', async () => {
    const estandar = await auth(request(app).get('/api/capacidad/estandar'));
    expect(estandar.status).toBe(200);
    const topeEstandar = estandar.body.data.maxFresas;

    let res = await auth(
      request(app).put(`/api/capacidad/${F16}`).send({ maxFresas: 30 })
    );
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      fecha: F16,
      tope: 30,
      fresasAgendadas: 0,
      disponible: 30,
      tieneExcepcion: true,
      bloqueado: false,
    });

    const mes = await auth(
      request(app).get('/api/capacidad').query({ mes: F16.slice(0, 7) })
    );
    expect(
      mes.body.data.dias.find((dia) => dia.fecha === F16)
    ).toMatchObject({ tope: 30, tieneExcepcion: true });

    res = await auth(request(app).put(`/api/capacidad/${F16}/bloqueo`));
    expect(res.status).toBe(200);
    expect(res.body.data.tope).toBe(0);
    expect(res.body.data.bloqueado).toBe(true);
    expect(res.body.data.disponible).toBe(0);

    res = await auth(request(app).delete(`/api/capacidad/${F16}`));
    expect(res.status).toBe(200);
    expect(res.body.data.tope).toBe(topeEstandar);
    expect(res.body.data.tieneExcepcion).toBe(false);
    expect(res.body.data.bloqueado).toBe(false);
  });

  it('muestra el cupo disponible del día', async () => {
    await fijarTope(F16, 24);
    await crearPedidoOk({ fecha: F16, cantidad: 2 });

    const res = await auth(request(app).get(`/api/capacidad/${F16}`));
    expect(res.status).toBe(200);
    expect(res.body.data.fresasAgendadas).toBe(12);
    expect(res.body.data.disponible).toBe(12);
  });

  it('rechaza un pedido cuando el día está lleno y sugiere la siguiente fecha', async () => {
    await fijarTope(F16, 12);
    await crearPedidoOk({ fecha: F16, cantidad: 2 });

    const res = await solicitudPedido({ fecha: F16, cantidad: 2 });

    expect(res.status).toBe(409);
    expect(res.body.message.toLowerCase()).toContain('ese día no tiene cupo');
    expect(res.body.message).toContain(fechaCorta(F17));
    expect(res.body.errors?.[0]?.campo).toBe('fechaEntrega');
  });

  it('rechaza pedidos en un día bloqueado', async () => {
    await fijarTope(F18, 0);

    const res = await solicitudPedido({ fecha: F18, cantidad: 2 });

    expect(res.status).toBe(409);
    expect(res.body.message.toLowerCase()).toContain('ese día no tiene cupo');
  });

  it('no permite bajar el tope por debajo de las fresas ya agendadas', async () => {
    await fijarTope(F16, 12);
    await crearPedidoOk({ fecha: F16, cantidad: 2 });

    let res = await auth(
      request(app).put(`/api/capacidad/${F16}`).send({ maxFresas: 6 })
    );
    expect(res.status).toBe(409);
    expect(res.body.errors?.[0]?.campo).toBe('maxFresas');

    res = await auth(
      request(app).put(`/api/capacidad/${F16}`).send({ maxFresas: 0 })
    );
    expect(res.status).toBe(200);
    expect(res.body.data.bloqueado).toBe(true);
  });

  it('los pedidos cancelados siguen ocupando cupo', async () => {
    await fijarTope(F19, 12);
    const pedido = await crearPedidoOk({ fecha: F19, cantidad: 2 });
    await cambiarEstado(pedido.id, 'en_preparacion');
    await cambiarEstado(pedido.id, 'despachado');
    await cambiarEstado(pedido.id, 'cancelado');

    const res = await solicitudPedido({ fecha: F19, cantidad: 2 });

    expect(res.status).toBe(409);
    expect(res.body.message.toLowerCase()).toContain('ese día no tiene cupo');
  });

  it('los pedidos rechazados liberan el cupo', async () => {
    await fijarTope(F20, 12);
    const pedido = await crearPedidoOk({ fecha: F20, cantidad: 2 });
    const rechazo = await auth(
      request(app).patch(`/api/pedidos/${pedido.id}/rechazar`).send({
        motivo: 'Pago no confirmado en la prueba.',
      })
    );
    expect(rechazo.status).toBe(200);

    const nuevo = await crearPedidoOk({ fecha: F20, cantidad: 2 });
    expect(nuevo.fechaEntrega).toBe(F20);
  });

  it('valida el cupo al mover un pedido a otra fecha', async () => {
    await fijarTope(F16, 12);
    await fijarTope(F17);
    await crearPedidoOk({ fecha: F16, cantidad: 2 });
    const movible = await crearPedidoOk({ fecha: F17, cantidad: 2 });

    const res = await auth(
      request(app).put(`/api/pedidos/${movible.id}`).send({ fechaEntrega: F16 })
    );

    expect(res.status).toBe(409);
    expect(res.body.message.toLowerCase()).toContain('ese día no tiene cupo');
    expect(res.body.errors?.[0]?.campo).toBe('fechaEntrega');
  });

  it('valida el cupo al reprogramar un pedido cancelado', async () => {
    await fijarTope(F2, 12);
    await fijarTope(F3);
    await crearPedidoOk({ fecha: F2, cantidad: 2 });
    const cancelado = await crearPedidoOk({ fecha: F3, cantidad: 2 });
    await cambiarEstado(cancelado.id, 'en_preparacion');
    await cambiarEstado(cancelado.id, 'despachado');
    await cambiarEstado(cancelado.id, 'cancelado');

    const res = await auth(
      request(app)
        .patch(`/api/pedidos/${cancelado.id}/reprogramar`)
        .send({ fechaEntrega: F2 })
    );

    expect(res.status).toBe(409);
    expect(res.body.message.toLowerCase()).toContain('ese día no tiene cupo');
    expect(res.body.errors?.[0]?.campo).toBe('fechaEntrega');
  });
});
