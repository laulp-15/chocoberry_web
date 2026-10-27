// tests/pedidos.test.js
// Pruebas de integración del módulo de pedidos: creación con comprobante,
// cálculo de precios en el servidor, regla del mensaje personalizado,
// transiciones de estado, alcance por rol y datos maestros públicos.
//
// Las pruebas crean usuarios y pedidos temporales y los eliminan al final.
// También borran los archivos subidos durante la corrida.
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';
import { uploadsDir } from '../src/middlewares/upload.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';
const COMPROBANTE = Buffer.from('89504e470d0a1a0a', 'hex');
const EVIDENCIA = Buffer.from('89504e470d0a1a0a', 'hex');

const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;

describe('Módulo de pedidos', () => {
  let tokenAdmin;
  let tokenCliente;
  let tokenOtroCliente;
  let tokenRepartidor;

  let clienteId;
  let otroClienteId;
  let repartidorId;

  let producto;
  let presentacion;
  let municipio;
  let municipios = [];
  let color;

  const pedidosCreados = [];
  const archivosPrevios = new Set(fs.readdirSync(uploadsDir));
  const s = Date.now().toString().slice(-7);

  const auth = (peticion, token = tokenAdmin) =>
    peticion.set('Authorization', `Bearer ${token}`);

  const lineaBase = () => ({
    idProducto: producto.id,
    idPresentacion: presentacion.id,
    cantidadProductos: 2,
    idColorGlaseado: color.id,
    mensajePersonalizado: 'TQM',
  });

  /** Fecha ISO local de hoy + N días, para no depender de fechas fijas. */
  const fechaISO = (dias) => {
    const fecha = new Date();
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() + dias);

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  const lineaCon = (cantidad, extra = {}) => ({
    ...lineaBase(),
    cantidadProductos: cantidad,
    ...extra,
  });

  /** Construye el POST multipart de un pedido. */
  function solicitudPedido({
    token = tokenCliente,
    datos = {},
    lineas = [lineaBase()],
    conComprobante = true,
  } = {}) {
    const campos = {
      mensajeTarjeta: '¡Feliz cumpleaños!',
      fechaEntrega: '2026-12-24',
      direccion: 'Calle 10 # 20-30',
      barrio: 'Centro',
      idMunicipio: municipio.id,
      nombreReceptor: 'Receptor Prueba',
      telefonoReceptor: '3001234567',
      instruccionesEntrega: 'Dejar en portería',
      ...datos,
    };

    let peticion = request(app)
      .post('/api/pedidos')
      .set('Authorization', `Bearer ${token}`);

    for (const [campo, valor] of Object.entries(campos)) {
      peticion = peticion.field(campo, String(valor));
    }
    peticion = peticion.field('lineas', JSON.stringify(lineas));

    if (conComprobante) {
      peticion = peticion.attach('comprobante', COMPROBANTE, {
        filename: 'comprobante.png',
        contentType: 'image/png',
      });
    }

    return peticion;
  }

  async function crearPedido(opciones) {
    const res = await solicitudPedido(opciones);
    expect(res.status).toBe(201);
    pedidosCreados.push(res.body.data.id);
    return res.body.data;
  }

  async function cambiarEstado(id, estado, token = tokenAdmin) {
    return auth(
      request(app).patch(`/api/pedidos/${id}/estado`).send({ estado }),
      token
    );
  }

  async function reprogramar(id, fechaEntrega, token = tokenAdmin) {
    return auth(
      request(app).patch(`/api/pedidos/${id}/reprogramar`).send({ fechaEntrega }),
      token
    );
  }

  async function crearPedidoCancelado() {
    const pedido = await crearPedido();
    await cambiarEstado(pedido.id, 'en_preparacion');
    await cambiarEstado(pedido.id, 'Despachado');
    const cancelado = await cambiarEstado(pedido.id, 'cancelado');
    expect(cancelado.status).toBe(200);
    return cancelado.body.data;
  }

  async function crearUsuario({ rol, sufijo, nombres = 'Prueba', apellidos = 'Pedidos' }) {
    const res = await auth(request(app).post('/api/usuarios')).send({
      nombres,
      apellidos,
      tipoDocumento: 'CC',
      numeroDocumento: `9${s}${sufijo}`,
      correo: `pedidos.${sufijo}.${s}@chocoberry.com`,
      contrasena: CLAVE_PRUEBA,
      id_rol: rol,
    });
    expect(res.status).toBe(201);
    return res.body.data.id;
  }

  async function iniciarSesion(correo) {
    const res = await request(app).post('/api/auth/login').send({ correo, contrasena: CLAVE_PRUEBA });
    expect(res.status).toBe(200);
    return res.body.data.token;
  }

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send(ADMIN);
    tokenAdmin = login.body?.data?.token;
    expect(tokenAdmin).toBeTruthy();

    clienteId = await crearUsuario({ rol: 3, sufijo: '01', nombres: 'Cliente', apellidos: 'Principal' });
    otroClienteId = await crearUsuario({ rol: 3, sufijo: '02', nombres: 'Otro', apellidos: 'Cliente' });
    repartidorId = await crearUsuario({ rol: 2, sufijo: '03', nombres: 'Repartidor', apellidos: 'Prueba' });

    tokenCliente = await iniciarSesion(`pedidos.01.${s}@chocoberry.com`);
    tokenOtroCliente = await iniciarSesion(`pedidos.02.${s}@chocoberry.com`);
    tokenRepartidor = await iniciarSesion(`pedidos.03.${s}@chocoberry.com`);

    // Datos reales del catálogo y de los maestros (rutas públicas).
    const productos = await request(app).get('/api/catalogo/productos');
    const presentaciones = await request(app).get('/api/catalogo/presentaciones');
    const respuestaMunicipios = await request(app).get('/api/catalogo/municipios');
    const colores = await request(app).get('/api/catalogo/glaseados');

    producto = productos.body.data[0];
    // La lista viene ordenada por cantidad de fresas ASC: la más pequeña.
    presentacion = presentaciones.body.data[0];
    municipios = respuestaMunicipios.body.data;
    municipio = municipios.find((m) => m.nombre === 'Medellín') ?? municipios[0];
    color = colores.body.data[0];

    expect(producto?.id).toBeGreaterThan(0);
    expect(presentacion?.id).toBeGreaterThan(0);
    expect(municipio?.id).toBeGreaterThan(0);
    expect(color?.id).toBeGreaterThan(0);
  });

  afterAll(async () => {
    // Pedidos primero (los usuarios no se pueden eliminar si tienen pedidos).
    for (const id of [...pedidosCreados].reverse()) {
      await auth(request(app).delete(`/api/pedidos/${id}`));
    }

    for (const id of [repartidorId, otroClienteId, clienteId]) {
      if (id) await auth(request(app).delete(`/api/usuarios/${id}`));
    }

    // Archivos subidos durante la corrida (comprobantes y evidencias).
    for (const archivo of fs.readdirSync(uploadsDir)) {
      if (!archivosPrevios.has(archivo)) {
        fs.rmSync(path.join(uploadsDir, archivo), { force: true });
      }
    }
  });

  describe('Datos maestros públicos', () => {
    it('GET /api/catalogo/municipios y /api/catalogo/glaseados responden sin sesión y solo con activos', async () => {
      const resMunicipios = await request(app).get('/api/catalogo/municipios');
      expect(resMunicipios.status).toBe(200);
      expect(Array.isArray(resMunicipios.body.data)).toBe(true);
      expect(resMunicipios.body.data.length).toBeGreaterThan(0);
      expect(resMunicipios.body.data.every((m) => m.estado === true)).toBe(true);
      expect(typeof resMunicipios.body.data[0].precioDomicilio).toBe('number');

      const resColores = await request(app).get('/api/catalogo/glaseados');
      expect(resColores.status).toBe(200);
      expect(Array.isArray(resColores.body.data)).toBe(true);
      expect(resColores.body.data.every((c) => c.estado === true)).toBe(true);
      expect(resColores.body.data[0].codigoHex).toMatch(/^#/);
    });
  });

  describe('Creación de pedidos', () => {
    it('POST /api/pedidos sin token devuelve 401', async () => {
      const res = await request(app).post('/api/pedidos').field('lineas', '[]');
      expect(res.status).toBe(401);
    });

    it('POST /api/pedidos sin comprobante devuelve 422', async () => {
      const res = await solicitudPedido({ conComprobante: false });
      expect(res.status).toBe(422);
    });

    it('crea el pedido, calcula precios en el servidor y lo deja Pendiente', async () => {
      const pedido = await crearPedido();
      const subtotalEsperado = redondear(presentacion.precio * 2);

      expect(pedido.estado.nombre).toBe('Pendiente');
      expect(pedido.cliente.id).toBe(clienteId);
      expect(pedido.municipio.id).toBe(municipio.id);
      expect(pedido.fechaEntrega).toBe('2026-12-24');
      expect(pedido.comprobantePago).toMatch(/^\/uploads\//);
      expect(pedido.lineas).toHaveLength(1);

      const linea = pedido.lineas[0];
      expect(linea.producto.id).toBe(producto.id);
      expect(linea.presentacion.id).toBe(presentacion.id);
      expect(linea.colorGlaseado.id).toBe(color.id);
      expect(linea.cantidadProductos).toBe(2);
      expect(linea.precioUnitario).toBe(presentacion.precio);
      expect(linea.subtotal).toBe(subtotalEsperado);

      expect(pedido.precioDomicilio).toBe(municipio.precioDomicilio);
      expect(pedido.subtotal).toBe(subtotalEsperado);
      expect(pedido.total).toBe(redondear(subtotalEsperado + municipio.precioDomicilio));
    });

    it('ignora los precios enviados por el cliente', async () => {
      const pedido = await crearPedido({
        lineas: [{ ...lineaBase(), precioUnitario: 1, subtotal: 1 }],
      });

      expect(pedido.lineas[0].precioUnitario).toBe(presentacion.precio);
      expect(pedido.total).toBe(
        redondear(presentacion.precio * 2 + municipio.precioDomicilio)
      );
    });

    it('rechaza un mensaje personalizado más largo que las fresas de la presentación', async () => {
      const res = await solicitudPedido({
        lineas: [
          {
            ...lineaBase(),
            mensajePersonalizado: 'A'.repeat(presentacion.cantidadFresas + 1),
          },
        ],
      });

      expect(res.status).toBe(422);
      expect(res.body.errors?.[0]?.campo).toBe('lineas.0.mensajePersonalizado');
    });

    it('acepta un mensaje del tamaño exacto de la presentación', async () => {
      const mensaje = 'A'.repeat(presentacion.cantidadFresas);
      const pedido = await crearPedido({
        lineas: [{ ...lineaBase(), mensajePersonalizado: mensaje }],
      });

      expect(pedido.lineas[0].mensajePersonalizado).toBe(mensaje);
    });

    it('POST con municipio inexistente devuelve 400', async () => {
      const res = await solicitudPedido({ datos: { idMunicipio: 999999 } });
      expect(res.status).toBe(400);
    });

    it('POST con producto inexistente devuelve 400', async () => {
      const res = await solicitudPedido({
        lineas: [{ ...lineaBase(), idProducto: 999999 }],
      });
      expect(res.status).toBe(400);
    });

    it('POST con glaseado inexistente devuelve 400', async () => {
      const res = await solicitudPedido({
        lineas: [{ ...lineaBase(), idColorGlaseado: 999999 }],
      });
      expect(res.status).toBe(400);
    });

    it('POST sin líneas devuelve 422', async () => {
      const res = await solicitudPedido({ lineas: [] });
      expect(res.status).toBe(422);
    });

    it('no permite eliminar el municipio ni el glaseado usados por un pedido', async () => {
      const resMunicipio = await auth(request(app).delete(`/api/municipios/${municipio.id}`));
      expect(resMunicipio.status).toBe(409);

      const resGlaseado = await auth(request(app).delete(`/api/glaseados/${color.id}`));
      expect(resGlaseado.status).toBe(409);
    });
  });

  describe('Reglas de volumen y fecha', () => {
    it('el cliente no puede superar 20 unidades en total', async () => {
      const res = await solicitudPedido({
        datos: { fechaEntrega: fechaISO(2) },
        lineas: [lineaCon(11), lineaCon(10)],
      });

      expect(res.status).toBe(422);
      expect(res.body.message).toContain('317 217 5887');
      expect(res.body.errors?.[0]?.campo).toBe('lineas');
    });

    it('acepta exactamente 20 unidades con entrega desde pasado mañana', async () => {
      const pedido = await crearPedido({
        datos: { fechaEntrega: fechaISO(2) },
        lineas: [lineaCon(10), lineaCon(10)],
      });

      const total = pedido.lineas.reduce(
        (suma, linea) => suma + linea.cantidadProductos,
        0
      );
      expect(total).toBe(20);
    });

    it('rechaza la entrega para mañana cuando el pedido supera 10 unidades', async () => {
      const res = await solicitudPedido({
        datos: { fechaEntrega: fechaISO(1) },
        lineas: [lineaCon(11)],
      });

      expect(res.status).toBe(422);
      expect(res.body.errors?.[0]?.campo).toBe('fechaEntrega');
    });

    it('acepta la entrega desde pasado mañana cuando el pedido supera 10 unidades', async () => {
      const pedido = await crearPedido({
        datos: { fechaEntrega: fechaISO(2) },
        lineas: [lineaCon(11)],
      });

      expect(pedido.fechaEntrega).toBe(fechaISO(2));
    });

    it('permite la entrega para mañana con 10 unidades o menos', async () => {
      const pedido = await crearPedido({
        datos: { fechaEntrega: fechaISO(1) },
        lineas: [lineaCon(10)],
      });

      expect(pedido.fechaEntrega).toBe(fechaISO(1));
    });

    it('el administrador puede crear pedidos de más de 20 unidades', async () => {
      const pedido = await crearPedido({
        token: tokenAdmin,
        datos: { idUsuario: clienteId, fechaEntrega: fechaISO(2) },
        lineas: [lineaCon(25)],
      });

      expect(pedido.lineas[0].cantidadProductos).toBe(25);
    });

    it('el administrador también respeta la fecha de los pedidos grandes', async () => {
      const res = await solicitudPedido({
        token: tokenAdmin,
        datos: { idUsuario: clienteId, fechaEntrega: fechaISO(1) },
        lineas: [lineaCon(11)],
      });

      expect(res.status).toBe(422);
      expect(res.body.errors?.[0]?.campo).toBe('fechaEntrega');
    });
  });

  describe('Consulta y alcance por rol', () => {
    let pedidoPrincipalId;

    beforeAll(async () => {
      const pedido = await crearPedido();
      pedidoPrincipalId = pedido.id;
    });

    it('GET /api/pedidos/mios devuelve solo los pedidos del cliente', async () => {
      const res = await auth(request(app).get('/api/pedidos/mios'), tokenCliente);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((p) => p.cliente.id === clienteId)).toBe(true);
      expect(res.body.data.map((p) => p.id)).toContain(pedidoPrincipalId);
    });

    it('GET /api/pedidos (cliente) también queda limitado a los propios', async () => {
      const res = await auth(request(app).get('/api/pedidos'), tokenCliente);

      expect(res.status).toBe(200);
      expect(res.body.data.every((p) => p.cliente.id === clienteId)).toBe(true);
    });

    it('un cliente no puede ver el pedido de otro (404)', async () => {
      const res = await auth(
        request(app).get(`/api/pedidos/${pedidoPrincipalId}`),
        tokenOtroCliente
      );
      expect(res.status).toBe(404);
    });

    it('el administrador ve todos los pedidos', async () => {
      const res = await auth(request(app).get('/api/pedidos'));

      expect(res.status).toBe(200);
      expect(res.body.data.map((p) => p.id)).toContain(pedidoPrincipalId);
    });

    it('ordena por fecha de creación y no por fecha de entrega', async () => {
      // El primero se crea antes pero tiene una entrega mucho más lejana.
      const entregaLejana = await crearPedido({
        datos: { fechaEntrega: '2099-12-31' },
      });
      const entregaCercana = await crearPedido({
        datos: { fechaEntrega: '2000-01-01' },
      });

      const res = await auth(request(app).get('/api/pedidos'));
      const ids = res.body.data.map((p) => p.id);

      expect(entregaCercana.fechaEntrega).toBe('2000-01-01');
      expect(ids.indexOf(entregaCercana.id)).toBeGreaterThanOrEqual(0);
      expect(ids.indexOf(entregaCercana.id)).toBeLessThan(
        ids.indexOf(entregaLejana.id)
      );
    });

    it('filtra por estado usando el slug del front', async () => {
      const res = await auth(request(app).get('/api/pedidos').query({ estado: 'pendiente' }));

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((p) => p.estado.nombre === 'Pendiente')).toBe(true);
      expect(res.body.data.map((p) => p.id)).toContain(pedidoPrincipalId);
    });

    it('PATCH /estado con una transición inválida devuelve 409', async () => {
      const res = await cambiarEstado(pedidoPrincipalId, 'entregado');
      expect(res.status).toBe(409);
    });

    it('Pendiente → En preparación → Despachado', async () => {
      const primero = await cambiarEstado(pedidoPrincipalId, 'en_preparacion');
      expect(primero.status).toBe(200);
      expect(primero.body.data.estado.nombre).toBe('En preparación');

      const segundo = await cambiarEstado(pedidoPrincipalId, 'Despachado');
      expect(segundo.status).toBe(200);
      expect(segundo.body.data.estado.nombre).toBe('Despachado');
    });

    it('el repartidor registra la evidencia sin cambiar el estado', async () => {
      const res = await auth(
        request(app)
          .patch(`/api/pedidos/${pedidoPrincipalId}/entrega`)
          .field('observacionesEntrega', 'Entregado al portero')
          .attach('evidencia', EVIDENCIA, {
            filename: 'evidencia.png',
            contentType: 'image/png',
          }),
        tokenRepartidor
      );

      expect(res.status).toBe(200);
      expect(res.body.data.estado.nombre).toBe('Despachado');
      expect(res.body.data.evidenciaEntrega).toMatch(/^\/uploads\//);
      expect(res.body.data.observacionesEntrega).toBe('Entregado al portero');
    });

    it('el repartidor no puede cambiar el estado (403)', async () => {
      const res = await cambiarEstado(pedidoPrincipalId, 'entregado', tokenRepartidor);
      expect(res.status).toBe(403);
    });

    it('el repartidor no puede editar el pedido (403)', async () => {
      const res = await auth(
        request(app)
          .put(`/api/pedidos/${pedidoPrincipalId}`)
          .send({ direccion: 'Otra dirección 123' }),
        tokenRepartidor
      );
      expect(res.status).toBe(403);
    });

    it('el repartidor puede consultar el listado', async () => {
      const res = await auth(request(app).get('/api/pedidos'), tokenRepartidor);
      expect(res.status).toBe(200);
    });
  });

  describe('Estados finales y evidencia', () => {
    let cancelableId;

    it('el administrador no puede registrar evidencia (403)', async () => {
      const pedido = await crearPedido();
      await cambiarEstado(pedido.id, 'en_preparacion');
      await cambiarEstado(pedido.id, 'Despachado');

      const res = await auth(
        request(app)
          .patch(`/api/pedidos/${pedido.id}/entrega`)
          .attach('evidencia', EVIDENCIA, {
            filename: 'evidencia.png',
            contentType: 'image/png',
          })
      );
      expect(res.status).toBe(403);
    });

    it('PATCH /entrega sin foto y sin evidencia previa devuelve 422', async () => {
      const pedido = await crearPedido();
      await cambiarEstado(pedido.id, 'en_preparacion');
      await cambiarEstado(pedido.id, 'Despachado');

      const res = await auth(
        request(app)
          .patch(`/api/pedidos/${pedido.id}/entrega`)
          .send({ observacionesEntrega: 'Sin foto' }),
        tokenRepartidor
      );
      expect(res.status).toBe(422);

      // Se reutiliza para la prueba de cancelación.
      cancelableId = pedido.id;
    });

    it('Despachado → Cancelado, y después ya no admite cambios', async () => {
      const res = await cambiarEstado(cancelableId, 'cancelado');
      expect(res.status).toBe(200);
      expect(res.body.data.estado.nombre).toBe('Cancelado');

      const otra = await cambiarEstado(cancelableId, 'entregado');
      expect(otra.status).toBe(409);
    });

    it('Despachado → Entregado', async () => {
      const pedidos = await auth(request(app).get('/api/pedidos').query({ estado: 'despachado' }));
      const despachado = pedidos.body.data[0];
      expect(despachado).toBeTruthy();

      const res = await cambiarEstado(despachado.id, 'entregado');
      expect(res.status).toBe(200);
      expect(res.body.data.estado.nombre).toBe('Entregado');
    });

    it('un estado final no permite más transiciones', async () => {
      const pedidos = await auth(request(app).get('/api/pedidos').query({ estado: 'entregado' }));
      const entregado = pedidos.body.data[0];
      expect(entregado).toBeTruthy();

      const res = await cambiarEstado(entregado.id, 'cancelado');
      expect(res.status).toBe(409);
    });
  });

  describe('Reprogramación de entrega', () => {
    it('guarda fechaCancelacion y reprograma para mañana pasando a Despachado', async () => {
      const cancelado = await crearPedidoCancelado();
      expect(cancelado.fechaCancelacion).toBeTruthy();

      const res = await reprogramar(cancelado.id, fechaISO(1));
      expect(res.status).toBe(200);
      expect(res.body.data.estado.nombre).toBe('Despachado');
      expect(res.body.data.fechaEntrega).toBe(fechaISO(1));

      const despachados = await auth(
        request(app).get('/api/pedidos').query({ estado: 'despachado' })
      );
      expect(despachados.body.data.map((p) => p.id)).toContain(cancelado.id);
    });

    it('permite reprogramar para pasado mañana', async () => {
      const cancelado = await crearPedidoCancelado();

      const res = await reprogramar(cancelado.id, fechaISO(2));
      expect(res.status).toBe(200);
      expect(res.body.data.estado.nombre).toBe('Despachado');
      expect(res.body.data.fechaEntrega).toBe(fechaISO(2));
    });

    it('rechaza una fecha que no sea mañana o pasado mañana', async () => {
      const cancelado = await crearPedidoCancelado();

      for (const dias of [0, 3]) {
        const res = await reprogramar(cancelado.id, fechaISO(dias));
        expect(res.status).toBe(422);
        expect(res.body.errors?.[0]?.campo).toBe('fechaEntrega');
      }
    });

    it('rechaza reprogramar un pedido que no está Cancelado', async () => {
      const pedido = await crearPedido();

      const res = await reprogramar(pedido.id, fechaISO(1));
      expect(res.status).toBe(409);
    });

    it('rechaza reprogramar después de las 48 horas desde la cancelación', async () => {
      const cancelado = await crearPedidoCancelado();
      await query(
        'UPDATE pedido SET fecha_cancelacion = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE id = ?',
        [cancelado.id]
      );

      const res = await reprogramar(cancelado.id, fechaISO(1));
      expect(res.status).toBe(409);
    });

    it('rechaza reprogramar un cancelado sin fecha de cancelación', async () => {
      const cancelado = await crearPedidoCancelado();
      await query('UPDATE pedido SET fecha_cancelacion = NULL WHERE id = ?', [
        cancelado.id,
      ]);

      const res = await reprogramar(cancelado.id, fechaISO(1));
      expect(res.status).toBe(409);
    });

    it('solo lo permite un rol con Pedidos · Cambiar estado', async () => {
      const cancelado = await crearPedidoCancelado();

      const repartidor = await reprogramar(
        cancelado.id,
        fechaISO(1),
        tokenRepartidor
      );
      expect(repartidor.status).toBe(403);

      const cliente = await reprogramar(cancelado.id, fechaISO(1), tokenCliente);
      expect(cliente.status).toBe(403);
    });
  });

  describe('Rechazo', () => {
    let pedidoId;

    beforeAll(async () => {
      const pedido = await crearPedido();
      pedidoId = pedido.id;
    });

    it('rechazar sin motivo devuelve 422', async () => {
      const res = await auth(request(app).patch(`/api/pedidos/${pedidoId}/rechazar`)).send({});
      expect(res.status).toBe(422);
    });

    it('rechaza con motivo y bloquea cambios posteriores', async () => {
      const res = await auth(request(app).patch(`/api/pedidos/${pedidoId}/rechazar`)).send({
        motivo: 'Comprobante de pago inválido.',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.estado.nombre).toBe('Rechazado');
      expect(res.body.data.motivoRechazo).toBe('Comprobante de pago inválido.');

      const otra = await cambiarEstado(pedidoId, 'en_preparacion');
      expect(otra.status).toBe(409);
    });

    it('no se puede rechazar un pedido que no está Pendiente', async () => {
      const pedidos = await auth(request(app).get('/api/pedidos').query({ estado: 'entregado' }));
      const entregado = pedidos.body.data[0];

      const res = await auth(
        request(app).patch(`/api/pedidos/${entregado.id}/rechazar`).send({
          motivo: 'Motivo con longitud válida.',
        })
      );
      expect(res.status).toBe(409);
    });
  });

  describe('Edición y eliminación', () => {
    it('PUT actualiza la cabecera y conserva las líneas y el domicilio recalculado', async () => {
      const pedido = await crearPedido();
      const otroMunicipio = municipios.find((m) => m.id !== municipio.id);
      const idsLineasOriginales = pedido.lineas.map((linea) => linea.id);

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        direccion: 'Carrera 50 # 10-20',
        idMunicipio: otroMunicipio.id,
        mensajeTarjeta: 'Nuevo mensaje',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.direccion).toBe('Carrera 50 # 10-20');
      expect(res.body.data.mensajeTarjeta).toBe('Nuevo mensaje');
      expect(res.body.data.municipio.id).toBe(otroMunicipio.id);
      expect(res.body.data.precioDomicilio).toBe(otroMunicipio.precioDomicilio);
      expect(res.body.data.lineas).toHaveLength(pedido.lineas.length);
      expect(res.body.data.lineas.map((linea) => linea.id)).toEqual(idsLineasOriginales);
      expect(res.body.data.total).toBe(
        redondear(res.body.data.subtotal + otroMunicipio.precioDomicilio)
      );
    });

    it('PUT reemplaza las líneas de un pedido pendiente y recalcula los totales', async () => {
      const pedido = await crearPedido();
      const lineaOriginal = pedido.lineas[0];

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        lineas: [
          {
            id: lineaOriginal.id,
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 3,
            idColorGlaseado: color.id,
            mensajePersonalizado: 'TQM',
          },
          {
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 1,
            idColorGlaseado: color.id,
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body.data.lineas).toHaveLength(2);
      expect(res.body.data.lineas[0].cantidadProductos).toBe(3);
      expect(res.body.data.lineas[1].cantidadProductos).toBe(1);

      const subtotalEsperado = redondear(presentacion.precio * 4);
      expect(res.body.data.subtotal).toBe(subtotalEsperado);
      expect(res.body.data.total).toBe(
        redondear(subtotalEsperado + res.body.data.precioDomicilio)
      );
    });

    it('PUT conserva el precio histórico de una línea sin cambios de producto, presentación ni glaseado', async () => {
      const pedido = await crearPedido();
      const linea = pedido.lineas[0];
      const precioHistorico = 12345.67;
      const nuevaCantidad = linea.cantidadProductos + 1;

      // Simula un pedido viejo cuyo precio unitario ya no coincide con el
      // catálogo actual. Solo se modifica esta línea temporal de prueba.
      await query(
        'UPDATE productoPedido SET precio_unitario = ?, subtotal = ? WHERE id = ?',
        [precioHistorico, redondear(precioHistorico * linea.cantidadProductos), linea.id]
      );

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        lineas: [
          {
            id: linea.id,
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: nuevaCantidad,
            idColorGlaseado: color.id,
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body.data.lineas[0].precioUnitario).toBe(precioHistorico);
      expect(res.body.data.lineas[0].subtotal).toBe(
        redondear(precioHistorico * nuevaCantidad)
      );
    });

    it('PUT rechaza editar un pedido que ya no está Pendiente', async () => {
      const pedido = await crearPedido();
      await cambiarEstado(pedido.id, 'en_preparacion');

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        direccion: 'No debería guardarse 123',
        lineas: [
          {
            id: pedido.lineas[0].id,
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 5,
            idColorGlaseado: color.id,
          },
        ],
      });

      expect(res.status).toBe(409);
    });

    it('PUT con una línea inválida no modifica ni la cabecera ni las líneas', async () => {
      const pedido = await crearPedido();
      const direccionOriginal = pedido.direccion;

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        direccion: 'Dirección que no debe guardarse',
        lineas: [
          {
            id: pedido.lineas[0].id,
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 2,
            idColorGlaseado: color.id,
          },
          {
            idProducto: 999999,
            idPresentacion: presentacion.id,
            cantidadProductos: 1,
            idColorGlaseado: color.id,
          },
        ],
      });

      expect(res.status).toBe(400);

      const detalle = await auth(request(app).get(`/api/pedidos/${pedido.id}`));
      expect(detalle.status).toBe(200);
      expect(detalle.body.data.direccion).toBe(direccionOriginal);
      expect(detalle.body.data.lineas).toHaveLength(pedido.lineas.length);
    });

    it('PUT rechaza una línea que pertenece a otro pedido', async () => {
      const pedido = await crearPedido();
      const otroPedido = await crearPedido();

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        lineas: [
          {
            id: otroPedido.lineas[0].id,
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 1,
            idColorGlaseado: color.id,
          },
        ],
      });

      expect(res.status).toBe(400);
    });

    it('al editar, un pedido grande no puede quedar con entrega para mañana', async () => {
      const pedido = await crearPedido();
      const linea = pedido.lineas[0];

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        fechaEntrega: fechaISO(1),
        lineas: [
          {
            id: linea.id,
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 11,
            idColorGlaseado: color.id,
          },
        ],
      });

      expect(res.status).toBe(422);
      expect(res.body.errors?.[0]?.campo).toBe('fechaEntrega');
    });

    it('el administrador puede editar un pedido para superar 20 unidades', async () => {
      const pedido = await crearPedido();
      const linea = pedido.lineas[0];

      const res = await auth(request(app).put(`/api/pedidos/${pedido.id}`)).send({
        lineas: [
          {
            id: linea.id,
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: 25,
            idColorGlaseado: color.id,
          },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body.data.lineas[0].cantidadProductos).toBe(25);
    });

    it('el administrador puede crear un pedido a nombre de un cliente', async () => {
      const pedido = await crearPedido({
        token: tokenAdmin,
        datos: { idUsuario: otroClienteId },
      });

      expect(pedido.cliente.id).toBe(otroClienteId);
    });

    it('un cliente no puede eliminar un pedido (403)', async () => {
      const res = await auth(
        request(app).delete(`/api/pedidos/${pedidosCreados[0]}`),
        tokenCliente
      );
      expect(res.status).toBe(403);
    });

    it('el administrador elimina el pedido y sus líneas', async () => {
      const pedido = await crearPedido();

      const res = await auth(request(app).delete(`/api/pedidos/${pedido.id}`));
      expect(res.status).toBe(200);

      const detalle = await auth(request(app).get(`/api/pedidos/${pedido.id}`));
      expect(detalle.status).toBe(404);

      const lineas = await query(
        'SELECT COUNT(*) AS total FROM productoPedido WHERE id_pedido = ?',
        [pedido.id]
      );
      expect(Number(lineas[0].total)).toBe(0);

      // Ya fue eliminado: no debe reintentarse en el afterAll.
      pedidosCreados.splice(pedidosCreados.indexOf(pedido.id), 1);
    });
  });
});
