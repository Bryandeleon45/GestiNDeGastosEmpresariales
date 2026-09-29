import { verificarToken } from "../utils/jwt.js";
import { pool } from "../db.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "No autorizado" });
    }

    let payload;
    try {
      payload = verificarToken(token);
    } catch {
      return res.status(401).json({ error: "Sesión inválida o expirada" });
    }

    const { rows } = await pool.query(
      `SELECT u.id_usuario, u.nombre_usuario, u.correo, u.activo, u.bloqueado_hasta,
              u.id_rol, r.descripcion AS rol, r.activo AS rol_activo,
              e.nombre, e.apellido
         FROM usuario u
         JOIN rol r ON r.id_rol = u.id_rol
         JOIN empleado e ON e.id_empleado = u.id_empleado
        WHERE u.id_usuario = $1`,
      [payload.sub],
    );
    const user = rows[0];
    if (!user || !user.activo) {
      return res.status(401).json({ error: "Usuario inactivo o inexistente" });
    }
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      return res.status(403).json({ error: "Cuenta bloqueada temporalmente" });
    }

    req.user = {
      id_usuario: user.id_usuario,
      nombre_usuario: user.nombre_usuario,
      correo: user.correo,
      id_rol: user.id_rol,
      rol: user.rol,
      rol_activo: user.rol_activo,
      nombre_completo: `${user.nombre} ${user.apellido}`,
    };
    next();
  } catch (e) {
    next(e);
  }
}
