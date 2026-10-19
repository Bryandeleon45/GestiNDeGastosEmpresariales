import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.use(authenticate);

// ── Notificaciones del usuario autenticado (campana superior) ─────────────────
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_notificacion, tipo, titulo, mensaje, referencia, leida, fecha
         FROM notificacion
        WHERE id_usuario = $1
        ORDER BY fecha DESC
        LIMIT 100`,
      [req.user.id_usuario],
    );
    const { rows: c } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE NOT leida)::int AS no_leidas
         FROM notificacion
        WHERE id_usuario = $1`,
      [req.user.id_usuario],
    );
    res.json({ data: rows, total: c[0].total, no_leidas: c[0].no_leidas });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/leida", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notificacion SET leida = TRUE
        WHERE id_notificacion = $1 AND id_usuario = $2
        RETURNING id_notificacion, leida`,
      [Number(req.params.id) || 0, req.user.id_usuario],
    );
    if (!rows[0]) return res.status(404).json({ error: "Notificación no encontrada" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.post("/leer-todas", async (req, res, next) => {
  try {
    const r = await pool.query(
      "UPDATE notificacion SET leida = TRUE WHERE id_usuario = $1 AND NOT leida",
      [req.user.id_usuario],
    );
    res.json({ actualizadas: r.rowCount });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const r = await pool.query(
      "DELETE FROM notificacion WHERE id_notificacion = $1 AND id_usuario = $2",
      [Number(req.params.id) || 0, req.user.id_usuario],
    );
    if (!r.rowCount) return res.status(404).json({ error: "Notificación no encontrada" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
