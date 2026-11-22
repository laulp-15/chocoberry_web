// src/services/emailService.js
// Envío de correos transaccionales con Brevo (SMTP o API HTTP). El envío nunca
// debe bloquear la operación principal: los services llaman estas funciones
// sin esperarlas y aquí se capturan los errores para no romper la petición.
import nodemailer from 'nodemailer';
import env from '../config/env.js';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_TIMEOUT_MS = 10_000;
const LOGO_RUTA = '/img/Logo/chocoberry_blanco.png';

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

/** Acepta "Nombre <correo@dominio.com>" o "correo@dominio.com". */
function parsearRemitente(valor) {
  const texto = String(valor ?? '').trim();
  if (!texto) return { email: '', name: '' };

  const coincidencia = texto.match(/^(.*)<([^>]+)>$/);
  if (!coincidencia) return { email: texto, name: '' };

  return {
    email: coincidencia[2].trim(),
    name: coincidencia[1].trim().replace(/^["']|["']$/g, ''),
  };
}

function plantilla({ titulo, saludo, mensaje, boton, enlace, nota }) {
  const logoUrl = urlFrontend(LOGO_RUTA);
  const contenidoBoton = boton
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:30px 0 8px;">
         <tr>
           <td align="center" bgcolor="#7b2d26" style="border-radius:999px;background-color:#7b2d26;background-image:linear-gradient(135deg,#7b2d26,#a3394a);box-shadow:0 6px 16px rgba(123,45,38,.28);">
             <a href="${escaparHtml(enlace)}"
                style="display:inline-block;padding:15px 34px;border-radius:999px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:.3px;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
               ${escaparHtml(boton)}
             </a>
           </td>
         </tr>
       </table>
       <p style="margin:18px 0 0;font-size:12.5px;line-height:1.6;color:#8a7772;word-break:break-all;">
         Si el botón no funciona, copia este enlace en tu navegador:<br />
         <a href="${escaparHtml(enlace)}" style="color:#7b2d26;text-decoration:underline;">${escaparHtml(enlace)}</a>
       </p>`
    : '';

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escaparHtml(titulo)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6ece8;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#3d2b28;-webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6ece8;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #ecd8d1;box-shadow:0 10px 30px rgba(123,45,38,.10);">
            <tr>
              <td align="center" bgcolor="#fff8f5" style="background-color:#fff8f5;padding:28px 32px 22px;text-align:center;">
                <img src="${escaparHtml(logoUrl)}" alt="ChocoBerry" width="180"
                     style="display:block;margin:0 auto;width:180px;max-width:60%;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="height:5px;line-height:5px;font-size:0;background:#e8b4a8;background-image:linear-gradient(90deg,#7b2d26,#d9788a,#7b2d26);">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 34px 16px;">
                <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;font-weight:800;color:#5a1d18;">${escaparHtml(titulo)}</h1>
                <p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#3d2b28;font-weight:600;">${escaparHtml(saludo)}</p>
                <div style="font-size:15px;line-height:1.7;color:#4a3733;">${mensaje}</div>
                ${contenidoBoton}
                ${nota ? `<div style="margin:26px 0 0;padding:14px 16px;background:#fbf3f0;border-radius:12px;font-size:13px;line-height:1.6;color:#6b5a57;">${nota}</div>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 34px 28px;font-size:12px;line-height:1.6;color:#8a7772;text-align:center;border-top:1px solid #f0e3df;background:#fffaf8;">
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

async function enviarPorSmtp({ to, subject, html, text }) {
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

async function enviarPorBrevoApi({ to, subject, html, text }) {
  const remitente = parsearRemitente(env.mail.from);

  if (!env.mail.brevoApiKey || !remitente.email) {
    // eslint-disable-next-line no-console
    console.warn(
      '[email] BREVO_API_KEY o MAIL_FROM no están configurados; no se envió el correo.'
    );
    return { omitido: true };
  }

  const cuerpo = {
    sender: {
      email: remitente.email,
      ...(remitente.name ? { name: remitente.name } : {}),
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  };

  try {
    const respuesta = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': env.mail.brevoApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(BREVO_TIMEOUT_MS),
    });

    if (!respuesta.ok) {
      // No se registra el cuerpo de la respuesta por si contiene datos del
      // remitente o del destinatario.
      // eslint-disable-next-line no-console
      console.error(
        `[email] Brevo respondió ${respuesta.status}; no se envió "${subject}".`
      );
      return { error: true, status: respuesta.status };
    }

    return { ok: true, status: respuesta.status };
  } catch (error) {
    // Nunca se registra el token, la contraseña, la API key ni el cuerpo.
    // eslint-disable-next-line no-console
    console.error(`[email] No se pudo enviar "${subject}" con Brevo: ${error.message}`);
    return { error: true };
  }
}

async function enviar({ to, subject, html, text }) {
  if (!to) return { omitido: true };

  if (env.nodeEnv === 'test') {
    return { omitido: true };
  }

  if (env.mail.provider === 'brevo-api') {
    return enviarPorBrevoApi({ to, subject, html, text });
  }

  if (env.mail.provider !== 'smtp') {
    // eslint-disable-next-line no-console
    console.warn(
      `[email] MAIL_PROVIDER "${env.mail.provider}" no es válido; no se envió el correo.`
    );
    return { omitido: true };
  }

  return enviarPorSmtp({ to, subject, html, text });
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
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. El enlace estará disponible durante <strong style="color:#7b2d26;">1 hora</strong>.</p>`;

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
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Tu cuenta de ChocoBerry ya fue creada. Para empezar a usarla, establece tu contraseña desde el siguiente enlace. El enlace estará disponible durante <strong style="color:#7b2d26;">48 horas</strong>.</p>`;

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

export async function enviarPedidoRecibido({ pedido }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'Pedido recibido';
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Hemos recibido tu pedido <strong style="color:#7b2d26;">#${escaparHtml(datos.id)}</strong> correctamente. Revisaremos tu comprobante de pago para continuar con el proceso.</p>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Recibimos tu pedido - Pedido #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      boton: 'Ver mi pedido',
      enlace: urlFrontend('/users/orders'),
      nota: 'Te avisaremos por correo cuando verifiquemos tu comprobante. También puedes consultar el estado en “Mis pedidos”.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `Hemos recibido tu pedido #${datos.id} correctamente. Revisaremos tu comprobante de pago para continuar con el proceso.`,
      urlFrontend('/users/orders'),
    ]),
  });
}

export async function enviarComprobanteAprobado({ pedido, monto, saldo }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const saldoPendiente = Number(saldo ?? 0);

  if (!(saldoPendiente > 0)) {
    const titulo = 'Tu pago está completo';
    const mensaje = '<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Tu pago está completo. Pronto empezaremos con la preparación de tu pedido.</p>';

    return enviar({
      to: correoCliente(pedido),
      subject: `Pago completo - Pedido #${datos.id}`,
      html: plantilla({
        titulo,
        saludo: `Hola, ${nombreCliente(pedido)}.`,
        mensaje,
        boton: 'Ver mi pedido',
        enlace: urlFrontend('/users/orders'),
        nota: 'Te avisaremos por correo cuando tu pedido esté en camino.',
      }),
      text: textoPlano([
        titulo,
        `Hola, ${nombreCliente(pedido)}.`,
        'Tu pago está completo. Pronto empezaremos con la preparación de tu pedido.',
        urlFrontend('/users/orders'),
      ]),
    });
  }

  const titulo = 'Recibimos tu pago';
  const montoPagado = formatearMoneda(monto);
  const saldoFormateado = formatearMoneda(saldoPendiente);
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Recibimos tu pago de <strong style="color:#7b2d26;">${escaparHtml(montoPagado)}</strong> para tu pedido <strong style="color:#7b2d26;">#${escaparHtml(datos.id)}</strong>. Falta <strong style="color:#7b2d26;">${escaparHtml(saldoFormateado)}</strong> para completar tu pedido.</p>
    <p style="margin:16px 0 0;font-size:15px;line-height:1.7;color:#4a3733;">Sube el comprobante del saldo restante lo antes posible, antes de la fecha de entrega.</p>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Recibimos tu pago - Pedido #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      boton: 'Subir comprobante del saldo',
      enlace: urlFrontend('/users/orders'),
      nota: 'Puedes subir el comprobante del saldo restante desde “Mis pedidos”.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `Recibimos tu pago de ${montoPagado} para tu pedido #${datos.id}. Falta ${saldoFormateado} para completar tu pedido.`,
      'Sube el comprobante del saldo restante lo antes posible, antes de la fecha de entrega.',
      urlFrontend('/users/orders'),
    ]),
  });
}

export async function enviarComprobanteDevuelto({ pedido, motivo }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'No pudimos verificar tu comprobante';
  const motivoSeguro = motivo || 'No especificado';
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">No pudimos verificar tu comprobante del pedido <strong style="color:#7b2d26;">#${escaparHtml(datos.id)}</strong>.</p>
    <div style="margin:18px 0 0;padding:14px 16px;background:#fbf1ee;border-left:4px solid #7b2d26;border-radius:8px;font-size:14px;line-height:1.6;color:#4a3733;"><strong style="color:#7b2d26;">Motivo:</strong> ${escaparHtml(motivoSeguro)}</div>`;

  return enviar({
    to: correoCliente(pedido),
    subject: `Comprobante devuelto - Pedido #${datos.id}`,
    html: plantilla({
      titulo,
      saludo: `Hola, ${nombreCliente(pedido)}.`,
      mensaje,
      boton: 'Subir un nuevo comprobante',
      enlace: urlFrontend('/users/orders'),
      nota: 'Puedes adjuntar un nuevo comprobante desde “Mis pedidos”. Si tienes dudas, responde a este correo.',
    }),
    text: textoPlano([
      titulo,
      `Hola, ${nombreCliente(pedido)}.`,
      `No pudimos verificar tu comprobante del pedido #${datos.id}.`,
      `Motivo: ${motivoSeguro}`,
      'Puedes adjuntar un nuevo comprobante desde Mis pedidos.',
      urlFrontend('/users/orders'),
    ]),
  });
}

export async function enviarPedidoEnPreparacion({ pedido }) {
  if (!pedido) return { omitido: true };
  const datos = datosPedido(pedido);
  const titulo = 'Tu pedido está en preparación';
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Tu pedido <strong style="color:#7b2d26;">#${escaparHtml(datos.id)}</strong> por <strong style="color:#7b2d26;">${escaparHtml(datos.total)}</strong> ya está en preparación.</p>
    <div style="margin:18px 0 0;padding:14px 16px;background:#fbf1ee;border-left:4px solid #7b2d26;border-radius:8px;font-size:14px;line-height:1.6;color:#4a3733;">Fecha de entrega estimada: <strong style="color:#7b2d26;">${escaparHtml(datos.fechaEntrega)}</strong>.</div>`;

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
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Tu pedido <strong style="color:#7b2d26;">#${escaparHtml(datos.id)}</strong> fue rechazado.</p>
    <div style="margin:18px 0 0;padding:14px 16px;background:#fbf1ee;border-left:4px solid #7b2d26;border-radius:8px;font-size:14px;line-height:1.6;color:#4a3733;"><strong style="color:#7b2d26;">Motivo:</strong> ${escaparHtml(motivoSeguro)}</div>`;

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
  const mensaje = `<p style="margin:0;font-size:15px;line-height:1.7;color:#4a3733;">Tu pedido <strong style="color:#7b2d26;">#${escaparHtml(datos.id)}</strong> fue cancelado.</p>
    <div style="margin:18px 0 0;padding:14px 16px;background:#fbf1ee;border-left:4px solid #7b2d26;border-radius:8px;font-size:14px;line-height:1.6;color:#4a3733;"><strong style="color:#7b2d26;">Motivo:</strong> ${escaparHtml(motivoSeguro)}</div>`;

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