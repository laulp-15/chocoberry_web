// scripts/seed-resenas.mjs
// Crea un lote de 10 reseñas de demostración con clientes reales de la BD.
//
// - No crea usuarios ni pedidos: usa clientes activos (preferiblemente con
//   pedidos entregados) para que los nombres se sientan reales.
// - Las reseñas son generales, como el esquema actual (sin producto/pedido).
// - Reparte las fechas en los últimos meses y deja todas activas.
// - El lote se identifica con scripts/.seed-resenas.json (ignorado por git).
// - `npm run seed:resenas -- --reset` elimina solo las reseñas del manifiesto.
//
// Uso:
//   npm run seed:resenas
//   npm run seed:resenas -- --reset
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from '../src/config/db.js';
import * as resenaModel from '../src/models/resena.model.js';

const DIR_SCRIPT = path.dirname(fileURLToPath(import.meta.url));
const MANIFIESTO_ARCHIVO = path.join(DIR_SCRIPT, '.seed-resenas.json');

const RESENAS_SEED = [
  {
    calificacion: 5,
    diasAtras: 2,
    comentario:
      'La caja llegó impecable y las fresas estaban súper frescas. Fue el regalo perfecto para mi mamá.',
  },
  {
    calificacion: 5,
    diasAtras: 6,
    comentario:
      'El chocolate estaba delicioso y el mensaje personalizado quedó tal como lo pedí. Muy recomendados.',
  },
  {
    calificacion: 4,
    diasAtras: 11,
    comentario:
      'Todo llegó a tiempo y muy bien empacado. Solo habría querido que la caja fuera un poquito más grande.',
  },
  {
    calificacion: 5,
    diasAtras: 18,
    comentario:
      'Pedí el ramo para un aniversario y quedó espectacular. La atención por WhatsApp fue muy amable.',
  },
  {
    calificacion: 3,
    diasAtras: 25,
    comentario:
      'Las fresas estaban ricas, pero la entrega se demoró un poco más de lo acordado.',
  },
  {
    calificacion: 5,
    diasAtras: 34,
    comentario:
      'Me encantó la combinación de chocolate blanco con las fresas. Se nota la calidad de los ingredientes.',
  },
  {
    calificacion: 4,
    diasAtras: 43,
    comentario:
      'Muy buena presentación y sabor. El domicilio llegó bien y sin maltratar el producto.',
  },
  {
    calificacion: 5,
    diasAtras: 55,
    comentario:
      'Sorprendí a mi novia con el detalle y quedó feliz. El empaque es elegante y muy cuidado.',
  },
  {
    calificacion: 4,
    diasAtras: 68,
    comentario:
      'La atención fue rápida y el pedido llegó completo. Volvería a comprar para otra ocasión.',
  },
  {
    calificacion: 5,
    diasAtras: 82,
    comentario:
      'Un regalo diferente y delicioso. Las fresas se veían frescas y el chocolate tenía muy buen sabor.',
  },
];

function leerManifiesto() {
  if (!fs.existsSync(MANIFIESTO_ARCHIVO)) return null;
  try {
    return JSON.parse(fs.readFileSync(MANIFIESTO_ARCHIVO, 'utf8'));
  } catch {
    console.warn('[warn] El manifiesto existe pero no se pudo leer; se ignora.');
    return null;
  }
}

function guardarManifiesto(manifiesto) {
  fs.writeFileSync(MANIFIESTO_ARCHIVO, `${JSON.stringify(manifiesto, null, 2)}\n`, 'utf8');
}

function borrarManifiesto() {
  fs.rmSync(MANIFIESTO_ARCHIVO, { force: true });
}

function fechaHaceDias(dias) {
  const fecha = new Date();
  fecha.setHours(12, 0, 0, 0);
  fecha.setDate(fecha.getDate() - dias);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
    fecha.getDate()
  ).padStart(2, '0')}`;
}

async function clientesDisponibles() {
  const entregados = await query(
    `SELECT DISTINCT u.id, u.nombres, u.apellidos
       FROM usuario u
       JOIN rol r ON r.id = u.id_rol
       JOIN pedido p ON p.id_usuario = u.id
       JOIN estadosPedido e ON e.id = p.id_estado
      WHERE LOWER(r.nombre_rol) = 'cliente'
        AND u.estado = 1
        AND LOWER(e.nombre) = 'entregado'
      ORDER BY p.fecha DESC`
  );

  const activos = await query(
    `SELECT u.id, u.nombres, u.apellidos
       FROM usuario u
       JOIN rol r ON r.id = u.id_rol
      WHERE LOWER(r.nombre_rol) = 'cliente'
        AND u.estado = 1
      ORDER BY u.id ASC`
  );

  // Primero los clientes con pedidos entregados; se completa con el resto.
  const porId = new Map();
  for (const cliente of [...entregados, ...activos]) {
    if (!porId.has(cliente.id)) porId.set(cliente.id, cliente);
  }
  return [...porId.values()];
}

async function main() {
  const reiniciar = process.argv.includes('--reset');
  const manifiesto = leerManifiesto();

  if (manifiesto?.reviews?.length) {
    if (!reiniciar) {
      console.log(
        `[skip] Ya existe un lote de ${manifiesto.reviews.length} reseñas. ` +
          'Usa "npm run seed:resenas -- --reset" para reemplazarlo.'
      );
      return;
    }

    console.log(`[reset] Eliminando ${manifiesto.reviews.length} reseña(s) del manifiesto...`);
    for (const item of manifiesto.reviews) {
      const coincide = await query(
        'SELECT id FROM resena WHERE id = ? AND id_usuario = ? AND comentario = ? LIMIT 1',
        [item.id, item.clienteId, item.comentario]
      );
      if (!coincide.length) {
        console.warn(`[reset] La reseña #${item.id} ya no coincide; no se elimina.`);
        continue;
      }
      await query('DELETE FROM resena WHERE id = ?', [item.id]);
      console.log(`[reset] Reseña #${item.id} eliminada.`);
    }
    borrarManifiesto();
  } else if (!reiniciar) {
    console.log('[info] No hay manifiesto; se creará un lote nuevo.');
  }

  const clientes = await clientesDisponibles();
  if (clientes.length < RESENAS_SEED.length) {
    throw new Error(
      `Se necesitan al menos ${RESENAS_SEED.length} clientes activos y solo hay ${clientes.length}. ` +
        'Ejecuta primero los seeds de catálogo y pedidos.'
    );
  }

  const nuevoManifiesto = {
    version: 1,
    generatedAt: new Date().toISOString(),
    reviews: [],
  };
  guardarManifiesto(nuevoManifiesto);

  let creadas = 0;
  let existentes = 0;

  for (let i = 0; i < RESENAS_SEED.length; i += 1) {
    const definicion = RESENAS_SEED[i];
    const cliente = clientes[i];
    const fecha = fechaHaceDias(definicion.diasAtras);

    // Idempotencia adicional si el manifiesto se perdió: no duplicar el texto
    // exacto de la misma persona.
    const previa = await query(
      'SELECT id FROM resena WHERE id_usuario = ? AND comentario = ? LIMIT 1',
      [cliente.id, definicion.comentario]
    );

    let id;
    if (previa.length) {
      id = previa[0].id;
      existentes += 1;
      console.log(`[skip] ${cliente.nombres} ${cliente.apellidos}: la reseña ya existía (#${id}).`);
    } else {
      id = await resenaModel.crear({
        calificacion: definicion.calificacion,
        comentario: definicion.comentario,
        id_usuario: cliente.id,
        fecha,
      });
      creadas += 1;
      console.log(
        `[ok] #${id} | ${fecha} | ${definicion.calificacion}/5 | ` +
          `${cliente.nombres} ${cliente.apellidos}`
      );
    }

    nuevoManifiesto.reviews.push({
      id,
      clienteId: cliente.id,
      cliente: `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}`.trim(),
      calificacion: definicion.calificacion,
      comentario: definicion.comentario,
      fecha,
    });
    guardarManifiesto(nuevoManifiesto);
  }

  const resumen = await query(
    'SELECT COUNT(*) AS total, ROUND(AVG(calificacion), 2) AS promedio FROM resena'
  );
  const { total, promedio } = resumen[0] ?? {};

  console.log('\nResumen del lote de reseñas');
  console.log(`  Reseñas creadas:          ${creadas}`);
  console.log(`  Reseñas ya existentes:   ${existentes}`);
  console.log(`  Reseñas en la base:      ${total}`);
  console.log(`  Calificación promedio:   ${promedio ?? '—'}`);
  console.log('  Las 10 reseñas quedaron activas por defecto.');
}

main()
  .catch((error) => {
    console.error('\n[error] No se pudo completar el seed de reseñas.');
    console.error(error?.stack ?? error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
