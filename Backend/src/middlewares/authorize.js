import { pool } from "../db.js";

// authorize(controlador): valida que el rol del usuario tenga un permiso activo
// sobre un submenú cuyo controlador coincide con el solicitado.
export function authorize(controlador) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autorizado" });
      }
      if (req.user.rol_activo === false) {
        return res.status(403).json({ error: "El rol no está activo" });
      }

      const { rows } = await pool.query(
        `SELECT 1
           FROM permiso p
           JOIN submenu s ON s.id_submenu = p.id_submenu
          WHERE p.id_rol = $1 AND s.controlador = $2
            AND p.activo AND s.activo
          LIMIT 1`,
        [req.user.id_rol, controlador],
      );
      if (!rows[0]) {
        return res.status(403).json({
          error: "Sin permiso para esta acción",
        });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
