import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize("roles"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id_rol, r.descripcion, r.nombre_rol, r.activo, r.fecha_registro,
              COUNT(u.id_usuario)::int AS total_usuarios
         FROM rol r
         LEFT JOIN usuario u ON u.id_rol = r.id_rol
        GROUP BY r.id_rol
        ORDER BY r.id_rol`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/", authorize("roles"), async (req, res, next) => {
  try {
    const { descripcion, nombre_rol = null } = req.body;
    if (!descripcion) return res.status(400).json({ error: "descripcion es requerido" });
    const { rows } = await pool.query(
      "INSERT INTO rol (descripcion, nombre_rol) VALUES ($1, $2) RETURNING *",
      [descripcion, nombre_rol ?? descripcion],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "rol_creado",
      ip: ipDe(req),
      modulo: "Roles",
      detalle: `Alta del rol ${descripcion}`,
    });
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Ya existe un rol con esa descripción" });
    }
    next(e);
  }
});

router.put("/:id", authorize("roles"), async (req, res, next) => {
  try {
    const { descripcion, nombre_rol, activo } = req.body;
    const { rows } = await pool.query(
      `UPDATE rol
          SET descripcion = COALESCE($1, descripcion),
              nombre_rol = COALESCE($2, nombre_rol),
              activo = COALESCE($3, activo)
        WHERE id_rol = $4 RETURNING *`,
      [descripcion ?? null, nombre_rol ?? null, activo ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Rol no encontrado" });
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "rol_editado",
      ip: ipDe(req),
      modulo: "Roles",
      detalle: `Edición del rol ${rows[0].descripcion}`,
    });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Ya existe un rol con esa descripción" });
    }
    next(e);
  }
});

// Matriz de permisos del rol: todos los submenús con un flag "permitido".
router.get("/:id/permisos", authorize("roles"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id_menu, m.nombre AS menu,
              s.id_submenu, s.nombre AS submenu, s.controlador,
              (p.id_permiso IS NOT NULL) AS permitido
         FROM menu m
         JOIN submenu s ON s.id_menu = m.id_menu
         LEFT JOIN permiso p ON p.id_submenu = s.id_submenu AND p.id_rol = $1
        WHERE m.activo AND s.activo
        ORDER BY m.id_menu, s.id_submenu`,
      [req.params.id],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Guardar matriz de permisos del rol (reemplaza los permisos actuales).
router.put("/:id/permisos", authorize("roles"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { submenus = [] } = req.body;
    await client.query("BEGIN");

    // Desactiva los permisos existentes (no se borran para preservar trazabilidad).
    await client.query(
      "UPDATE permiso SET activo = FALSE WHERE id_rol = $1",
      [req.params.id],
    );

    for (const idSubmenu of submenus) {
      await client.query(
        `INSERT INTO permiso (id_rol, id_submenu, activo)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (id_rol, id_submenu) DO UPDATE SET activo = TRUE`,
        [req.params.id, idSubmenu],
      );
    }

    await client.query("COMMIT");
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "permisos_actualizados",
      ip: ipDe(req),
      modulo: "Roles",
      detalle: `Permisos actualizados para el rol ${req.params.id} (${submenus.length} submenús)`,
    });
    res.json({ ok: true, submenus });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

export default router;
