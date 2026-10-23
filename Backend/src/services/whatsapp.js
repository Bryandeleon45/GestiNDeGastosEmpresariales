import "dotenv/config";

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || "";
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";

// Si no hay credenciales de la API, el sistema entra en MODO DESARROLLO:
// no envía mensajes reales y en su lugar imprime el contenido en la consola.
export const whatsappConfigurado = Boolean(WHATSAPP_API_TOKEN && WHATSAPP_PHONE_ID);

// Normaliza un número de 8 dígitos (Guatemala) a formato internacional.
// Acepta espacios y guiones; devuelve "+502XXXXXXXX" o null si es inválido.
export function normalizarTelefono(telefono) {
  const digitos = String(telefono ?? "").replace(/\D/g, "");
  if (digitos.length !== 8) return null;
  return `+502${digitos}`;
}

export async function enviarMensaje({ telefono, texto }) {
  const destino = normalizarTelefono(telefono);

  if (!whatsappConfigurado) {
    console.log("\n================ WHATSAPP (MODO DESARROLLO) ================");
    console.log(`Para:   ${destino ?? telefono}`);
    console.log(texto);
    console.log("============================================================\n");
    return { enviado: false, motivo: "whatsapp_no_configurado" };
  }

  if (!destino) {
    return { enviado: false, motivo: "telefono_invalido" };
  }

  const r = await fetch(
    `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: destino.replace("+", ""),
        type: "text",
        text: { preview_url: false, body: texto },
      }),
    },
  );
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    console.error("WhatsApp API error:", JSON.stringify(err, null, 2));
    throw new Error(err?.error?.message || `WhatsApp API ${r.status}`);
  }
  return { enviado: true };
}

export async function enviarCodigoRecuperacion({ telefono, codigo, nombre }) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const texto =
    `${saludo}\n\n` +
    `Recibimos una solicitud para restablecer tu contraseña.\n` +
    `Tu código de verificación es: ${codigo}\n\n` +
    `Este código vence en 30 minutos y solo puede usarse una vez.\n` +
    `Si no solicitaste este cambio, ignora este mensaje.\n\n` +
    `Sistema de Gestión de Proveedores — Municipalidad de Panajachel`;

  return enviarMensaje({ telefono, texto });
}
