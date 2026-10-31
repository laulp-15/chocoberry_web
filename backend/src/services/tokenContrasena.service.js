// src/services/tokenContrasena.service.js
// Genera y consume tokens de un solo uso. El token original nunca se guarda:
// en la base solo queda su hash SHA-256.
import crypto from 'node:crypto';
import { withTransaction } from '../config/db.js';
import { BadRequestError } from '../errors/index.js';
import * as tokenModel from '../models/tokenContrasena.model.js';

export const TIPOS_TOKEN = ['recuperacion', 'activacion'];

const DURACION_MS = {
  recuperacion: 60 * 60 * 1000,
  activacion: 48 * 60 * 60 * 1000,
};

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function validarTipo(tipo) {
  if (!TIPOS_TOKEN.includes(tipo)) {
    throw new Error(`Tipo de token no válido: ${tipo}`);
  }
}

/**
 * Invalida tokens anteriores del mismo usuario/tipo y crea uno nuevo.
 * Devuelve el token en texto plano para incluirlo en el enlace del correo.
 */
export async function crearToken(idUsuario, tipo) {
  validarTipo(tipo);

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const fechaExpiracion = new Date(Date.now() + DURACION_MS[tipo]);

  await withTransaction(async (conexion) => {
    await tokenModel.invalidarVigentes(idUsuario, tipo, conexion);
    await tokenModel.crear(
      {
        idUsuario,
        tokenHash,
        tipo,
        fechaExpiracion,
      },
      conexion
    );
  });

  return token;
}

/**
 * Consume un token vigente. Si el token no existe, expiró, ya se usó o no es
 * de un tipo permitido, se lanza un error genérico para no filtrar detalles.
 */
export async function consumirToken(token, tiposPermitidos = TIPOS_TOKEN) {
  if (!token) {
    throw new BadRequestError('El enlace es inválido o ha expirado.');
  }

  const tokenHash = hashToken(token);

  return withTransaction(async (conexion) => {
    const registro = await tokenModel.buscarVigentePorHash(tokenHash, conexion);

    if (!registro || !tiposPermitidos.includes(registro.tipo)) {
      throw new BadRequestError('El enlace es inválido o ha expirado.');
    }

    const consumido = await tokenModel.marcarUsado(registro.id, conexion);
    if (!consumido) {
      throw new BadRequestError('El enlace es inválido o ha expirado.');
    }

    return {
      idUsuario: registro.id_usuario,
      tipo: registro.tipo,
    };
  });
}
