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
      `SELECT d.id_dependencia, d.nombre_dependencia, d.siglas, d.ubicacion, d.activo, d.fecha_registro,
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
    const { nombre_dependencia, ubicacion = null, siglas = null } = req.body;
    if (!nombre_dependencia) {
      return res.status(400).json({ error: "nombre_dependencia es requerido" });
    }
    const { rows } = await pool.query(
      "INSERT INTO dependencia_municipal (nombre_dependencia, ubicacion, siglas) VALUES ($1, $2, $3) RETURNING *",
      [nombre_dependencia, ubicacion, siglas],
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
      return res.status(409).json({ error: "Ya existe esa dependencia o sus siglas" });
    }
    next(e);
  }
});

router.put("/:id", authorize("configuracion"), async (req, res, next) => {
  try {
    const { nombre_dependencia, ubicacion, activo, siglas } = req.body;
    const { rows } = await pool.query(
      `UPDATE dependencia_municipal
          SET nombre_dependencia = COALESCE($1, nombre_dependencia),
              ubicacion = COALESCE($2, ubicacion),
              activo = COALESCE($3, activo),
              siglas = COALESCE($4, siglas)
        WHERE id_dependencia = $5 RETURNING *`,
      [nombre_dependencia ?? null, ubicacion ?? null, activo ?? null, siglas ?? null, req.params.id],
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
    if (e.code === "23505") {
      return res.status(409).json({ error: "Ya existe esa dependencia o sus siglas" });
    }
    next(e);
  }
});

router.patch("/:id/estado", authorize("configuracion"), async (req, res, next) => {
  try {
    const { activo } = req.body;
    if (typeof activo !== "boolean") {
      return res.status(400).json({ error: "activo debe ser boolean" });
    }
    const { rows } = await pool.query(
      "UPDATE dependencia_municipal SET activo = $1 WHERE id_dependencia = $2 RETURNING *",
      [activo, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Dependencia no encontrada" });
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: activo ? "dependencia_activada" : "dependencia_desactivada",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `${activo ? "Activación" : "Desactivación"} de dependencia ${rows[0].nombre_dependencia}`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.get("/:id/presupuesto", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pd.id_presupuesto, pd.id_dependencia, pd.id_periodo, pd.monto_asignado,
              pf.anio, pf.activo AS periodo_activo,
              COALESCE((
                SELECT SUM(r.monto_estimado)::numeric(12,2)
                FROM requisicion r
                WHERE r.id_dependencia = pd.id_dependencia
                  AND r.id_periodo = pd.id_periodo
                  AND r.estado IN ('Aprobada', 'En Compra')
              ), 0) AS monto_ejecutado,
              (pd.monto_asignado - COALESCE((
                SELECT SUM(r.monto_estimado)::numeric(12,2)
                FROM requisicion r
                WHERE r.id_dependencia = pd.id_dependencia
                  AND r.id_periodo = pd.id_periodo
                  AND r.estado IN ('Aprobada', 'En Compra')
              ), 0)) AS monto_disponible
         FROM presupuesto_dependencia pd
         JOIN periodo_fiscal pf ON pf.id_periodo = pd.id_periodo
        WHERE pd.id_dependencia = $1 AND pf.activo = TRUE`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "No hay presupuesto para el período activo" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.put("/:id/presupuesto", authorize("configuracion"), async (req, res, next) => {
  try {
    const { monto_asignado } = req.body;
    if (monto_asignado === undefined || monto_asignado < 0) {
      return res.status(400).json({ error: "monto_asignado es requerido y debe ser >= 0" });
    }
    const { rows } = await pool.query(
      `UPDATE presupuesto_dependencia pd
         SET monto_asignado = $1
        FROM periodo_fiscal pf
       WHERE pd.id_dependencia = $2 AND pf.id_periodo = pd.id_periodo AND pf.activo = TRUE
       RETURNING pd.*, pf.anio, pf.activo AS periodo_activo`,
      [monto_asignado, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "No hay presupuesto para el período activo" });
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "presupuesto_actualizado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Presupuesto actualizado a Q${monto_asignado} para dependencia ${rows[0].id_dependencia}`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.get("/presupuesto/resumen", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
          SUM(pd.monto_asignado)::numeric(12,2) AS total_asignado,
          COALESCE(SUM(
            CASE WHEN r.estado IN ('Aprobada', 'En Compra') THEN r.monto_estimado ELSE 0 END
          )::numeric(12,2), 0) AS total_ejecutado,
          (SUM(pd.monto_asignado)::numeric(12,2) - COALESCE(SUM(
            CASE WHEN r.estado IN ('Aprobada', 'En Compra') THEN r.monto_estimado ELSE 0 END
          )::numeric(12,2), 0)) AS total_disponible,
          CASE WHEN SUM(pd.monto_asignado) > 0
               THEN ROUND((COALESCE(SUM(
                 CASE WHEN r.estado IN ('Aprobada', 'En Compra') THEN r.monto_estimado ELSE 0 END
               )::numeric(12,2), 0) / SUM(pd.monto_asignado)::numeric(12,2)) * 100, 2)
               ELSE 0 END AS porcentaje_ejecutado
         FROM presupuesto_dependencia pd
         JOIN periodo_fiscal pf ON pf.id_periodo = pd.id_periodo
         LEFT JOIN requisicion r ON r.id_dependencia = pd.id_dependencia AND r.id_periodo = pd.id_periodo
        WHERE pf.activo = TRUE`,
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;