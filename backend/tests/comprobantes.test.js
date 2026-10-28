// tests/comprobantes.test.js
// Pruebas de integración de los comprobantes de pago: cupo de activos, subida y
// borrado por el cliente dueño, aprobación con monto verificado, advertencia por
// sobrepago, rechazo con motivo y bloqueo del paso a preparación con saldo.
import request from 'supertest';
import app from '../src/app.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';
const COMPROBANTE = Buffer.from('89504e470d0a1a0a', 'hex');

describe('Módulo de comprobantes de pago', () => {
  let tokenAdmin;
  let tokenCliente;
  let clienteId;
  let otroClienteId;

  let producto;
  let presentacion;
  let municipio;
  let color;

  let pedidoId;
  let total;
  let comprobanteInicialId;
  let subidoAId;
  let subidoBId;
  let subidoCId;

  let pedidoSobrepagoId;
  let comprobanteSobrepagoId;
  let pedidoRechazoId;
  let comprobanteRechazoId;

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
    const res = await auth(request(app).post('/api/pedidos'))
      .field('fechaEntrega', '2026-12-24')
      .field('direccion', 'Calle 10 # 20-30')
      .field('barrio', 'Centro')
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
            mensajePersonalizado: 'OK',
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

    const pedido = await crearPedido(clienteId);
    pedidoId = pedido.id;
    total = pedido.total;
    comprobanteInicialId = pedido.comprobantes[0].id;

    const pedidoSobrepago = await crearPedido(clienteId);
    pedidoSobrepagoId = pedidoSobrepago.id;
    comprobanteSobrepagoId = pedidoSobrepago.comprobantes[0].id;

    const pedidoRechazo = await crearPedido(clienteId);
    pedidoRechazoId = pedidoRechazo.id;
    comprobanteRechazoId = pedidoRechazo.comprobantes[0].id;
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
      .post(`/api/pedidos/${pedidoId}/comprobantes`)
      .attach('comprobante', COMPROBANTE, {
        filename: 'comprobante.png',
        contentType: 'image/png',
      });
    expect(res.status).toBe(401);
  });

  it('el detalle expone comprobantes, total pagado, saldo y cupo', async () => {
    const res = await detalle(pedidoId);

    expect(res.status).toBe(200);
    expect(res.body.data.comprobantes).toHaveLength(1);
    expect(res.body.data.comprobantes[0]).toEqual(
      expect.objectContaining({
        id: comprobanteInicialId,
        monto: null,
        estado: expect.objectContaining({ nombre: 'Pendiente' }),
      })
    );
    expect(res.body.data.totalPagado).toBe(0);
    expect(res.body.data.saldo).toBe(total);
    expect(res.body.data.puedeSubirComprobante).toBe(true);
  });

  it('solo el cliente dueño puede subir comprobantes (404 para el admin)', async () => {
    const res = await subirComprobante(pedidoId, tokenAdmin);
    expect(res.status).toBe(404);
  });

  it('subir sin archivo devuelve 422', async () => {
    const res = await subirComprobante(pedidoId, tokenCliente, false);
    expect(res.status).toBe(422);
  });

  it('permite hasta 3 comprobantes activos y después responde 409', async () => {
    const primero = await subirComprobante(pedidoId);
    expect(primero.status).toBe(201);
    expect(primero.body.data.comprobantes).toHaveLength(2);
    subidoAId = primero.body.data.comprobantes.at(-1).id;

    const segundo = await subirComprobante(pedidoId);
    expect(segundo.status).toBe(201);
    expect(segundo.body.data.comprobantes).toHaveLength(3);
    expect(segundo.body.data.puedeSubirComprobante).toBe(false);
    subidoBId = segundo.body.data.comprobantes.at(-1).id;

    const tercero = await subirComprobante(pedidoId);
    expect(tercero.status).toBe(409);
  });

  it('el cliente elimina sus comprobantes Pendientes', async () => {
    const res = await auth(
      request(app).delete(`/api/comprobantes/${subidoAId}`),
      tokenCliente
    );

    expect(res.status).toBe(200);
    expect(res.body.data.comprobantes).toHaveLength(2);
    expect(res.body.data.comprobantes.map((c) => c.id)).not.toContain(subidoAId);
  });

  it('un cliente no puede aprobar ni rechazar comprobantes (403)', async () => {
    const aprobar = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteInicialId}/aprobar`)
        .send({ monto: 1 }),
      tokenCliente
    );
    expect(aprobar.status).toBe(403);

    const rechazar = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteInicialId}/rechazar`)
        .send({ motivo: 'Motivo inválido.', monto: 0 }),
      tokenCliente
    );
    expect(rechazar.status).toBe(403);
  });

  it('no permite aprobar un abono parcial', async () => {
    const parcial = Math.round((total / 4) * 100) / 100;
    const res = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteInicialId}/aprobar`)
        .send({ monto: parcial })
    );

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/saldo pendiente/i);

    const actual = await detalle(pedidoId);
    expect(actual.body.data.totalPagado).toBe(0);
    expect(actual.body.data.saldo).toBeCloseTo(total, 2);
  });

  it('rechazar con monto parcial reduce el saldo y conserva el motivo', async () => {
    const parcial = Math.round((total / 4) * 100) / 100;
    const res = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteInicialId}/rechazar`)
        .send({
          motivo: 'La transferencia no cubre el total del pedido.',
          monto: parcial,
        })
    );

    expect(res.status).toBe(200);
    expect(res.body.data.estado.nombre).toBe('Pendiente');
    expect(res.body.data.totalPagado).toBe(parcial);
    expect(res.body.data.saldo).toBeCloseTo(total - parcial, 2);

    const comprobante = res.body.data.comprobantes.find(
      (c) => c.id === comprobanteInicialId
    );
    expect(comprobante.estado.nombre).toBe('Rechazado');
    expect(comprobante.monto).toBe(parcial);
    expect(comprobante.motivoRechazo).toBe(
      'La transferencia no cubre el total del pedido.'
    );
  });

  it('no permite rechazar el monto que completa el saldo', async () => {
    const actual = await detalle(pedidoId);
    const restante = actual.body.data.saldo;

    const igual = await auth(
      request(app)
        .patch(`/api/comprobantes/${subidoBId}/rechazar`)
        .send({ motivo: 'No debe completarse con rechazo.', monto: restante })
    );
    expect(igual.status).toBe(422);
    expect(igual.body.message).toMatch(/usa aprobar/i);

    const mayor = await auth(
      request(app)
        .patch(`/api/comprobantes/${subidoBId}/rechazar`)
        .send({
          motivo: 'No debe superar el saldo.',
          monto: restante + 1000,
        })
    );
    expect(mayor.status).toBe(422);
  });

  it('con saldo pendiente no se puede pasar a En preparación (409)', async () => {
    const res = await auth(
      request(app)
        .patch(`/api/pedidos/${pedidoId}/estado`)
        .send({ estado: 'en_preparacion' })
    );
    expect(res.status).toBe(409);
  });

  it('al completar el pago el paso a En preparación sigue siendo manual', async () => {
    // Dejamos un comprobante pendiente adicional para comprobar que, con
    // saldo cero, todavía se puede rechazar con valor 0.
    const extra = await subirComprobante(pedidoId);
    expect(extra.status).toBe(201);
    subidoCId = extra.body.data.comprobantes.at(-1).id;

    const actual = await detalle(pedidoId);
    const restante = actual.body.data.saldo;

    const pago = await auth(
      request(app)
        .patch(`/api/comprobantes/${subidoBId}/aprobar`)
        .send({ monto: restante })
    );
    expect(pago.status).toBe(200);
    expect(pago.body.data.pedido.saldo).toBe(0);
    expect(pago.body.data.pedido.estado.nombre).toBe('Pendiente');

    const rechazo = await auth(
      request(app)
        .patch(`/api/comprobantes/${subidoCId}/rechazar`)
        .send({ motivo: 'Comprobante duplicado.', monto: 0 })
    );
    expect(rechazo.status).toBe(200);
    expect(rechazo.body.data.totalPagado).toBe(total);
    expect(rechazo.body.data.saldo).toBe(0);
    expect(
      rechazo.body.data.comprobantes.find((c) => c.id === subidoCId).estado.nombre
    ).toBe('Rechazado');

    const res = await auth(
      request(app)
        .patch(`/api/pedidos/${pedidoId}/estado`)
        .send({ estado: 'en_preparacion' })
    );
    expect(res.status).toBe(200);
    expect(res.body.data.estado.nombre).toBe('En preparación');
  });

  it('ya no permite subir comprobantes cuando el pedido dejó de estar Pendiente', async () => {
    const res = await subirComprobante(pedidoId);
    expect(res.status).toBe(409);
  });

  it('no permite aprobar un monto mayor al saldo', async () => {
    const pedido = await detalle(pedidoSobrepagoId);
    const res = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteSobrepagoId}/aprobar`)
        .send({ monto: pedido.body.data.saldo + 1000 })
    );

    expect(res.status).toBe(422);
    const actual = await detalle(pedidoSobrepagoId);
    expect(actual.body.data.totalPagado).toBe(0);
    expect(actual.body.data.saldo).toBeCloseTo(pedido.body.data.saldo, 2);
  });

  it('permite rechazar con valor 0 sin alterar el saldo', async () => {
    const res = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteSobrepagoId}/rechazar`)
        .send({ motivo: 'No se recibió dinero.', monto: 0 })
    );

    expect(res.status).toBe(200);
    expect(res.body.data.totalPagado).toBe(0);
    expect(res.body.data.saldo).toBeCloseTo(total, 2);
    const comprobante = res.body.data.comprobantes.find(
      (c) => c.id === comprobanteSobrepagoId
    );
    expect(comprobante.estado.nombre).toBe('Rechazado');
    expect(comprobante.monto).toBe(0);
  });

  it('rechaza sin motivo o sin monto (422) y luego guarda motivo y monto', async () => {
    const sinMotivo = await auth(
      request(app).patch(`/api/comprobantes/${comprobanteRechazoId}/rechazar`).send({})
    );
    expect(sinMotivo.status).toBe(422);

    const sinMonto = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteRechazoId}/rechazar`)
        .send({ motivo: 'El monto no coincide con la transferencia.' })
    );
    expect(sinMonto.status).toBe(422);

    const parcial = Math.round((total / 5) * 100) / 100;
    const res = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteRechazoId}/rechazar`)
        .send({
          motivo: 'El monto no coincide con la transferencia.',
          monto: parcial,
        })
    );

    expect(res.status).toBe(200);
    expect(res.body.data.estado.nombre).toBe('Pendiente');
    expect(res.body.data.totalPagado).toBe(parcial);
    expect(res.body.data.saldo).toBeCloseTo(total - parcial, 2);
    const comprobante = res.body.data.comprobantes.find(
      (c) => c.id === comprobanteRechazoId
    );
    expect(comprobante.estado.nombre).toBe('Rechazado');
    expect(comprobante.monto).toBe(parcial);
    expect(comprobante.motivoRechazo).toBe(
      'El monto no coincide con la transferencia.'
    );

    const propio = await auth(
      request(app).get(`/api/pedidos/mios/${pedidoRechazoId}`),
      tokenCliente
    );
    const comprobantePropio = propio.body.data.comprobantes.find(
      (c) => c.id === comprobanteRechazoId
    );
    expect(comprobantePropio.motivoRechazo).toBe(
      'El monto no coincide con la transferencia.'
    );
    expect(comprobantePropio.monto).toBe(parcial);
  });

  it('un comprobante Rechazado no cuenta para el cupo ni se puede volver a aprobar', async () => {
    const subida = await subirComprobante(pedidoRechazoId);
    expect(subida.status).toBe(201);
    expect(subida.body.data.puedeSubirComprobante).toBe(true);

    const reabrir = await auth(
      request(app)
        .patch(`/api/comprobantes/${comprobanteRechazoId}/aprobar`)
        .send({ monto: 1 })
    );
    expect(reabrir.status).toBe(409);
  });
});
