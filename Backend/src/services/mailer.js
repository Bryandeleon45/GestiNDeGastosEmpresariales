import nodemailer from "nodemailer";
import "dotenv/config";

const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
const RESEND_API_URL = (process.env.RESEND_API_URL || "https://api.resend.com/emails").trim();
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = (process.env.SMTP_PASS || "").replace(/\s/g, "");
const SMTP_FROM = process.env.SMTP_FROM || "";
const MAIL_FROM =
  (process.env.MAIL_FROM || SMTP_FROM || "").trim() ||
  (SMTP_USER
    ? `Gestion de Proveedores <${SMTP_USER}>`
    : "Gestion de Proveedores <no-reply@munipanajachel.gob.gt>");
const MAIL_TEST_TO = process.env.MAIL_TEST_TO || process.env.SMTP_TEST_TO || "";
const APP_URL = process.env.APP_URL || "http://localhost:8443";

const smtpConfigurado = Boolean(SMTP_USER && SMTP_PASS);

// Resend (API HTTP) tiene prioridad. SMTP queda como respaldo local/desarrollo.
export const proveedorCorreo = RESEND_API_KEY
  ? "resend"
  : smtpConfigurado
    ? "smtp"
    : "desarrollo";

// Si no hay proveedor configurado, el sistema entra en MODO DESARROLLO:
// no envía correos reales y en su lugar imprime el contenido en consola.
export const correoConfigurado = proveedorCorreo !== "desarrollo";

export function logConfiguracionCorreo() {
  if (proveedorCorreo === "resend") {
    console.log(`[mailer] Correo configurado vía Resend (from: ${MAIL_FROM}).`);
    if (!process.env.MAIL_FROM) {
      console.warn(
        "[mailer] MAIL_FROM no está definido; usando remitente por defecto. Configúralo con un dominio verificado en Resend.",
      );
    }
    return;
  }

  if (proveedorCorreo === "smtp") {
    console.warn(
      "[mailer] RESEND_API_KEY no configurada. Se usará SMTP como respaldo; en Render Free los puertos SMTP pueden estar bloqueados.",
    );
    return;
  }

  console.warn(
    "[mailer] ADVERTENCIA: no hay RESEND_API_KEY ni credenciales SMTP. Los correos no se enviarán; solo se imprimirán en consola.",
  );
}

let transporter = null;
function getTransporter() {
  if (!smtpConfigurado) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

// Verifica el proveedor de correo activo (Resend o SMTP) para diagnóstico.
export async function verificarCorreo() {
  if (proveedorCorreo === "resend") {
    return { ok: true, proveedor: "resend", motivo: "configurado" };
  }

  if (proveedorCorreo === "smtp") {
    const t = getTransporter();
    try {
      await t.verify();
      return { ok: true, proveedor: "smtp" };
    } catch (e) {
      return {
        ok: false,
        proveedor: "smtp",
        motivo: e instanceof Error ? e.message : "error_desconocido",
      };
    }
  }

  return { ok: false, proveedor: "desarrollo", motivo: "correo_no_configurado" };
}

// Se mantiene el nombre anterior por compatibilidad con scripts existentes.
export const verificarSMTP = verificarCorreo;

async function enviarConResend({ para, asunto, html, texto, headers }) {
  try {
    const respuesta = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: [para],
        subject: asunto,
        html,
        text: texto,
        headers,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      const motivo =
        data.message || data.error || `resend_http_${respuesta.status}`;
      console.error(`[mailer] Resend rechazó el envío a ${para}: ${motivo}`);
      return { enviado: false, proveedor: "resend", motivo };
    }

    return { enviado: true, proveedor: "resend", id: data.id ?? null };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "error_desconocido";
    console.error(`[mailer] Error de red con Resend para ${para}: ${motivo}`);
    return { enviado: false, proveedor: "resend", motivo };
  }
}

async function enviarConSMTP({ para, asunto, html, texto, headers }) {
  const t = getTransporter();
  if (!t) {
    return { enviado: false, proveedor: "desarrollo", motivo: "smtp_no_configurado" };
  }

  try {
    const info = await t.sendMail({
      from: MAIL_FROM,
      to: para,
      subject: asunto,
      text: texto,
      html,
      headers,
    });
    return { enviado: true, proveedor: "smtp", id: info.messageId ?? null };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "error_desconocido";
    console.error(`[mailer] Error SMTP enviando a ${para}: ${motivo}`);
    return { enviado: false, proveedor: "smtp", motivo };
  }
}

export async function enviarCorreo({ para, asunto, html, texto }) {
  if (!para) {
    return { enviado: false, proveedor: proveedorCorreo, motivo: "destinatario_vacio" };
  }

  // Modo test: redirige todo a MAIL_TEST_TO (o SMTP_TEST_TO) si está definido.
  const destinoFinal = MAIL_TEST_TO || para;
  const headers = MAIL_TEST_TO ? { "X-Original-To": para } : {};

  if (proveedorCorreo === "resend") {
    return enviarConResend({ para: destinoFinal, asunto, html, texto, headers });
  }

  if (proveedorCorreo === "smtp") {
    return enviarConSMTP({ para: destinoFinal, asunto, html, texto, headers });
  }

  console.log("\n================ CORREO (MODO DESARROLLO) ================");
  console.log(`Para:   ${para}${MAIL_TEST_TO ? ` (redirigido a ${destinoFinal})` : ""}`);
  console.log(`Asunto: ${asunto}`);
  console.log(texto || html);
  console.log("==========================================================\n");
  return {
    enviado: false,
    proveedor: "desarrollo",
    motivo: "correo_no_configurado",
  };
}

// Plantilla para códigos de recuperación (ya existente, mantenida)
export async function enviarCodigoRecuperacion({ para, codigo, nombre }) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const asunto = "Tu código de recuperación de contraseña";
  const texto =
    `${saludo}\n\n` +
    `Recibimos una solicitud para restablecer tu contraseña.\n` +
    `Tu código de verificación es: ${codigo}\n\n` +
    `Este código vence en 30 minutos y solo puede usarse una vez.\n` +
    `Si no solicitaste este cambio, ignora este correo.\n\n` +
    `Sistema de Gestión de Proveedores — Municipalidad de Panajachel`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
    <div style="text-align:center;margin-bottom:16px">
      <h2 style="color:#1E5E2F;margin:0">Gestión de Proveedores</h2>
      <p style="color:#6B7280;font-size:13px;margin:4px 0 0">Municipalidad de Panajachel</p>
    </div>
    <div style="border:1px solid #E5E7EB;border-radius:12px;padding:24px">
      <p style="font-size:15px;margin:0 0 12px">${saludo}</p>
      <p style="font-size:14px;color:#374151;margin:0 0 16px">
        Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código de verificación:
      </p>
      <div style="text-align:center;margin:24px 0">
        <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;color:#1E5E2F;background:#EEF6F0;border-radius:12px;padding:14px 22px">
          ${codigo}
        </span>
      </div>
      <p style="font-size:13px;color:#6B7280;margin:0">
        El código vence en <b>30 minutos</b> y solo puede usarse una vez.
      </p>
    </div>
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px;text-align:center">
      Si no solicitaste este cambio, ignora este correo; tu contraseña no será modificada.
    </p>
  </div>`;

  return enviarCorreo({ para, asunto, html, texto });
}

// Plantilla genérica para notificaciones del sistema
export async function enviarNotificacionCorreo({ para, titulo, mensaje, nombre }) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const asunto = titulo;
  const texto =
    `${saludo}\n\n` +
    `${mensaje}\n\n` +
    `Ingrese al sistema para más detalles.\n\n` +
    `Sistema de Gestión de Proveedores — Municipalidad de Panajachel`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
    <div style="text-align:center;margin-bottom:16px">
      <h2 style="color:#1E5E2F;margin:0">Gestión de Proveedores</h2>
      <p style="color:#6B7280;font-size:13px;margin:4px 0 0">Municipalidad de Panajachel</p>
    </div>
    <div style="border:1px solid #E5E7EB;border-radius:12px;padding:24px">
      <p style="font-size:15px;margin:0 0 12px">${saludo}</p>
      <p style="font-size:14px;color:#374151;margin:0 0 16px">
        ${mensaje.replace(/\n/g, "<br>")}
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${APP_URL}" style="display:inline-block;background:#1E5E2F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Ir al sistema
        </a>
      </div>
    </div>
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px;text-align:center">
      Si no esperabas este aviso, puede ignorarlo.
    </p>
  </div>`;

  return enviarCorreo({ para, asunto, html, texto });
}

// Plantilla para envío de credenciales (nuevo usuario / proveedor)
export async function enviarCredencialesCorreo({ para, nombre, usuario, clave }) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const asunto = "Tus credenciales de acceso — Sistema de Gestión de Proveedores";
  const texto =
    `${saludo}\n\n` +
    `Se ha creado tu cuenta en el Sistema de Gestión de Proveedores de la Municipalidad de Panajachel.\n\n` +
    `Usuario: ${usuario}\n` +
    `Contraseña temporal: ${clave}\n\n` +
    `Por seguridad, deberás cambiar tu contraseña al primer ingreso.\n\n` +
    `Ingresa en: ${APP_URL}\n\n` +
    `Sistema de Gestión de Proveedores — Municipalidad de Panajachel`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111827">
    <div style="text-align:center;margin-bottom:16px">
      <h2 style="color:#1E5E2F;margin:0">Gestión de Proveedores</h2>
      <p style="color:#6B7280;font-size:13px;margin:4px 0 0">Municipalidad de Panajachel</p>
    </div>
    <div style="border:1px solid #E5E7EB;border-radius:12px;padding:24px">
      <p style="font-size:15px;margin:0 0 12px">${saludo}</p>
      <p style="font-size:14px;color:#374151;margin:0 0 16px">
        Se ha creado tu cuenta en el Sistema de Gestión de Proveedores de la Municipalidad de Panajachel.
      </p>
      <div style="background:#F3F4F6;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0 0 8px;font-size:14px;color:#374151"><b>Usuario:</b> ${usuario}</p>
        <p style="margin:0;font-size:14px;color:#374151"><b>Contraseña temporal:</b> ${clave}</p>
      </div>
      <p style="font-size:13px;color:#DC2626;margin:0 0 16px">
        <b>Por seguridad, deberás cambiar tu contraseña al primer ingreso.</b>
      </p>
      <div style="text-align:center;margin:24px 0">
        <a href="${APP_URL}" style="display:inline-block;background:#1E5E2F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          Ir al sistema
        </a>
      </div>
    </div>
    <p style="font-size:12px;color:#9CA3AF;margin-top:16px;text-align:center">
      Si no solicitaste esta cuenta, contacta al administrador del sistema.
    </p>
  </div>`;

  return enviarCorreo({ para, asunto, html, texto });
}