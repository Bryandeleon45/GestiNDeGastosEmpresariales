import nodemailer from "nodemailer";
import "dotenv/config";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = (process.env.SMTP_PASS || "").replace(/\s/g, "");
const SMTP_FROM =
  process.env.SMTP_FROM ||
  (SMTP_USER ? `Gestion de Proveedores <${SMTP_USER}>` : "Gestion de Proveedores <no-reply@munipanajachel.gob.gt>");
const SMTP_TEST_TO = process.env.SMTP_TEST_TO || "";

// Si no hay credenciales, el sistema entra en MODO DESARROLLO: no envía correos
// reales y en su lugar imprime el contenido en la consola del backend.
export const correoConfigurado = Boolean(SMTP_USER && SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (!correoConfigurado) return null;
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

// Verifica la conexión SMTP (útil para diagnóstico al arrancar o en test-mail)
export async function verificarSMTP() {
  const t = getTransporter();
  if (!t) return { ok: false, motivo: "smtp_no_configurado" };
  try {
    await t.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, motivo: e instanceof Error ? e.message : "error_desconocido" };
  }
}

export async function enviarCorreo({ para, asunto, html, texto }) {
  const t = getTransporter();

  // Modo test: redirige todo a SMTP_TEST_TO si está definido
  const destinoFinal = SMTP_TEST_TO ? SMTP_TEST_TO : para;
  const headers = SMTP_TEST_TO ? { "X-Original-To": para } : {};

  if (!t) {
    console.log("\n================ CORREO (MODO DESARROLLO) ================");
    console.log(`Para:   ${para}${SMTP_TEST_TO ? ` (redirigido a ${destinoFinal})` : ""}`);
    console.log(`Asunto: ${asunto}`);
    console.log(texto || html);
    console.log("==========================================================\n");
    return { enviado: false, motivo: "smtp_no_configurado" };
  }
  await t.sendMail({
    from: SMTP_FROM,
    to: destinoFinal,
    subject: asunto,
    text: texto,
    html,
    headers,
  });
  return { enviado: true };
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
        <a href="http://localhost:8443" style="display:inline-block;background:#1E5E2F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
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
    `Ingresa en: http://localhost:8443\n\n` +
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
        <a href="http://localhost:8443" style="display:inline-block;background:#1E5E2F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
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