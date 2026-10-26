// tests/dashboard.test.js
// Pruebas de integración del Dashboard. Cubren permisos, reglas de ingresos
// (incluido Cancelado), gráficas semanales/mensuales, navegación de períodos y
// reseñas activas/inactivas.
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import app from '../src/app.js';
import { query } from '../src/config/db.js';
import { uploadsDir } from '../src/middlewares/upload.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';
const COMPROBANTE = Buffer.from('89504e470d0a1a0a', 'hex');

// Semana de prueba aislada (1 al 7 de marzo de 1999) para no depender de los
// pedidos reales del seed ni de otros archivos de pruebas.
const SEMANA = {
  referencia: '1999-03-03',
  desde: '1999-03-01',
  hasta: '1999-03-07',
  anterior: '1999-02-22',
  siguiente: '1999-03-08',
};
const MES = {
  referencia: '1999-03',
  desde: '1998-04',
  hasta: '1999-03',
};

/** Fecha ISO local de hoy + N días, para que la entrega sea válida. */
function fechaISO(dias) {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

describe('Módulo de dashboard', () => {
  let tokenAdmin;
  let tokenCliente;
  let tokenRepartidor;

  let clienteId;
  let repartidorId;

  let producto;
  let presentacion;
  let municipio;
  let color;

  const pedidosCreados = [];
  const resenasCreadas = [];
  const archivosCreados = new Set();
  const s = Date.now().toString().slice(-7);

  const auth = (peticion, token = tokenAdmin) =>
    peticion.set('Authorization', `Bearer ${token}`);

  const consultar = (filtros = {}) =>
    auth(request(app).get('/api/dashboard/resumen').query(filtros));

  async function crearUsuario({ rol, sufijo, nombres, apellidos }) {
    const res = await auth(request(app).post('/api/usuarios')).send({
      nombres,
      apellidos,
      tipoDocumento: 'CC',
      numeroDocumento: `8${s}${sufijo}`,
      correo: `dashboard.${sufijo}.${s}@chocoberry.com`,
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

  async function crearPedido({ cantidad = 1 } = {}) {
    const res = await auth(request(app).post('/api/pedidos'))
      .field('mensajeTarjeta', 'Dashboard de prueba')
      .field('fechaEntrega', fechaISO(2))
      .field('direccion', 'Calle 10 # 20-30')
      .field('barrio', 'Centro')
      .field('idMunicipio', String(municipio.id))
      .field('nombreReceptor', 'Receptor Dashboard')
      .field('telefonoReceptor', '3001234567')
      .field('idUsuario', String(clienteId))
      .field(
        'lineas',
        JSON.stringify([
          {
            idProducto: producto.id,
            idPresentacion: presentacion.id,
            cantidadProductos: cantidad,
            idColorGlaseado: color.id,
          },
        ])
      )
      .attach('comprobante', COMPROBANTE, {
        filename: 'comprobante-dashboard.png',
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

  async function rechazarPedido(id) {
    const res = await auth(request(app).patch(`/api/pedidos/${id}/rechazar`)).send({
      motivo: 'Pago no confirmado en la prueba.',
    });
    expect(res.status).toBe(200);
    return res.body.data;
  }

  async function fijarFecha(id, fecha) {
    await query('UPDATE pedido SET fecha = ? WHERE id = ?', [fecha, id]);
  }

  async function crearResena({ token, calificacion, comentario }) {
    const res = await auth(request(app).post('/api/resenas'), token).send({
      calificacion,
      comentario,
    });
    expect(res.status).toBe(201);
    resenasCreadas.push(res.body.data.id);
    return res.body.data;
  }

  let totales = {
    pendiente: 0,
    cancelado: 0,
    entregado: 0,
    rechazado: 0,
    preparacion: 0,
    despachado: 0,
  };

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send(ADMIN);
    tokenAdmin = login.body?.data?.token;
    expect(tokenAdmin).toBeTruthy();

    clienteId = await crearUsuario({
      rol: 3,
      sufijo: '01',
      nombres: 'Cliente',
      apellidos: 'Dashboard',
    });
    repartidorId = await crearUsuario({
      rol: 2,
      sufijo: '02',
      nombres: 'Repartidor',
      apellidos: 'Dashboard',
    });

    tokenCliente = await iniciarSesion(`dashboard.01.${s}@chocoberry.com`);
    tokenRepartidor = await iniciarSesion(`dashboard.02.${s}@chocoberry.com`);

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

    // Pendiente: no es venta.
    const pendiente = await crearPedido({ cantidad: 1 });
    totales.pendiente = pendiente.total;
    await fijarFecha(pendiente.id, '1999-03-01 10:00:00');

    // Cancelado: sí es venta y además deja una cantidad alta para comprobar
    // que el ranking de productos incluye unidades de pedidos cancelados.
    const cancelado = await crearPedido({ cantidad: 100 });
    totales.cancelado = cancelado.total;
    await cambiarEstado(cancelado.id, 'en_preparacion');
    await cambiarEstado(cancelado.id, 'despachado');
    await cambiarEstado(cancelado.id, 'cancelado');
    await fijarFecha(cancelado.id, '1999-03-02 10:00:00');

    // Entregado: sí es venta.
    const entregado = await crearPedido({ cantidad: 2 });
    totales.entregado = entregado.total;
    await cambiarEstado(entregado.id, 'en_preparacion');
    await cambiarEstado(entregado.id, 'despachado');
    await cambiarEstado(entregado.id, 'entregado');
    await fijarFecha(entregado.id, '1999-03-03 10:00:00');

    // Rechazado: no es venta.
    const rechazado = await crearPedido({ cantidad: 1 });
    totales.rechazado = rechazado.total;
    await rechazarPedido(rechazado.id);
    await fijarFecha(rechazado.id, '1999-03-04 10:00:00');

    // En preparación y Despachado: sí son ventas.
    const preparacion = await crearPedido({ cantidad: 3 });
    totales.preparacion = preparacion.total;
    await cambiarEstado(preparacion.id, 'en_preparacion');
    await fijarFecha(preparacion.id, '1999-03-05 10:00:00');

    const despachado = await crearPedido({ cantidad: 4 });
    totales.despachado = despachado.total;
    await cambiarEstado(despachado.id, 'en_preparacion');
    await cambiarEstado(despachado.id, 'despachado');
    await fijarFecha(despachado.id, '1999-03-06 10:00:00');

    // Una reseña activa y una inactiva. El dashboard debe contar ambas.
    await crearResena({
      token: tokenCliente,
      calificacion: 5,
      comentario: `Reseña activa del dashboard ${s}.`,
    });
    const inactiva = await crearResena({
      token: tokenCliente,
      calificacion: 1,
      comentario: `Reseña inactiva del dashboard ${s}.`,
    });
    const desactivar = await auth(
      request(app).patch(`/api/resenas/${inactiva.id}/estado`)
    ).send({ estado: false });
    expect(desactivar.status).toBe(200);
    expect(desactivar.body.data.estado).toBe(false);
  });

  afterAll(async () => {
    for (const id of [...pedidosCreados].reverse()) {
      await auth(request(app).delete(`/api/pedidos/${id}`));
    }

    if (resenasCreadas.length) {
      const marcadores = resenasCreadas.map(() => '?').join(', ');
      await query(`DELETE FROM resena WHERE id IN (${marcadores})`, resenasCreadas);
    }

    for (const id of [repartidorId, clienteId]) {
      if (id) await auth(request(app).delete(`/api/usuarios/${id}`));
    }

    for (const archivo of archivosCreados) {
      fs.rmSync(archivo, { force: true });
    }
  });

  it('GET /api/dashboard/resumen sin token devuelve 401', async () => {
    const res = await request(app).get('/api/dashboard/resumen');
    expect(res.status).toBe(401);
  });

  it('solo un administrador puede consultar el dashboard', async () => {
    const admin = await consultar();
    expect(admin.status).toBe(200);

    const cliente = await auth(request(app).get('/api/dashboard/resumen'), tokenCliente);
    expect(cliente.status).toBe(403);

    const repartidor = await auth(
      request(app).get('/api/dashboard/resumen'),
      tokenRepartidor
    );
    expect(repartidor.status).toBe(403);
  });

  it('rechaza una semana o un mes inválidos (422)', async () => {
    const semana = await consultar({ semana: '1999-02-30' });
    expect(semana.status).toBe(422);

    const mes = await consultar({ mes: '1999-13' });
    expect(mes.status).toBe(422);
  });

  it('devuelve la estructura completa y los KPIs coherentes', async () => {
    const res = await consultar();
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.ventasSemana.data).toHaveLength(7);
    expect(data.ventasMes.data).toHaveLength(12);
    expect(data.ventasSemana.siguiente).toBeNull();
    expect(data.ventasMes.siguiente).toBeNull();

    const pendientes = data.pedidosPorEstado.find((fila) => fila.estado === 'Pendiente');
    const entregados = data.pedidosPorEstado.find((fila) => fila.estado === 'Entregado');
    expect(data.kpis.pedidosPendientes).toBe(pendientes?.pedidos ?? 0);
    expect(data.kpis.pedidosEntregados).toBe(entregados?.pedidos ?? 0);

    expect(data.kpis.ingresosMes).toBeGreaterThanOrEqual(0);
    expect(data.kpis.ingresosMesAnterior).toBeGreaterThanOrEqual(0);
    expect(
      data.kpis.variacionPorcentual === null ||
        Number.isFinite(data.kpis.variacionPorcentual)
    ).toBe(true);

    expect(data.topProductos.length).toBeGreaterThan(0);
    expect(data.kpis.productoMasVendido).toBe(data.topProductos[0].nombre);

    const unidades = data.topProductos.map((p) => p.unidades);
    expect(unidades).toEqual([...unidades].sort((a, b) => b - a));

    const sumaCalificaciones = data.calificaciones.distribucion.reduce(
      (total, fila) => total + fila.cantidad,
      0
    );
    expect(sumaCalificaciones).toBe(data.calificaciones.total);
    expect(data.calificaciones.promedio).toBeGreaterThanOrEqual(0);
    expect(data.calificaciones.promedio).toBeLessThanOrEqual(5);

    expect(data.disponibilidad.primerPedido).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.disponibilidad.ultimoPedido).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('la semana actual empieza en lunes y deja los días futuros en cero', async () => {
    const res = await consultar();
    const data = res.body.data;

    const [anio, mes, dia] = data.ventasSemana.desde.split('-').map(Number);
    expect(new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()).toBe(1);

    const hoy = new Date();
    const hoyTexto = [
      hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, '0'),
      String(hoy.getDate()).padStart(2, '0'),
    ].join('-');

    for (const fila of data.ventasSemana.data) {
      if (fila.fecha > hoyTexto) {
        expect(fila.total).toBe(0);
        expect(fila.pedidos).toBe(0);
      }
    }
  });

  it('la gráfica semanal incluye Cancelado y excluye Pendiente/Rechazado', async () => {
    const res = await consultar({ semana: SEMANA.referencia });
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.ventasSemana.desde).toBe(SEMANA.desde);
    expect(data.ventasSemana.hasta).toBe(SEMANA.hasta);
    expect(data.ventasSemana.anterior).toBe(SEMANA.anterior);
    expect(data.ventasSemana.siguiente).toBe(SEMANA.siguiente);
    expect(data.ventasSemana.data.map((fila) => fila.fecha)).toEqual([
      '1999-03-01',
      '1999-03-02',
      '1999-03-03',
      '1999-03-04',
      '1999-03-05',
      '1999-03-06',
      '1999-03-07',
    ]);

    const porFecha = new Map(data.ventasSemana.data.map((fila) => [fila.fecha, fila]));
    expect(porFecha.get('1999-03-01').total).toBe(0); // Pendiente
    expect(porFecha.get('1999-03-02').total).toBeCloseTo(totales.cancelado, 2);
    expect(porFecha.get('1999-03-03').total).toBeCloseTo(totales.entregado, 2);
    expect(porFecha.get('1999-03-04').total).toBe(0); // Rechazado
    expect(porFecha.get('1999-03-05').total).toBeCloseTo(totales.preparacion, 2);
    expect(porFecha.get('1999-03-06').total).toBeCloseTo(totales.despachado, 2);
    expect(porFecha.get('1999-03-07').total).toBe(0);

    const totalEsperado =
      totales.cancelado + totales.entregado + totales.preparacion + totales.despachado;
    const totalSemana = data.ventasSemana.data.reduce((total, fila) => total + fila.total, 0);
    expect(totalSemana).toBeCloseTo(totalEsperado, 2);
    expect(data.ventasSemana.data.reduce((total, fila) => total + fila.pedidos, 0)).toBe(4);
  });

  it('la ventana mensual tiene 12 meses y también incluye Cancelado', async () => {
    const res = await consultar({ mes: MES.referencia });
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.ventasMes.desde).toBe(MES.desde);
    expect(data.ventasMes.hasta).toBe(MES.hasta);
    expect(data.ventasMes.data).toHaveLength(12);
    expect(data.ventasMes.data[0].mes).toBe(MES.desde);
    expect(data.ventasMes.data[11].mes).toBe(MES.hasta);

    const marzo = data.ventasMes.data.find((fila) => fila.mes === MES.referencia);
    const totalEsperado =
      totales.cancelado + totales.entregado + totales.preparacion + totales.despachado;
    expect(marzo.total).toBeCloseTo(totalEsperado, 2);
    expect(marzo.pedidos).toBe(4);

    // La ventana que termina un mes antes no debe incluir marzo de 1999.
    const anterior = await consultar({ mes: '1999-02' });
    const ultimo = anterior.body.data.ventasMes.data[11];
    expect(ultimo.mes).toBe('1999-02');
    expect(ultimo.total).toBe(0);
    expect(ultimo.pedidos).toBe(0);
  });

  it('permite navegar a la semana y a la ventana mensual anteriores', async () => {
    const actual = await consultar();
    const semanaAnterior = await consultar({ semana: actual.body.data.ventasSemana.anterior });
    expect(semanaAnterior.status).toBe(200);
    expect(semanaAnterior.body.data.ventasSemana.siguiente).toBe(
      actual.body.data.ventasSemana.desde
    );

    const mesAnterior = await consultar({ mes: actual.body.data.ventasMes.anterior });
    expect(mesAnterior.status).toBe(200);
    expect(mesAnterior.body.data.ventasMes.hasta).toBe(
      actual.body.data.ventasMes.anterior
    );
    expect(mesAnterior.body.data.ventasMes.siguiente).toBe(
      actual.body.data.ventasMes.hasta
    );
  });

  it('el producto más vendido usa unidades e incluye pedidos cancelados', async () => {
    const res = await consultar();
    const data = res.body.data;

    const productoPrueba = data.topProductos.find((fila) => fila.id === producto.id);
    expect(productoPrueba).toBeDefined();
    // El pedido cancelado aporta 100 unidades; si se excluyera, este mínimo
    // no se alcanzaría con las otras líneas de la prueba.
    expect(productoPrueba.unidades).toBeGreaterThanOrEqual(100);
  });

  it('las calificaciones incluyen reseñas activas e inactivas', async () => {
    const res = await consultar();
    const data = res.body.data;
    const distribucion = new Map(
      data.calificaciones.distribucion.map((fila) => [fila.estrellas, fila.cantidad])
    );

    expect(data.calificaciones.total).toBeGreaterThanOrEqual(2);
    expect(distribucion.get(5)).toBeGreaterThanOrEqual(1);
    expect(distribucion.get(1)).toBeGreaterThanOrEqual(1);
    expect(
      data.calificaciones.distribucion.reduce((total, fila) => total + fila.cantidad, 0)
    ).toBe(data.calificaciones.total);
  });
});
