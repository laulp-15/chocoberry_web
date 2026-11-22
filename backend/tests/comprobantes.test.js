// tests/comprobantes.test.js
// Pruebas de integración de los comprobantes de pago: cupo de pendientes,
// subida y borrado por el cliente dueño, aprobación parcial, devolución con
// motivo y bloqueo del paso a preparación con saldo.
import request from 'supertest';
import app from '../src/app.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';
const COMPROBANTE = Buffer.from('89504e470d0a1a0a', 'hex');

const redondear2 = (valor) =>
  Math.round((Number(valor) + Number.EPSILON) * 100) / 100;

describe('Módulo de comprobantes de pago', () => {
  let tokenAdmin;
  let tokenCliente;
  let tokenOtroCliente;
  let clienteId;
  let otroClienteId;

  let producto;
  let presentacion;
  let municipio;
  let color;

  let pedidoDetalleId;
  let totalDetalle;
  let comprobanteDetalleId;

  let pedidoAdminId;
  let totalAdmin;

  let pedidoCupoId;
  let totalCupo;
  let comprobanteCupoId;
  let subidoAId;
  let subidoBId;
  let subidoCId;

  let pedidoParcialId;
  let totalParcial;
  let comprobanteParcialId;

  let pedidoDevolucionId;
  let totalDevolucion;
  let comprobanteDevolucionId;

  let pedidoSobrepagoId;
  let totalSobrepago;
  let comprobanteSobrepagoId;

  const pedidosCreados = [];
  const s = Date.now().toString().slice(-7);

  const auth = (peticion, token = tokenAdmin) =>
    peticion.set('Authorization', `Bearer ${token}`);

  async function crearUsuario({ sufijo, nombres, apellidos }) {
    const res = await auth(request(app).post('/api/usuarios')).send({
      nombres,
      apellidos,
      tipoDocumento: 'CC',
      numeroDocumento: `8${s}${sufijo}`,
      correo: `comprobantes.${sufijo}.${s}@chocoberry.com`,
      contrasena: CLAVE_PRUEBA,
      id_rol: 3,
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

  async function crearPedido(idUsuario) {
    const res = await auth(request(app).post('/api/pedidos'), tokenCliente)
      .field('fechaEntrega', '2026-12-24')
      .field('direccion', 'Calle 10 # 20-30')
      .field('idMunicipio', String(municipio.id))
      .field('nombreReceptor', 'Receptor Comprobantes')
      .field('telefonoReceptor', '3001234567')
      .field('idUsuario', String(idUsuario))
      .field(
        'lineas',
        JSON.stringify([
          {
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 1,
            idColorGlaseado: color.id,
            letrasFresas: 'OK',
          },
        ])
      )
      .attach('comprobante', COMPROBANTE, {
        filename: 'comprobante-inicial.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(201);
    pedidosCreados.push(res.body.data.id);
    return res.body.data;
  }

  async function subirComprobante(id, token = tokenCliente, conArchivo = true) {
    let peticion = request(app).post(`/api/pedidos/${id}/comprobantes`);
    peticion = auth(peticion, token);
    if (conArchivo) {
      peticion = peticion.attach('comprobante', COMPROBANTE, {
        filename: 'comprobante-extra.png',
        contentType: 'image/png',
      });
    }
    return peticion;
  }

  async function detalle(id, token = tokenCliente) {
    return auth(request(app).get(`/api/pedidos/${id}`), token);
  }

  async function aprobar(id, monto) {
    return auth(
      request(app).patch(`/api/comprobantes/${id}/aprobar`).send({ monto })
    );
  }

  async function devolver(id, motivo) {
    return auth(
      request(app).patch(`/api/comprobantes/${id}/devolver`).send({ motivo })
    );
  }

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send(ADMIN);
    tokenAdmin = login.body?.data?.token;
    expect(tokenAdmin).toBeTruthy();

    clienteId = await crearUsuario({
      sufijo: '01',
      nombres: 'Cliente',
      apellidos: 'Comprobantes',
    });
    otroClienteId = await crearUsuario({
      sufijo: '02',
      nombres: 'Otro',
      apellidos: 'Cliente',
    });

    tokenCliente = await iniciarSesion(`comprobantes.01.${s}@chocoberry.com`);
    tokenOtroCliente = await iniciarSesion(
      `comprobantes.02.${s}@chocoberry.com`
    );
    expect(otroClienteId).toBeGreaterThan(0);

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

    const pedidoDetalle = await crearPedido(clienteId);
    pedidoDetalleId = pedidoDetalle.id;
    totalDetalle = pedidoDetalle.total;
    comprobanteDetalleId = pedidoDetalle.comprobantes[0].id;

    const pedidoAdmin = await crearPedido(clienteId);
    pedidoAdminId = pedidoAdmin.id;
    totalAdmin = pedidoAdmin.total;

    const pedidoCupo = await crearPedido(clienteId);
    pedidoCupoId = pedidoCupo.id;
    totalCupo = pedidoCupo.total;
    comprobanteCupoId = pedidoCupo.comprobantes[0].id;

    const pedidoParcial = await crearPedido(clienteId);
    pedidoParcialId = pedidoParcial.id;
    totalParcial = pedidoParcial.total;
    comprobanteParcialId = pedidoParcial.comprobantes[0].id;

    const pedidoDevolucion = await crearPedido(clienteId);
    pedidoDevolucionId = pedidoDevolucion.id;
    totalDevolucion = pedidoDevolucion.total;
    comprobanteDevolucionId = pedidoDevolucion.comprobantes[0].id;

    const pedidoSobrepago = await crearPedido(clienteId);
    pedidoSobrepagoId = pedidoSobrepago.id;
    totalSobrepago = pedidoSobrepago.total;
    comprobanteSobrepagoId = pedidoSobrepago.comprobantes[0].id;
  });

  afterAll(async () => {
    // Los pedidos primero: un usuario con pedidos no se puede eliminar.
    for (const id of pedidosCreados) {
      await auth(request(app).delete(`/api/pedidos/${id}`));
    }

    for (const id of [otroClienteId, clienteId]) {
      if (id) await auth(request(app).delete(`/api/usuarios/${id}`));
    }
  });

  it('POST sin token devuelve 401', async () => {
    const res = await request(app)
      .post(`/api/pedidos/${pedidoDetalleId}/comprobantes`)
      .attach('comprobante', COMPROBANTE, {
        filename: 'comprobante.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(401);
  });

  it('el detalle expone comprobantes, total aprobado, saldo y cupo', async () => {
    const res = await detalle(pedidoDetalleId);

    expect(res.status).toBe(200);
    expect(res.body.data.comprobantes).toHaveLength(1);
    expect(res.body.data.comprobantes[0]).toEqual(
      expect.objectContaining({
        id: comprobanteDetalleId,
        monto: null,
        estado: expect.objectContaining({ nombre: 'Pendiente' }),
      })
    );
    expect(res.body.data.totalPagado).toBe(0);
    expect(res.body.data.saldo).toBe(totalDetalle);
    expect(res.body.data.puedeSubirComprobante).toBe(true);
  });

  it('un cliente ajeno no puede subir comprobantes (404)', async () => {
    const res = await subirComprobante(pedidoDetalleId, tokenOtroCliente);
    expect(res.status).toBe(404);
  });

  it('el admin sube un comprobante y queda aprobado por el saldo', async () => {
    const res = await subirComprobante(pedidoAdminId, tokenAdmin);

    expect(res.status).toBe(201);
    expect(res.body.data.saldo).toBe(0);
    expect(res.body.data.totalPagado).toBe(totalAdmin);
    expect(res.body.data.puedeSubirComprobante).toBe(false);

    const comprobante = res.body.data.comprobantes.at(-1);
    expect(comprobante.estado.nombre).toBe('Aprobado');
    expect(comprobante.monto).toBe(totalAdmin);
  });

  it('subir sin archivo devuelve 422', async () => {
    const res = await subirComprobante(pedidoDetalleId, tokenCliente, false);
    expect(res.status).toBe(422);
  });

  it('el cupo cuenta solo pendientes: aprobar uno libera espacio', async () => {
    const primero = await subirComprobante(pedidoCupoId);
    expect(primero.status).toBe(201);
    expect(primero.body.data.comprobantes).toHaveLength(2);
    subidoAId = primero.body.data.comprobantes.at(-1).id;

    const segundo = await subirComprobante(pedidoCupoId);
    expect(segundo.status).toBe(201);
    expect(segundo.body.data.comprobantes).toHaveLength(3);
    expect(segundo.body.data.puedeSubirComprobante).toBe(false);
    subidoBId = segundo.body.data.comprobantes.at(-1).id;

    const tercero = await subirComprobante(pedidoCupoId);
    expect(tercero.status).toBe(409);

    const parcial = redondear2(totalCupo / 4);
    const aprobado = await aprobar(comprobanteCupoId, parcial);
    expect(aprobado.status).toBe(200);
    expect(aprobado.body.data.pedido.totalPagado).toBe(parcial);
    expect(aprobado.body.data.pedido.saldo).toBeCloseTo(totalCupo - parcial, 2);
    expect(aprobado.body.data.pedido.puedeSubirComprobante).toBe(true);

    const cuarto = await subirComprobante(pedidoCupoId);
    expect(cuarto.status).toBe(201);
    expect(cuarto.body.data.comprobantes).toHaveLength(4);
    subidoCId = cuarto.body.data.comprobantes.at(-1).id;

    const quinto = await subirComprobante(pedidoCupoId);
    expect(quinto.status).toBe(409);
  });

  it('el cliente elimina sus comprobantes Pendientes', async () => {
    const res = await auth(
      request(app).delete(`/api/comprobantes/${subidoAId}`),
      tokenCliente
    );

    expect(res.status).toBe(200);
    expect(res.body.data.comprobantes.map((c) => c.id)).not.toContain(subidoAId);
  });

  it('un cliente no puede aprobar ni devolver comprobantes (403)', async () => {
    const aprobarRes = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteDevolucionId}/aprobar`)
        .send({ monto: 1 }),
      tokenCliente
    );
    expect(aprobarRes.status).toBe(403);

    const devolverRes = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteDevolucionId}/devolver`)
        .send({ motivo: 'Motivo inválido.' }),
      tokenCliente
    );
    expect(devolverRes.status).toBe(403);
  });

  it('devolver exige motivo, no cuenta para el total ni ocupa cupo', async () => {
    const sinMotivo = await devolver(comprobanteDevolucionId, '');
    expect(sinMotivo.status).toBe(422);

    const res = await devolver(
      comprobanteDevolucionId,
      'La transferencia no coincide con el pedido.'
    );
    expect(res.status).toBe(200);
    expect(res.body.data.totalPagado).toBe(0);
    expect(res.body.data.saldo).toBe(totalDevolucion);
    expect(res.body.data.puedeSubirComprobante).toBe(true);

    const comprobante = res.body.data.comprobantes.find(
      (c) => c.id === comprobanteDevolucionId
    );
    expect(comprobante.estado.nombre).toBe('Devuelto');
    expect(comprobante.motivoDevolucion).toBe(
      'La transferencia no coincide con el pedido.'
    );

    const reabrir = await aprobar(comprobanteDevolucionId, 1);
    expect(reabrir.status).toBe(409);

    const nueva = await subirComprobante(pedidoDevolucionId);
    expect(nueva.status).toBe(201);
    expect(nueva.body.data.puedeSubirComprobante).toBe(true);
  });

  it('permite varios aprobados parciales y bloquea preparación hasta completar', async () => {
    const porcion = redondear2(totalParcial / 5);

    const primero = await aprobar(comprobanteParcialId, porcion);
    expect(primero.status).toBe(200);
    expect(primero.body.data.pedido.totalPagado).toBe(porcion);
    expect(primero.body.data.pedido.saldo).toBeCloseTo(
      totalParcial - porcion,
      2
    );

    const bloqueado = await auth(
      request(app)
        .patch(`/api/pedidos/${pedidoParcialId}/estado`)
        .send({ estado: 'en_preparacion' })
    );
    expect(bloqueado.status).toBe(409);

    let pagado = porcion;

    for (let indice = 0; indice < 3; indice += 1) {
      const subida = await subirComprobante(pedidoParcialId);
      expect(subida.status).toBe(201);
      const comprobanteId = subida.body.data.comprobantes.at(-1).id;

      const aprobado = await aprobar(comprobanteId, porcion);
      expect(aprobado.status).toBe(200);
      pagado = redondear2(pagado + porcion);
      expect(aprobado.body.data.pedido.totalPagado).toBe(pagado);
    }

    const restante = redondear2(totalParcial - pagado);
    expect(restante).toBeGreaterThan(0);

    const ultimaSubida = await subirComprobante(pedidoParcialId);
    expect(ultimaSubida.status).toBe(201);
    const ultimoComprobanteId = ultimaSubida.body.data.comprobantes.at(-1).id;

    const completo = await aprobar(ultimoComprobanteId, restante);
    expect(completo.status).toBe(200);
    expect(completo.body.data.pedido.totalPagado).toBe(totalParcial);
    expect(completo.body.data.pedido.saldo).toBe(0);
    expect(completo.body.data.pedido.estado.nombre).toBe('Pendiente');

    const sinSaldo = await subirComprobante(pedidoParcialId);
    expect(sinSaldo.status).toBe(409);

    const preparacion = await auth(
      request(app)
        .patch(`/api/pedidos/${pedidoParcialId}/estado`)
        .send({ estado: 'en_preparacion' })
    );
    expect(preparacion.status).toBe(200);
    expect(preparacion.body.data.estado.nombre).toBe('En preparación');

    const yaNoPendiente = await subirComprobante(pedidoParcialId);
    expect(yaNoPendiente.status).toBe(409);
  });

  it('no permite aprobar un monto mayor al saldo', async () => {
    const res = await aprobar(comprobanteSobrepagoId, totalSobrepago + 1000);

    expect(res.status).toBe(422);
    const actual = await detalle(pedidoSobrepagoId);
    expect(actual.body.data.totalPagado).toBe(0);
    expect(actual.body.data.saldo).toBeCloseTo(totalSobrepago, 2);
  });
});
