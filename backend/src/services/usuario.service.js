// src/services/usuario.service.js
// Reglas de negocio del módulo de usuarios. Solo esta capa habla con los modelos.
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import {
  BadRequestError,
  ConflictError,
  DocumentTakenError,
  NotFoundError,
} from '../errors/index.js';
import * as rolModel from '../models/rol.model.js';
import * as usuarioModel from '../models/usuario.model.js';
import { serializarUsuario } from '../utils/serializers.js';
import * as emailService from './emailService.js';
import * as tokenService from './tokenContrasena.service.js';

const ROUNDS = 10;

// Mapeo camelCase (API) -> columna de la BD.
const CAMPOS = {
  nombres: 'nombres',
  apellidos: 'apellidos',
  tipoDocumento: 'tipo_documento',
  numeroDocumento: 'numero_documento',
  correo: 'correo',
  telefono: 'telefono',
  barrio: 'barrio',
  direccion: 'direccion',
};

const limpiarVacio = (valor) => (valor === '' ? null : valor);

/** Resuelve el rol desde `id_rol` o `rol` (nombre/slug) y devuelve su id. */
async function resolverRol(valor) {
  if (valor === undefined || valor === null || valor === '') {
    throw new BadRequestError('El rol es obligatorio.');
  }
  const rol = await rolModel.buscarPorNombreOSlug(valor);
  if (!rol) throw new BadRequestError(`El rol "${valor}" no existe.`);
  return rol.id;
}

/** Impide que dos usuarios compartan el mismo número de documento. */
async function asegurarDocumentoUnico(numeroDocumento, excluirId = null) {
  const existente = await usuarioModel.buscarPorNumeroDocumento(numeroDocumento, excluirId);
  if (existente) {
    throw new DocumentTakenError('Ya existe un usuario registrado con ese número de documento.');
  }
}

/** Construye el objeto de columnas a actualizar a partir de los datos de entrada. */
function mapearCampos(datos, permitidos = Object.keys(CAMPOS)) {
  const campos = {};
  for (const [camel, columna] of Object.entries(CAMPOS)) {
    if (permitidos.includes(camel) && datos[camel] !== undefined) {
      campos[columna] = limpiarVacio(datos[camel]);
    }
  }
  return campos;
}

export async function listar(filtros = {}) {
  const filas = await usuarioModel.listar({
    nombre: filtros.nombre,
    correo: filtros.correo,
    rol: filtros.rol,
    idRol: filtros.id_rol,
    estado: filtros.estado,
  });
  return filas.map(serializarUsuario);
}

export async function obtener(id) {
  const usuario = await usuarioModel.buscarPorId(id);
  if (!usuario) throw new NotFoundError('Usuario no encontrado.');
  return serializarUsuario(usuario);
}

/** Crea un usuario (empleado o cliente) desde el panel administrador. */
export async function crear(datos) {
  const existente = await usuarioModel.buscarPorCorreo(datos.correo);
  if (existente) throw new ConflictError('Ya existe un usuario registrado con ese correo.');

  await asegurarDocumentoUnico(datos.numeroDocumento);

  const idRol = await resolverRol(datos.id_rol ?? datos.rol);

  // El panel ya no pide contraseña: si no llega, se genera una aleatoria que
  // nadie conoce y se envía un enlace de activación para establecerla.
  const debeActivar = !datos.contrasena;
  const contrasena = await bcrypt.hash(
    debeActivar ? crypto.randomBytes(32).toString('hex') : datos.contrasena,
    ROUNDS
  );

  const id = await usuarioModel.crear({
    ...mapearCampos(datos),
    contrasena,
    estado: datos.estado ?? true,
    id_rol: idRol,
  });

  const usuario = await usuarioModel.buscarPorId(id);

  if (debeActivar) {
    const token = await tokenService.crearToken(id, 'activacion');
    void emailService.enviarActivacionCuenta({
      correo: usuario.correo,
      nombre: usuario.nombres,
      token,
    });
  }

  return serializarUsuario(usuario);
}

export async function actualizar(id, datos) {
  const actual = await usuarioModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Usuario no encontrado.');

  // Unicidad del correo (solo si cambió).
  if (datos.correo && datos.correo !== actual.correo) {
    const existente = await usuarioModel.buscarPorCorreo(datos.correo);
    if (existente && existente.id !== actual.id) {
      throw new ConflictError('Ya existe otro usuario con ese correo.');
    }
  }

  // Unicidad del documento (solo si cambió).
  if (
    datos.numeroDocumento &&
    datos.numeroDocumento !== actual.numero_documento
  ) {
    await asegurarDocumentoUnico(datos.numeroDocumento, actual.id);
  }

  const campos = mapearCampos(datos);

  if (datos.contrasena) campos.contrasena = await bcrypt.hash(datos.contrasena, ROUNDS);
  if (datos.id_rol !== undefined || datos.rol !== undefined) {
    campos.id_rol = await resolverRol(datos.id_rol ?? datos.rol);
  }

  return serializarUsuario(await usuarioModel.actualizar(id, campos));
}

export async function cambiarEstado(id, estado) {
  const actual = await usuarioModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Usuario no encontrado.');

  return serializarUsuario(await usuarioModel.cambiarEstado(id, estado));
}

export async function eliminar(id) {
  const actual = await usuarioModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Usuario no encontrado.');

  // Regla de negocio: no se puede eliminar un usuario con pedidos asociados.
  const pedidos = await usuarioModel.contarPedidos(id);
  if (pedidos > 0) {
    throw new ConflictError(
      `No se puede eliminar el usuario: tiene ${pedidos} pedido(s) asociado(s). Desactívalo en su lugar.`
    );
  }

  await usuarioModel.eliminar(id);
}

/** Actualiza el propio perfil: no permite cambiar rol, estado ni contraseña. */
export async function actualizarPerfil(id, datos) {
  const actual = await usuarioModel.buscarPorId(id);
  if (!actual) throw new NotFoundError('Usuario no encontrado.');

  if (datos.correo && datos.correo !== actual.correo) {
    const existente = await usuarioModel.buscarPorCorreo(datos.correo);
    if (existente && existente.id !== actual.id) {
      throw new ConflictError('Ya existe otro usuario con ese correo.');
    }
  }

  if (
    datos.numeroDocumento &&
    datos.numeroDocumento !== actual.numero_documento
  ) {
    await asegurarDocumentoUnico(datos.numeroDocumento, actual.id);
  }

  const campos = mapearCampos(datos);
  return serializarUsuario(await usuarioModel.actualizar(id, campos));
}
