import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.id_dependencia, d.nombre_dependencia, d.ubicacion, d.activo, d.fecha_registro,
              COUNT(e.id_empleado)::int AS total_empleados
         FROM dependencia_municipal d
         LEFT JOIN empleado e ON e.id_dependencia = d.id_dependencia
        GROUP BY d.id_dependencia
        ORDER BY d.nombre_dependencia`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/", authorize("configuracion"), async (req, res, next) => {
  try {
    const { nombre_dependencia, ubicacion = null } = req.body;
    if (!nombre_dependencia) {
      return res.status(400).json({ error: "nombre_dependencia es requerido" });
    }
    const { rows } = await pool.query(
      "INSERT INTO dependencia_municipal (nombre_dependencia, ubicacion) VALUES ($1, $2) RETURNING *",
      [nombre_dependencia, ubicacion],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "dependencia_creada",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Alta de dependencia ${nombre_dependencia}`,
    });
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "Ya existe esa dependencia" });
    }
    next(e);
  }
});

router.put("/:id", authorize("configuracion"), async (req, res, next) => {
  try {
    const { nombre_dependencia, ubicacion, activo } = req.body;
    const { rows } = await pool.query(
      `UPDATE dependencia_municipal
          SET nombre_dependencia = COALESCE($1, nombre_dependencia),
              ubicacion = COALESCE($2, ubicacion),
              activo = COALESCE($3, activo)
        WHERE id_dependencia = $4 RETURNING *`,
      [nombre_dependencia ?? null, ubicacion ?? null, activo ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Dependencia no encontrada" });
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "dependencia_editada",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Edición de dependencia ${rows[0].nombre_dependencia}`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;
