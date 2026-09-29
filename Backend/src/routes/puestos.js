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
      `SELECT p.id_puesto, p.descripcion, p.salario_base, p.activo,
              COUNT(e.id_empleado)::int AS total_empleados
         FROM puesto p
         LEFT JOIN empleado e ON e.id_puesto = p.id_puesto
        GROUP BY p.id_puesto
        ORDER BY p.descripcion`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/", authorize("configuracion"), async (req, res, next) => {
  try {
    const { descripcion, salario_base = null } = req.body;
    if (!descripcion) return res.status(400).json({ error: "descripcion es requerido" });
    const { rows } = await pool.query(
      "INSERT INTO puesto (descripcion, salario_base) VALUES ($1, $2) RETURNING *",
      [descripcion, salario_base],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "puesto_creado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Alta de puesto ${descripcion}`,
    });
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe ese puesto" });
    next(e);
  }
});

router.put("/:id", authorize("configuracion"), async (req, res, next) => {
  try {
    const { descripcion, salario_base, activo } = req.body;
    const { rows } = await pool.query(
      `UPDATE puesto
          SET descripcion = COALESCE($1, descripcion),
              salario_base = COALESCE($2, salario_base),
              activo = COALESCE($3, activo)
        WHERE id_puesto = $4 RETURNING *`,
      [descripcion ?? null, salario_base ?? null, activo ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Puesto no encontrado" });
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "puesto_editado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Edición de puesto ${rows[0].descripcion}`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;
