import { pool } from "../db.js";

// Servicio compartido de notificaciones. Respeta las preferencias del usuario
// (usuario_preferencia): canal en el sistema y aviso por correo.
// El envío de correo es posterior a la transacción (SMTP pendiente, D-11);
// aquí se devuelve la bandera para que el llamador decida si dispararlo.
export async function enviar({ idUsuario, tipo, titulo, mensaje, referencia = null }) {
  const { rows } = await pool.query(
    `SELECT notif_sistema, notif_correo FROM usuario_preferencia WHERE id_usuario = $1`,
    [idUsuario],
  );
  const p = rows[0] ?? { notif_sistema: true, notif_correo: true };
  const resultado = { sistema: false, correo: Boolean(p.notif_correo) };
  if (p.notif_sistema) {
    await pool.query(
      `INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje, referencia)
       VALUES ($1, $2, $3, $4, $5)`,
      [idUsuario, tipo, titulo, mensaje, referencia],
    );
    resultado.sistema = true;
  }
  return resultado;
}
