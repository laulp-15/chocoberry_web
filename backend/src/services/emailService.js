// src/services/emailService.js
// Envío de correos transaccionales con Brevo (SMTP). El envío nunca debe
// bloquear la operación principal: los services llaman estas funciones sin
// esperarlas y aquí se capturan los errores para no romper la petición.
import nodemailer from 'nodemailer';
import env from '../config/env.js';

let transporter = null;

function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatearMoneda(valor) {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

function urlFrontend(ruta) {
  return `${String(env.frontendUrl).replace(/\/+$/, '')}${ruta}`;
}

export function enlaceRecuperacion(token) {
  return urlFrontend(`/restablecer-contrasena?token=${encodeURIComponent(token)}`);
}

export function enlaceActivacion(token) {
  return urlFrontend(`/establecer-contrasena?token=${encodeURIComponent(token)}`);
}

function obtenerTransporte() {
  if (transporter) return transporter;
  if (!env.mail.host || !env.mail.user || !env.mail.pass) return null;

  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.port === 465,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass,
    },
  });
  return transporter;
}

function plantilla({ titulo, saludo, mensaje, boton, enlace, nota }) {
  const contenidoBoton = boton
    ? `<p style="margin:28px 0;">
         <a href="${escaparHtml(enlace)}"
            style="display:inline-block;padding:13px 22px;border-radius:999px;background:#7b2d26;color:#ffffff;text-decoration:none;font-weight:700;">
           ${escaparHtml(boton)}
         </a>
       </p>
       <p style="font-size:13px;color:#6b5a57;word-break:break-all;">
         Si el botón no funciona, copia este enlace en tu navegador:<br />
         <a href="${escaparHtml(enlace)}" style="color:#7b2d26;">${escaparHtml(enlace)}</a>
       </p>`
    : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escaparHtml(titulo)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f7efec;font-family:Arial,Helvetica,sans-serif;color:#3d2b28;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7efec;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #ead9d3;">
            <tr>
              <td style="background:#7b2d26;padding:22px 28px;color:#ffffff;">
                <div style="font-size:22px;font-weight:800;letter-spacing:.3px;">ChocoBerry</div>
                <div style="font-size:12px;opacity:.85;margin-top:4px;">Fresas cubiertas de chocolate</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 12px;">
                <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#3d2b28;">${escaparHtml(titulo)}</h1>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${escaparHtml(saludo)}</p>
                <div style="font-size:15px;line-height:1.6;">${mensaje}</div>
                ${contenidoBoton}
                ${nota ? `<p style="margin:22px 0 0;font-size:13px;line-height:1.5;color:#6b5a57;">${nota}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 26px;font-size:12px;line-height:1.5;color:#8a7772;border-top:1px solid #f0e3df;">
                Este correo se envió automáticamente. Si no reconoces esta actividad, ignóralo o contacta a ChocoBerry.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function textoPlano(partes) {
  return partes.filter(Boolean).join('\n\n');
}

async function enviar({ to, subject, html, text }) {
  if (!to) return { omitido: true };

  if (env.nodeEnv === 'test') {
    return { omitido: true };
  }

  const transporte = obtenerTransporte();
  if (!transporte) {
    // eslint-disable-next-line no-console
    console.warn('[email] MAIL_* no está configurado; no se envió el correo.');
    return { omitido: true };
  }

  try {
    return await transporte.sendMail({
      from: env.mail.from,
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    // Nunca se registra el token, la contraseña ni el cuerpo del correo.
    // eslint-disable-next-line no-console
    console.error(`[email] No se pudo enviar "${subject}": ${error.message}`);
    return { error: true };
  }
}

function nombreCliente(pedido) {
  return (
    pedido?.cliente?.nombreCompleto ||
    [pedido?.cliente?.nombres, pedido?.cliente?.apellidos].filter(Boolean).join(' ') ||
    'cliente'
  );
}

function correoCliente(pedido) {
  return pedido?.cliente?.correo || '';
}

function datosPedido(pedido) {
  return {
    id: pedido?.id,
    total: formatearMoneda(pedido?.total),
    fechaEntrega: pedido?.fechaEntrega || 'por confirmar',
  };
}

export async function enviarRecuperacionContrasena({ correo, nombre, token }) {
  const enlace = enlaceRecuperacion(token);
  const titulo = 'Recupera tu contraseña';
  const mensaje = `<p style="margin:0;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. El enlace estará disponible durante <strong>1 hora</strong>.</p>`;

  return enviar({
    to: correo,
    subject: 'Recupera tu contraseña de ChocoBerry',
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombre || 'gracias por escribirnos'}.`,
      mensaje,
      boton: 'Restablecer contraseña',
      enlace,
      nota: 'Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá funcionando.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombre || 'gracias por escribirnos'}.`,
      'Recibimos una solicitud para restablecer tu contraseña. El enlace estará disponible durante 1 hora.',
      enlace,
      'Si no solicitaste este cambio, ignora este correo.',
    ]),
  });
}

export async function enviarActivacionCuenta({ correo, nombre, token }) {
  const enlace = enlaceActivacion(token);
  const titulo = 'Establece tu contraseña';
  const mensaje = `<p style="margin:0;">Tu cuenta de ChocoBerry ya fue creada. Para empezar a usarla, establece tu contraseña desde el siguiente enlace. El enlace estará disponible durante <strong>48 horas</strong>.</p>`;

  return enviar({
    to: correo,
    subject: 'Establece la contraseña de tu cuenta ChocoBerry',
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombre || 'bienvenido a ChocoBerry'}.`,
      mensaje,
      boton: 'Establecer contraseña',
      enlace,
      nota: 'Por seguridad, nadie de ChocoBerry te pedirá tu contraseña por correo o teléfono.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombre || 'bienvenido a ChocoBerry'}.`,
      'Tu cuenta ya fue creada. Establece tu contraseña desde este enlace (disponible 48 horas):',
      enlace,
    ]),
  });
}

export async function enviarComprobanteAprobado({ pedido }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'Comprobante aprobado';
  const mensaje = `<p style="margin:0;">Verificamos el comprobante de pago de tu pedido <strong>#${escaparHtml(datos.id)}</strong> por <strong>${escaparHtml(datos.total)}</strong>. El pedido continuará con el proceso de preparación.</p>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Comprobante aprobado - Pedido #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      nota: 'Puedes consultar el estado de tu pedido desde “Mis pedidos”.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `Verificamos el comprobante de pago de tu pedido #${datos.id} por ${datos.total}.`,
    ]),
  });
}

export async function enviarComprobanteRechazado({ pedido, motivo, monto }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'Comprobante rechazado';
  const motivoSeguro = motivo || 'No especificado';
  const montoTexto = monto === null || monto === undefined ? '' : ` por ${formatearMoneda(monto)}`;
  const mensaje = `<p style="margin:0;">El comprobante${escaparHtml(montoTexto)} de tu pedido <strong>#${escaparHtml(datos.id)}</strong> fue rechazado.</p>
    <p style="margin:14px 0 0;"><strong>Motivo:</strong> ${escaparHtml(motivoSeguro)}</p>
    <p style="margin:14px 0 0;">Puedes adjuntar un nuevo comprobante desde “Mis pedidos”.</p>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Comprobante rechazado - Pedido #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      nota: 'Si tienes dudas, responde a este correo o contacta a ChocoBerry.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `El comprobante de tu pedido #${datos.id} fue rechazado.`,
      `Motivo: ${motivoSeguro}`,
      'Puedes adjuntar un nuevo comprobante desde Mis pedidos.',
    ]),
  });
}

export async function enviarPedidoEnPreparacion({ pedido }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'Tu pedido está en preparación';
  const mensaje = `<p style="margin:0;">Tu pedido <strong>#${escaparHtml(datos.id)}</strong> por <strong>${escaparHtml(datos.total)}</strong> ya está en preparación.</p>
    <p style="margin:14px 0 0;">Fecha de entrega estimada: <strong>${escaparHtml(datos.fechaEntrega)}</strong>.</p>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Pedido en preparación - #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      nota: 'Te avisaremos cuando el pedido sea despachado.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `Tu pedido #${datos.id} ya está en preparación.`,
      `Fecha de entrega estimada: ${datos.fechaEntrega}.`,
    ]),
  });
}

export async function enviarPedidoRechazado({ pedido, motivo }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'Tu pedido fue rechazado';
  const motivoSeguro = motivo || 'No especificado';
  const mensaje = `<p style="margin:0;">Tu pedido <strong>#${escaparHtml(datos.id)}</strong> fue rechazado.</p>
    <p style="margin:14px 0 0;"><strong>Motivo:</strong> ${escaparHtml(motivoSeguro)}</p>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Pedido rechazado - #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      nota: 'Si crees que se trata de un error, contacta a ChocoBerry.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `Tu pedido #${datos.id} fue rechazado.`,
      `Motivo: ${motivoSeguro}`,
    ]),
  });
}

export async function enviarPedidoCancelado({ pedido, motivo }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'Tu pedido fue cancelado';
  const motivoSeguro = motivo || 'Sin motivo registrado';
  const mensaje = `<p style="margin:0;">Tu pedido <strong>#${escaparHtml(datos.id)}</strong> fue cancelado.</p>
    <p style="margin:14px 0 0;"><strong>Motivo:</strong> ${escaparHtml(motivoSeguro)}</p>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Pedido cancelado - #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      nota: 'Si tienes dudas, contacta a ChocoBerry.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `Tu pedido #${datos.id} fue cancelado.`,
      `Motivo: ${motivoSeguro}`,
    ]),
  });
}
