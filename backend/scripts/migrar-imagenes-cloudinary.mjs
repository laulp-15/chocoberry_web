// scripts/migrar-imagenes-cloudinary.mjs
// Migra a Cloudinary las imágenes antiguas servidas desde /uploads.
//
// Por defecto hace un simulacro: solo lista lo que haría. Para ejecutar los
// cambios usa `npm run migrar:imagenes -- --apply`.
//
// Reglas:
// - Solo procesa filas con public_id NULL y URL que empiece por /uploads/.
// - No borra los archivos locales.
// - Si una fila ya fue migrada por otra corrida, no la duplica.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from '../src/config/db.js';
import { borrarImagen, subirBuffer } from '../src/utils/cloudinaryStorage.js';

const DIR_SCRIPT = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(DIR_SCRIPT, '..', 'uploads');
const APLICAR = process.argv.includes('--apply');

const GRUPOS = [
  {
    tabla: 'imagenProducto',
    campoUrl: 'url',
    campoPublicId: 'public_id',
    tipo: 'producto',
  },
  {
    tabla: 'comprobantePago',
    campoUrl: 'url',
    campoPublicId: 'public_id',
    tipo: 'comprobante',
  },
  {
    tabla: 'pedido',
    campoUrl: 'evidencia_entrega',
    campoPublicId: 'evidencia_public_id',
    tipo: 'evidencia',
  },
];

function nombreArchivo(url) {
  const sinConsulta = String(url).split('?')[0].split('#')[0];
  return path.basename(decodeURIComponent(sinConsulta));
}

async function procesarGrupo(grupo, resumen) {
  const filas = await query(
    `SELECT id, \`${grupo.campoUrl}\` AS url
       FROM \`${grupo.tabla}\`
      WHERE \`${grupo.campoUrl}\` LIKE '/uploads/%'
        AND \`${grupo.campoPublicId}\` IS NULL
      ORDER BY id ASC`
  );

  if (filas.length === 0) return;

  console.log(
    `\n${grupo.tabla}: ${filas.length} imagen(es) pendiente(s) [${grupo.tipo}]`
  );

  for (const fila of filas) {
    const archivo = path.join(UPLOADS_DIR, nombreArchivo(fila.url));

    try {
      const buffer = await fs.readFile(archivo);
      if (!APLICAR) {
        console.log(`  [dry-run] #${fila.id} ${fila.url} -> ${archivo}`);
        resumen.simuladas += 1;
        continue;
      }

      const subida = await subirBuffer(buffer, grupo.tipo);
      const resultado = await query(
        `UPDATE \`${grupo.tabla}\`
            SET \`${grupo.campoUrl}\` = ?, \`${grupo.campoPublicId}\` = ?
          WHERE id = ? AND \`${grupo.campoPublicId}\` IS NULL`,
        [subida.url, subida.public_id, fila.id]
      );

      if (resultado.affectedRows === 0) {
        await borrarImagen(subida.public_id, grupo.tipo);
        console.log(`  [skip] #${fila.id} ya había sido migrada.`);
        resumen.omitidas += 1;
        continue;
      }

      console.log(`  [ok] #${fila.id} ${fila.url} -> ${subida.url}`);
      resumen.migradas += 1;
    } catch (error) {
      console.error(`  [error] #${fila.id} ${fila.url}: ${error.message}`);
      resumen.errores += 1;
    }
  }
}

async function main() {
  console.log(
    APLICAR
      ? 'Migrando imágenes de /uploads a Cloudinary...'
      : 'Simulacro: no se modificará nada. Usa --apply para ejecutar.'
  );
  console.log(`Carpeta local: ${UPLOADS_DIR}`);

  const resumen = { migradas: 0, simuladas: 0, omitidas: 0, errores: 0 };

  try {
    for (const grupo of GRUPOS) {
      await procesarGrupo(grupo, resumen);
    }
  } finally {
    await pool.end();
  }

  console.log('\nResumen:');
  console.log(`  Migradas:  ${resumen.migradas}`);
  console.log(`  Simuladas: ${resumen.simuladas}`);
  console.log(`  Omitidas:  ${resumen.omitidas}`);
  console.log(`  Errores:   ${resumen.errores}`);

  if (resumen.errores > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
