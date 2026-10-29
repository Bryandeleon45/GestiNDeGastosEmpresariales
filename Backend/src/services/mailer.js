import nodemailer from "nodemailer";
import "dotenv/config";

const BREVO_API_KEY = (process.env.BREVO_API_KEY || "").trim();
const BREVO_API_URL = (process.env.BREVO_API_URL || "https://api.brevo.com/v3/smtp/email").trim();
const MAIL_FROM_EMAIL = (process.env.MAIL_FROM_EMAIL || "").trim();
const MAIL_FROM_NAME = (process.env.MAIL_FROM_NAME || "Gestion de Proveedores").trim();
const GMAIL_USER = (process.env.GMAIL_USER || "").trim();
const GMAIL_PASS = (process.env.GMAIL_PASS || "").trim();
const APP_URL = process.env.APP_URL || "http://localhost:8443";

const brevoConfigurado = Boolean(BREVO_API_KEY && MAIL_FROM_EMAIL);
const gmailConfigurado = Boolean(GMAIL_USER && GMAIL_PASS);

// Brevo (API HTTP, puerto 443) tiene prioridad: funciona en Render Free.
// Gmail/Nodemailer queda solo como respaldo local/desarrollo.
export const proveedorCorreo = brevoConfigurado
  ? "brevo"
  : gmailConfigurado
    ? "gmail"
    : "desarrollo";

// Si no hay proveedor configurado, el sistema entra en MODO DESARROLLO:
// no envía correos reales y en su lugar imprime el contenido en consola.
export const correoConfigurado = proveedorCorreo !== "desarrollo";

export function logConfiguracionCorreo() {
  if (proveedorCorreo === "brevo") {
    console.log(`[mailer] Correo configurado vía Brevo (from: ${MAIL_FROM_NAME} <${MAIL_FROM_EMAIL}>).`);
    return;
  }

  if (proveedorCorreo === "gmail") {
    console.warn(
      "[mailer] BREVO_API_KEY/MAIL_FROM_EMAIL no configurados; usando Gmail/Nodemailer como respaldo (no usar en Render Free).",
    );
    return;
  }

  console.warn(
    "[mailer] ADVERTENCIA: no hay BREVO_API_KEY/MAIL_FROM_EMAIL ni GMAIL_USER/GMAIL_PASS. Los correos no se enviarán; solo se imprimirán en consola.",
  );
}

let transporter = null;
function getTransporter() {
  if (!gmailConfigurado) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
  }
  return transporter;
}

// Verifica el proveedor de correo activo para diagnóstico.
export async function verificarCorreo() {
  if (proveedorCorreo === "brevo") {
    // Muchas API keys de Brevo se crean con permiso solo de "envío", por lo que
    // GET /account puede responder 403/401 aunque la key sea válida para enviar.
    // Por eso aquí solo confirmamos que la key esté presente y validamos el envío
    // con scripts/test-mail.mjs.
    return { ok: true, proveedor: "brevo", motivo: "configurado" };
  }

  if (proveedorCorreo === "gmail") {
    const t = getTransporter();
    try {
      await t.verify();
      return { ok: true, proveedor: "gmail" };
    } catch (e) {
      return {
        ok: false,
        proveedor: "gmail",
        motivo: e instanceof Error ? e.message : "error_desconocido",
      };
    }
  }

  return { ok: false, proveedor: "desarrollo", motivo: "correo_no_configurado" };
}

// Se mantiene el nombre anterior por compatibilidad con scripts existentes.
export const verificarSMTP = verificarCorreo;

async function enviarConBrevo({ para, asunto, html, texto }) {
  try {
    const respuesta = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL },
        to: [{ email: para }],
        subject: asunto,
        htmlContent: html,
        textContent: texto,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      const motivo = data.message || data.error || `brevo_http_${respuesta.status}`;
      console.error(`[mailer] Brevo rechazó el envío a ${para}: ${motivo}`);
      return { enviado: false, proveedor: "brevo", motivo };
    }

    return { enviado: true, proveedor: "brevo", id: data.messageId ?? null };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "error_desconocido";
    console.error(`[mailer] Error de red con Brevo para ${para}: ${motivo}`);
    return { enviado: false, proveedor: "brevo", motivo };
  }
}

async function enviarConGmail({ para, asunto, html, texto }) {
  const t = getTransporter();
  if (!t) {
    return { enviado: false, proveedor: "desarrollo", motivo: "gmail_no_configurado" };
  }

  try {
    const info = await t.sendMail({
      from: `${MAIL_FROM_NAME} <${GMAIL_USER}>`,
      to: para,
      subject: asunto,
      text: texto,
      html,
    });
    return { enviado: true, proveedor: "gmail", id: info.messageId ?? null };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : "error_desconocido";
    console.error(`[mailer] Error Gmail enviando a ${para}: ${motivo}`);
    return { enviado: false, proveedor: "gmail", motivo };
  }
}

export async function enviarCorreo({ para, asunto, html, texto }) {
  if (!para) {
    return { enviado: false, proveedor: proveedorCorreo, motivo: "destinatario_vacio" };
  }

  if (proveedorCorreo === "brevo") {
    return enviarConBrevo({ para, asunto, html, texto });
  }

  if (proveedorCorreo === "gmail") {
    return enviarConGmail({ para, asunto, html, texto });
  }

  console.log("\n================ CORREO (MODO DESARROLLO) ================");
  console.log(`Para:   ${para}`);
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