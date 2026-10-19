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
      [idUsuario, tipo, titulo.slice(0, 100), mensaje, referencia],
    );
    resultado.sistema = true;
  }
  return resultado;
}

// Usuarios activos con permiso sobre algún submenú (controlador). Es la forma
// de dirigir una alerta al módulo que la procesa: ["bodega"], ["facturacion"], etc.
export async function usuariosPorModulo(controladores) {
  const { rows } = await pool.query(
    `SELECT DISTINCT u.id_usuario
       FROM usuario u
       JOIN permiso p ON p.id_rol = u.id_rol AND p.activo = TRUE
       JOIN submenu s ON s.id_submenu = p.id_submenu
      WHERE u.activo = TRUE AND s.controlador = ANY($1)`,
    [controladores],
  );
  return rows.map((r) => r.id_usuario);
}

// Usuario activo principal de un proveedor (su acceso al portal). Devuelve
// null si el proveedor no tiene usuarios vinculados o todos están inactivos.
export async function usuarioDeProveedor(idProveedor) {
  const { rows } = await pool.query(
    `SELECT pu.id_usuario
       FROM proveedor_usuario pu
       JOIN usuario u ON u.id_usuario = pu.id_usuario
      WHERE pu.id_proveedor = $1 AND u.activo = TRUE
      ORDER BY pu.es_principal DESC
      LIMIT 1`,
    [idProveedor],
  );
  return rows[0]?.id_usuario ?? null;
}

// Envío en bloque a una lista de usuarios. Con `ventanaHoras > 0` no repite una
// notificación con el mismo tipo y referencia dentro de esa ventana (evita el
// spam de las alertas periódicas cuando el usuario ya la leyó).
export async function enviarA({
  ids = [],
  tipo,
  titulo,
  mensaje,
  referencia = null,
  excluir = [],
  ventanaHoras = 0,
}) {
  const destinos = [...new Set(ids)].filter((id) => !excluir.includes(id));
  if (!destinos.length) return 0;
  let enviadas = 0;
  for (const idUsuario of destinos) {
    if (ventanaHoras > 0) {
      const { rows } = await pool.query(
        `SELECT 1 FROM notificacion
          WHERE id_usuario = $1 AND tipo = $2
            AND COALESCE(referencia, '') = COALESCE($3, '')
            AND fecha > now() - ($4 * interval '1 hour')
          LIMIT 1`,
        [idUsuario, tipo, referencia, ventanaHoras],
      );
      if (rows[0]) continue;
    }
    const r = await enviar({ idUsuario, tipo, titulo, mensaje, referencia });
    if (r.sistema) enviadas += 1;
  }
  return enviadas;
}
