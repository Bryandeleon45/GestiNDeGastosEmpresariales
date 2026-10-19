import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

// Lista de períodos con presupuesto asignado total.
router.get("/", authorize("configuracion"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pf.id_periodo, pf.anio, pf.activo, pf.cerrado,
              pf.fecha_inicio, pf.fecha_fin, pf.fecha_cierre,
              COALESCE(SUM(pd.monto_asignado), 0)::numeric(12,2) AS presupuesto_total
         FROM periodo_fiscal pf
         LEFT JOIN presupuesto_dependencia pd ON pd.id_periodo = pf.id_periodo
        GROUP BY pf.id_periodo
        ORDER BY pf.anio DESC`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Crear período.
router.post("/", authorize("configuracion"), async (req, res, next) => {
  try {
    const anio = parseInt(req.body?.anio, 10);
    if (!anio || Number.isNaN(anio)) return res.status(400).json({ error: "Año obligatorio" });
    const { rows } = await pool.query(
      `INSERT INTO periodo_fiscal (anio, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3)
       ON CONFLICT (anio) DO UPDATE SET
         fecha_inicio = EXCLUDED.fecha_inicio, fecha_fin = EXCLUDED.fecha_fin
       RETURNING *`,
      [anio, req.body?.fecha_inicio || null, req.body?.fecha_fin || null],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "periodo_creado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Período fiscal ${anio}`,
    });
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// Editar período (fechas).
router.put("/:id", authorize("configuracion"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE periodo_fiscal
          SET fecha_inicio = COALESCE($1, fecha_inicio), fecha_fin = COALESCE($2, fecha_fin)
        WHERE id_periodo = $3
        RETURNING *`,
      [req.body?.fecha_inicio ?? null, req.body?.fecha_fin ?? null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Período no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// Activar un período (uno solo activo, en transacción).
router.post("/:id/activar", authorize("configuracion"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT * FROM periodo_fiscal WHERE id_periodo = $1 FOR UPDATE`,
      [req.params.id],
    );
    if (!rows[0]) throw new Error("Período no encontrado");
    if (rows[0].cerrado) throw new Error("Un período cerrado no se puede activar");
    await client.query(`UPDATE periodo_fiscal SET activo = FALSE WHERE activo`);
    await client.query(`UPDATE periodo_fiscal SET activo = TRUE WHERE id_periodo = $1`, [req.params.id]);
    await client.query("COMMIT");
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "periodo_activado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Período ${rows[0].anio} activado`,
    });
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Cerrar un período.
router.post("/:id/cerrar", authorize("configuracion"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT * FROM periodo_fiscal WHERE id_periodo = $1 FOR UPDATE`,
      [req.params.id],
    );
    if (!rows[0]) throw new Error("Período no encontrado");
    if (rows[0].cerrado) throw new Error("El período ya está cerrado");
    await client.query(
      `UPDATE periodo_fiscal
          SET cerrado = TRUE, activo = FALSE, fecha_cierre = now(), id_usuario_cierre = $1
        WHERE id_periodo = $2`,
      [req.user.id_usuario, req.params.id],
    );
    await client.query("COMMIT");
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "periodo_cerrado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Período ${rows[0].anio} cerrado`,
    });
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Matriz de presupuesto por dependencia.
router.get("/:id/presupuestos", authorize("configuracion"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT dm.id_dependencia, dm.nombre_dependencia, dm.siglas,
              COALESCE(pd.monto_asignado, 0)::numeric(12,2) AS monto_asignado,
              COALESCE(pd.id_presupuesto, 0)::int AS id_presupuesto
         FROM dependencia_municipal dm
         LEFT JOIN presupuesto_dependencia pd
                ON pd.id_dependencia = dm.id_dependencia AND pd.id_periodo = $1
        WHERE dm.activo
        ORDER BY dm.nombre_dependencia`,
      [req.params.id],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Guardar presupuesto por dependencia.
router.put("/:id/presupuestos", authorize("configuracion"), async (req, res, next) => {
  try {
    const { id_dependencia, monto_asignado } = req.body ?? {};
    if (!id_dependencia) return res.status(400).json({ error: "Dependencia obligatoria" });
    const monto = Number(monto_asignado);
    if (Number.isNaN(monto) || monto < 0) return res.status(400).json({ error: "Monto inválido" });
    await pool.query(
      `INSERT INTO presupuesto_dependencia (id_dependencia, id_periodo, monto_asignado)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_dependencia, id_periodo)
       DO UPDATE SET monto_asignado = EXCLUDED.monto_asignado`,
      [id_dependencia, req.params.id, monto],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "presupuesto_actualizado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Presupuesto dependencia ${id_dependencia} → ${monto}`,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
