import { pool } from "../db.js";

export async function registrarBitacora({
  idUsuario,
  accion,
  ip = null,
  modulo = null,
  detalle = null,
}) {
  await pool.query(
    `INSERT INTO bitacora_acceso (id_usuario, accion, ip_acceso, modulo, detalle)
     VALUES ($1, $2, $3, $4, $5)`,
    [idUsuario, accion, ip, modulo, detalle],
  );
}

export function ipDe(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || null;
}
