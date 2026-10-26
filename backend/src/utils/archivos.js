// src/utils/archivos.js
// Utilidades para los archivos subidos al backend.
import fs from 'node:fs';
import path from 'node:path';
import { uploadsDir } from '../middlewares/upload.js';

/**
 * Borra del disco una imagen subida. Solo actúa sobre rutas `/uploads/...`
 * (nunca sobre assets del front como `/img/...` ni URLs externas).
 */
export async function eliminarArchivoSubido(ruta) {
  if (!ruta || typeof ruta !== 'string' || !ruta.startsWith('/uploads/')) return;

  const nombre = path.basename(ruta);
  try {
    await fs.promises.unlink(path.join(uploadsDir, nombre));
  } catch {
    // El archivo pudo haberse eliminado antes; no es un error de negocio.
  }
}
