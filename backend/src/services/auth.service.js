// src/services/auth.service.js
// Reglas de negocio del módulo de acceso: registro, login/logout,
// recuperación de contraseña, bloqueo por intentos y registro de accesos.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import {
  AppError,
  BadRequestError,
  ConflictError,
  DocumentTakenError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../errors/index.js';
import * as rolModel from '../models/rol.model.js';
import * as usuarioModel from '../models/usuario.model.js';
import { registrarAcceso } from '../utils/accessLog.js';
import { CONFIG_INTENTOS, estaBloqueado, limpiarIntentos, registrarIntentoFallido } from '../utils/loginAttempts.js';
import { serializarUsuario } from '../utils/serializers.js';

const ROUNDS = 10;
const ROL_CLIENTE = 'Cliente';
const RESET_EXPIRA = '15m';

const firmarToken = (usuario) =>
  jwt.sign({ sub: usuario.id, correo: usuario.correo }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });

/** Registro de una cuenta de cliente (rol Cliente forzado). */
export async function registrarCliente(datos) {
  const existente = await usuarioModel.buscarPorCorreo(datos.correo);
  if (existente) throw new ConflictError('Ya existe una cuenta registrada con ese correo.');

  const documentoExistente = await usuarioModel.buscarPorNumeroDocumento(datos.numeroDocumento);
  if (documentoExistente) {
    throw new DocumentTakenError('Ya existe una cuenta registrada con ese número de documento.');
  }

  const rolCliente = await rolModel.buscarPorNombreOSlug(ROL_CLIENTE);
  if (!rolCliente) throw new AppError(`No existe el rol "${ROL_CLIENTE}" en la base de datos.`, 500);

  const contrasena = await bcrypt.hash(datos.contrasena, ROUNDS);

  const id = await usuarioModel.crear({
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    tipo_documento: datos.tipoDocumento,
    numero_documento: datos.numeroDocumento,
    correo: datos.correo,
    contrasena,
    telefono: datos.telefono || null,
    barrio: datos.barrio || null,
    direccion: datos.direccion || null,
    estado: true,
    id_rol: rolCliente.id,
  });

  registrarAcceso({ correo: datos.correo, resultado: 'registro' });
  return serializarUsuario(await usuarioModel.buscarPorId(id));
}

/** Inicio de sesión con bloqueo temporal por intentos fallidos. */
export async function iniciarSesion({ correo, contrasena, ip, userAgent }) {
  const bloqueo = estaBloqueado(correo);
  if (bloqueo.bloqueado) {
    throw new AppError(
      `Demasiados intentos fallidos. Intenta de nuevo en ${bloqueo.segundosRestantes}s.`,
      429,
      'LOCKED',
      { segundosRestantes: bloqueo.segundosRestantes }
    );
  }

  const usuario = await usuarioModel.buscarPorCorreo(correo);
  const credencialesOk = usuario ? await bcrypt.compare(contrasena, usuario.contrasena) : false;

  if (!usuario || !credencialesOk) {
    const intento = registrarIntentoFallido(correo);
    registrarAcceso({ correo, resultado: 'fallido', ip, userAgent });

    if (intento.bloqueado) {
      throw new AppError(
        `Superaste el número de intentos permitidos. Cuenta bloqueada temporalmente por ${
          CONFIG_INTENTOS.BLOQUEO_MS / 1000
        }s.`,
        429,
        'LOCKED',
        { segundosRestantes: intento.segundosRestantes }
      );
    }

    throw new UnauthorizedError('Correo o contraseña incorrectos.', [
      { intentosRestantes: intento.intentosRestantes },
    ]);
  }

  if (!usuario.estado) {
    registrarAcceso({ correo, resultado: 'usuario_deshabilitado', ip, userAgent });
    throw new ForbiddenError('Esta cuenta se encuentra deshabilitada. Contacta al administrador.');
  }

  limpiarIntentos(correo);
  registrarAcceso({ correo, resultado: 'exitoso', ip, userAgent });

  return { token: firmarToken(usuario), usuario: serializarUsuario(usuario) };
}

/** Cierre de sesión: el JWT es stateless, solo se registra el evento. */
export async function cerrarSesion(usuario) {
  registrarAcceso({ correo: usuario.correo, resultado: 'cierre_sesion' });
}

/** Solicita la recuperación de contraseña (respuesta genérica por seguridad). */
export async function solicitarRecuperacion(correo) {
  const usuario = await usuarioModel.buscarPorCorreo(correo);

  if (usuario) {
    const token = jwt.sign({ sub: usuario.id, tipo: 'reset' }, env.jwt.secret, {
      expiresIn: RESET_EXPIRA,
    });
    registrarAcceso({ correo, resultado: 'solicitud_recuperacion' });

    // No hay servidor de correo en este alcance: se deja el enlace en consola.
    const enlace = `${env.frontendUrl}/restablecer-contrasena?correo=${encodeURIComponent(correo)}&token=${token}`;
    if (env.nodeEnv !== 'test') {
      // eslint-disable-next-line no-console
      console.info(`[recuperación] Enlace para ${correo}: ${enlace}`);
    }
  }

  return { mensaje: 'Si el correo está registrado, recibirás un enlace de recuperación.' };
}

/** Restablece la contraseña usando el token enviado al correo. */
export async function restablecerContrasena({ token, contrasena }) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch {
    throw new BadRequestError('El enlace de recuperación es inválido o ha expirado.');
  }

  if (payload.tipo !== 'reset') {
    throw new BadRequestError('El token no es válido para restablecer la contraseña.');
  }

  const usuario = await usuarioModel.buscarPorId(payload.sub);
  if (!usuario) throw new NotFoundError('El usuario no existe.');

  await usuarioModel.actualizar(usuario.id, { contrasena: await bcrypt.hash(contrasena, ROUNDS) });
  limpiarIntentos(usuario.correo);
  registrarAcceso({ correo: usuario.correo, resultado: 'restablecimiento_contrasena' });

  return { mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

/** Cambio de contraseña del propio usuario autenticado. */
export async function cambiarContrasena(id, { contrasenaActual, nuevaContrasena }) {
  const usuario = await usuarioModel.buscarPorId(id);
  if (!usuario) throw new NotFoundError('Usuario no encontrado.');

  const actualOk = await bcrypt.compare(contrasenaActual, usuario.contrasena);
  if (!actualOk) throw new UnauthorizedError('La contraseña actual no es correcta.');

  await usuarioModel.actualizar(id, { contrasena: await bcrypt.hash(nuevaContrasena, ROUNDS) });
  registrarAcceso({ correo: usuario.correo, resultado: 'cambio_contrasena' });

  return { mensaje: 'Contraseña actualizada exitosamente.' };
}

/** Datos del usuario autenticado. */
export async function obtenerPerfil(id) {
  const usuario = await usuarioModel.buscarPorId(id);
  if (!usuario) throw new NotFoundError('Usuario no encontrado.');
  return serializarUsuario(usuario);
}
