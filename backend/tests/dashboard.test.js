// tests/dashboard.test.js
// Pruebas de integración del Dashboard. Cubren permisos, reglas de ingresos
// (incluido Cancelado), gráficas semanales/mensuales, navegación de períodos y
// reseñas activas/inactivas.
import request from 'supertest';
import ExcelJS from 'exceljs';
import app from '../src/app.js';
import { query } from '../src/config/db.js';

const ADMIN = { correo: 'admin@chocoberry.com', contrasena: 'Admin123!' };
const CLAVE_PRUEBA = 'Prueba123!';
const COMPROBANTE = Buffer.from('89504e470d0a1a0a', 'hex');

const parserBinario = (res, callback) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

// Mes de prueba aislado (marzo de 1999) para no depender de los pedidos
// reales del seed ni de otros archivos de pruebas.
const MES = {
  referencia: '1999-03',
  desde: '1999-01',
  hasta: '1999-12',
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
    return res.body.data;
  }

  async function aprobarPagoCompleto(id) {
    const detalle = await auth(request(app).get(`/api/pedidos/${id}`));
    expect(detalle.status).toBe(200);
    const pedido = detalle.body.data;
    if (pedido.estado.nombre !== 'Pendiente' || pedido.saldo <= 0) return pedido;

    const pendiente = (pedido.comprobantes ?? []).find(
      (comprobante) => comprobante.estado.nombre === 'Pendiente'
    );
    if (!pendiente) return pedido;

    const res = await auth(
      request(app)
        .patch(`/api/comprobantes/${pendiente.id}/aprobar`)
        .send({ monto: pedido.saldo })
    );
    expect(res.status).toBe(200);
    return res.body.data.pedido;
  }

  async function cambiarEstado(id, estado) {
    if (estado === 'en_preparacion') {
      await aprobarPagoCompleto(id);
    }
    const payload = { estado };
    if (estado === 'cancelado') {
      payload.observacionesEntrega = 'Cancelación de prueba en dashboard.';
    }
    const res = await auth(request(app).patch(`/api/pedidos/${id}/estado`)).send(payload);
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
  });

  it('GET /api/dashboard/resumen sin token devuelve 401', async () => {
    const res = await request(app).get('/api/dashboard/resumen');
    expect(res.status).toBe(401);
  });

  it('exige el permiso Dashboard · Ver, no un rol específico', async () => {
    const admin = await consultar();
    expect(admin.status).toBe(200);

    const cliente = await auth(request(app).get('/api/dashboard/resumen'), tokenCliente);
    expect(cliente.status).toBe(403);

    // El rol Repartidor tiene Dashboard · Ver en los datos iniciales.
    const repartidor = await auth(
      request(app).get('/api/dashboard/resumen'),
      tokenRepartidor
    );
    expect(repartidor.status).toBe(200);
  });

  it('rechaza un mes inválido (422)', async () => {
    const mes = await consultar({ mes: '1999-13' });
    expect(mes.status).toBe(422);
  });

  it('devuelve la estructura completa y los KPIs coherentes', async () => {
    const res = await consultar();
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.periodo.mes).toMatch(/^\d{4}-\d{2}$/);
    expect(data.periodo.anio).toBeGreaterThanOrEqual(1999);
    expect(data.semanasMes.data.length).toBeGreaterThan(0);
    expect(data.ventasMes.data).toHaveLength(12);
    expect(data.ventasMes.anio).toBe(data.periodo.anio);
    expect(Array.isArray(data.disponibilidad.aniosDisponibles)).toBe(true);

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

    expect(Array.isArray(data.topProductos)).toBe(true);
    if (data.topProductos.length > 0) {
      expect(data.kpis.productoMasVendido).toBe(data.topProductos[0].nombre);
    } else {
      expect(data.kpis.productoMasVendido).toBeNull();
    }

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

  it('la gráfica semanal solo incluye días del mes seleccionado', async () => {
    const res = await consultar({ mes: MES.referencia });
    expect(res.status).toBe(200);

    const data = res.body.data;
    const dias = data.semanasMes.data.flatMap((semana) => semana.dias);

    expect(data.semanasMes.mes).toBe(MES.referencia);
    expect(data.semanasMes.data).toHaveLength(5);
    expect(dias).toHaveLength(31);
    expect(dias.every((dia) => dia.fecha.startsWith(MES.referencia))).toBe(true);
    expect(data.semanasMes.data[0].desde).toBe('1999-03-01');
    expect(data.semanasMes.data[0].hasta).toBe('1999-03-07');
    expect(data.semanasMes.data[4].desde).toBe('1999-03-29');
    expect(data.semanasMes.data[4].hasta).toBe('1999-03-31');
  });

  it('las semanas parciales se recortan al mes', async () => {
    const res = await consultar({ mes: '1999-04' });
    expect(res.status).toBe(200);

    const data = res.body.data;
    const primera = data.semanasMes.data[0];
    const ultima = data.semanasMes.data[data.semanasMes.data.length - 1];

    expect(primera.desde).toBe('1999-04-01');
    expect(primera.hasta).toBe('1999-04-04');
    expect(primera.dias.map((dia) => dia.dia)).toEqual(['Jue', 'Vie', 'Sáb', 'Dom']);
    expect(primera.dias.every((dia) => dia.fecha.startsWith('1999-04'))).toBe(true);
    expect(ultima.hasta).toBe('1999-04-30');
    expect(ultima.dias.every((dia) => dia.fecha.startsWith('1999-04'))).toBe(true);
  });

  it('la gráfica semanal incluye Cancelado y excluye Pendiente/Rechazado', async () => {
    const res = await consultar({ mes: MES.referencia });
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.semanasMes.mes).toBe(MES.referencia);
    expect(data.semanasMes.data).toHaveLength(5);

    const porFecha = new Map(
      data.semanasMes.data
        .flatMap((semana) => semana.dias)
        .map((dia) => [dia.fecha, dia])
    );
    expect(porFecha.get('1999-03-01').total).toBe(0); // Pendiente
    expect(porFecha.get('1999-03-02').total).toBeCloseTo(totales.cancelado, 2);
    expect(porFecha.get('1999-03-03').total).toBeCloseTo(totales.entregado, 2);
    expect(porFecha.get('1999-03-04').total).toBe(0); // Rechazado
    expect(porFecha.get('1999-03-05').total).toBeCloseTo(totales.preparacion, 2);
    expect(porFecha.get('1999-03-06').total).toBeCloseTo(totales.despachado, 2);
    expect(porFecha.get('1999-03-07').total).toBe(0);

    const totalEsperado =
      totales.cancelado + totales.entregado + totales.preparacion + totales.despachado;
    const totalMes = data.semanasMes.data.reduce((total, semana) => total + semana.total, 0);
    expect(totalMes).toBeCloseTo(totalEsperado, 2);
    expect(
      data.semanasMes.data.reduce((total, semana) => total + semana.pedidos, 0)
    ).toBe(4);
  });

  it('la gráfica mensual cubre enero a diciembre del año seleccionado', async () => {
    const res = await consultar({ mes: MES.referencia });
    expect(res.status).toBe(200);

    const data = res.body.data;
    expect(data.ventasMes.anio).toBe(1999);
    expect(data.ventasMes.desde).toBe(MES.desde);
    expect(data.ventasMes.hasta).toBe(MES.hasta);
    expect(data.ventasMes.data).toHaveLength(12);
    expect(data.ventasMes.data[0].mes).toBe(MES.desde);
    expect(data.ventasMes.data[11].mes).toBe(MES.hasta);
    expect(data.ventasMes.data[0].label).toContain('1999');
    expect(data.ventasMes.data[11].label).toContain('1999');

    const marzo = data.ventasMes.data.find((fila) => fila.mes === MES.referencia);
    const totalEsperado =
      totales.cancelado + totales.entregado + totales.preparacion + totales.despachado;
    expect(marzo.total).toBeCloseTo(totalEsperado, 2);
    expect(marzo.pedidos).toBe(4);
  });

  it('permite navegar entre los años con actividad', async () => {
    const base = await consultar({ mes: MES.referencia });
    const anios = base.body.data.disponibilidad.aniosDisponibles;

    expect(anios).toContain(1999);
    expect(anios).toEqual([...anios].sort((a, b) => a - b));

    if (anios.length > 1) {
      const [primero, segundo] = anios;
      const primerAnio = await consultar({ mes: `${primero}-03` });
      expect(primerAnio.status).toBe(200);
      expect(primerAnio.body.data.ventasMes.siguiente).toBe(segundo);

      const segundoAnio = await consultar({ mes: `${segundo}-03` });
      expect(segundoAnio.status).toBe(200);
      expect(segundoAnio.body.data.ventasMes.anterior).toBe(primero);
    }
  });

  it('el producto más vendido usa unidades e incluye pedidos cancelados', async () => {
    const res = await consultar({ mes: MES.referencia });
    const data = res.body.data;

    const productoPrueba = data.topProductos.find((fila) => fila.id === producto.id);
    expect(productoPrueba).toBeDefined();
    // El pedido cancelado aporta 100 unidades; si se excluyera, este mínimo
    // no se alcanzaría con las otras líneas de la prueba.
    expect(productoPrueba.unidades).toBeGreaterThanOrEqual(100);
  });

  it('el top de productos cambia según el mes seleccionado', async () => {
    const marzo = await consultar({ mes: MES.referencia });
    expect(marzo.status).toBe(200);
    expect(marzo.body.data.topProductos.map((fila) => fila.id)).toContain(producto.id);

    const febrero = await consultar({ mes: '1999-02' });
    expect(febrero.status).toBe(200);
    expect(febrero.body.data.topProductos).toHaveLength(0);
  });

  it('los ingresos del mes siguen el período y los KPIs globales no cambian', async () => {
    const marzo = await consultar({ mes: MES.referencia });
    const febrero = await consultar({ mes: '1999-02' });
    const totalEsperado =
      totales.cancelado + totales.entregado + totales.preparacion + totales.despachado;

    expect(marzo.body.data.kpis.ingresosMes).toBeCloseTo(totalEsperado, 2);
    expect(marzo.body.data.kpis.ingresosMesAnterior).toBe(0);
    expect(marzo.body.data.kpis.variacionPorcentual).toBeNull();
    expect(febrero.body.data.kpis.ingresosMes).toBe(0);
    expect(febrero.body.data.kpis.productoMasVendido).toBeNull();
    expect(marzo.body.data.kpis.productoMasVendido).toBe(
      marzo.body.data.topProductos[0]?.nombre ?? null
    );

    expect(marzo.body.data.kpis.pedidosPendientes).toBe(
      febrero.body.data.kpis.pedidosPendientes
    );
    expect(marzo.body.data.kpis.pedidosEntregados).toBe(
      febrero.body.data.kpis.pedidosEntregados
    );
    expect(marzo.body.data.calificaciones.total).toBe(
      febrero.body.data.calificaciones.total
    );
  });

  it('el endpoint público de más vendidos sigue devolviendo hasta 4 productos', async () => {
    const publico = await request(app).get('/api/catalogo/mas-vendidos');

    expect(publico.status).toBe(200);
    expect(publico.body.data.length).toBeGreaterThan(0);
    expect(publico.body.data.length).toBeLessThanOrEqual(4);
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

  it('exporta el reporte PDF con permisos, cabeceras y contenido válido', async () => {
    const sinToken = await request(app).get('/api/dashboard/exportar/pdf');
    expect(sinToken.status).toBe(401);

    const cliente = await auth(
      request(app).get('/api/dashboard/exportar/pdf'),
      tokenCliente
    );
    expect(cliente.status).toBe(403);

    const repartidor = await auth(
      request(app).get('/api/dashboard/exportar/pdf'),
      tokenRepartidor
    );
    expect(repartidor.status).toBe(403);

    const res = await auth(
      request(app).get('/api/dashboard/exportar/pdf').query({ mes: MES.referencia })
    )
      .buffer(true)
      .parse(parserBinario);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="reporte-ventas-\d{4}-\d{2}-\d{2}\.pdf"$/
    );
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(res.body.length).toBeGreaterThan(1000);
  });

  it('exporta el reporte Excel con las hojas esperadas', async () => {
    const res = await auth(
      request(app)
        .get('/api/dashboard/exportar/excel')
        .query({ mes: MES.referencia })
    )
      .buffer(true)
      .parse(parserBinario);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(
      /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/
    );
    expect(res.headers['content-disposition']).toMatch(
      /^attachment; filename="reporte-ventas-\d{4}-\d{2}-\d{2}\.xlsx"$/
    );
    expect(res.body.subarray(0, 2).toString()).toBe('PK');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);
    expect(workbook.worksheets.map((hoja) => hoja.name)).toEqual([
      'Resumen',
      'Ventas por semana',
      'Ventas por mes',
      'Productos más vendidos',
    ]);

    const hojaTop = workbook.getWorksheet('Productos más vendidos');
    const productosExportados = [];
    hojaTop.eachRow((fila, numero) => {
      if (numero > 1) productosExportados.push(fila.getCell(2).value);
    });
    expect(productosExportados).toContain(producto.nombre);
  });

  it('devuelve 404 al exportar un período sin ventas', async () => {
    const res = await auth(
      request(app)
        .get('/api/dashboard/exportar/pdf')
        .query({ mes: '2099-12' })
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/No hay ventas para los filtros seleccionados/i);
  });
});
