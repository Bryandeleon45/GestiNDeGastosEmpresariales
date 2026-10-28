import {
  logConfiguracionCorreo,
  proveedorCorreo,
  verificarCorreo,
  enviarCorreo,
  enviarCodigoRecuperacion,
  enviarNotificacionCorreo,
  enviarCredencialesCorreo,
  correoConfigurado,
} from "../src/services/mailer.js";

async function main() {
  console.log("=== Test de correo ===");
  logConfiguracionCorreo();
  console.log("proveedorCorreo =", proveedorCorreo);
  console.log("correoConfigurado =", correoConfigurado);
  console.log("");

  if (!correoConfigurado) {
    console.log("Correo no configurado (RESEND_API_KEY o SMTP_USER/SMTP_PASS vacíos).");
    console.log("Rellena .env y vuelve a ejecutar.");
    process.exit(0);
  }

  const destino = process.argv[2] || "brayandanilo938@gmail.com";
  console.log(`Destino de prueba: ${destino}`);
  console.log("");

  // 1) Verificar proveedor activo
  console.log(`1) Verificando proveedor de correo (${proveedorCorreo})...`);
  const v = await verificarCorreo();
  console.log("   Resultado:", v.ok ? "✓ Proveedor OK" : `✗ ${v.motivo}`);
  if (!v.ok) process.exit(1);
  console.log("");

  // 2) Enviar correo de prueba simple
  console.log("2) Enviando correo de prueba simple...");
  const r1 = await enviarCorreo({
    para: destino,
    asunto: "Prueba de correo — Gestión de Proveedores",
    texto: "Este es un correo de prueba del sistema.",
    html: "<p>Este es un <b>correo de prueba</b> del sistema.</p>",
  });
  console.log("   Resultado:", r1.enviado ? "✓ Enviado" : `✗ ${r1.motivo}`);
  console.log("");

  // 3) Probar plantilla código recuperación
  console.log("3) Probando plantilla código de recuperación...");
  const r2 = await enviarCodigoRecuperacion({
    para: destino,
    codigo: "482913",
    nombre: "Usuario Prueba",
  });
  console.log("   Resultado:", r2.enviado ? "✓ Enviado" : `✗ ${r2.motivo}`);
  console.log("");

  // 4) Probar plantilla notificación
  console.log("4) Probando plantilla notificación del sistema...");
  const r3 = await enviarNotificacionCorreo({
    para: destino,
    titulo: "Nueva solicitud REQ-001",
    mensaje: "Se ha registrado una nueva solicitud de compra por Q 15,000.00. Pendiente de revisión.",
    nombre: "Usuario Prueba",
  });
  console.log("   Resultado:", r3.enviado ? "✓ Enviado" : `✗ ${r3.motivo}`);
  console.log("");

  // 5) Probar plantilla credenciales
  console.log("5) Probando plantilla credenciales...");
  const r4 = await enviarCredencialesCorreo({
    para: destino,
    nombre: "Usuario Prueba",
    usuario: "usuario.prueba",
    clave: "Abc12345",
  });
  console.log("   Resultado:", r4.enviado ? "✓ Enviado" : `✗ ${r4.motivo}`);
  console.log("");

  console.log("=== Test completado ===");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});