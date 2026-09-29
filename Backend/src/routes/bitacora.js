import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

function buildWhere(q, params) {
  const where = [];
  if (q.usuario) {
    params.push(`%${q.usuario}%`);
    where.push(
      `(u.nombre_usuario ILIKE $${params.length} OR e.nombre ILIKE $${params.length} OR e.apellido ILIKE $${params.length})`,
    );
  }
  if (q.modulo) {
    params.push(q.modulo);
    where.push(`b.modulo = $${params.length}`);
  }
  if (q.accion) {
    params.push(q.accion);
    where.push(`b.accion = $${params.length}`);
  }
  if (q.desde) {
    params.push(q.desde);
    where.push(`b.fecha_acceso >= $${params.length}::timestamp`);
  }
  if (q.hasta) {
    params.push(q.hasta);
    where.push(`b.fecha_acceso <= $${params.length}::timestamp`);
  }
  return where.length ? `WHERE ${where.join(" AND ")}` : "";
}

const BASE = `
  SELECT b.id_bitacora, b.accion, b.ip_acceso, b.fecha_acceso, b.modulo, b.detalle,
         u.nombre_usuario, e.nombre, e.apellido
    FROM bitacora_acceso b
    JOIN usuario u ON u.id_usuario = b.id_usuario
    JOIN empleado e ON e.id_empleado = u.id_empleado
`;

router.get("/", authorize("auditoria"), async (req, res, next) => {
  try {
    const q = {
      usuario: req.query.usuario?.toString().trim() || "",
      modulo: req.query.modulo?.toString().trim() || "",
      accion: req.query.accion?.toString().trim() || "",
      desde: req.query.desde?.toString().trim() || "",
      hasta: req.query.hasta?.toString().trim() || "",
    };
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20));

    const params = [];
    const where = buildWhere(q, params);

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM bitacora_acceso b
         JOIN usuario u ON u.id_usuario = b.id_usuario
         JOIN empleado e ON e.id_empleado = u.id_empleado ${where}`,
      params,
    );
    const total = totalRows[0].total;

    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);
    const { rows } = await pool.query(
      `${BASE} ${where} ORDER BY b.fecha_acceso DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    res.json({ data: rows, total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

router.get("/exportar", authorize("auditoria"), async (req, res, next) => {
  try {
    const q = {
      usuario: req.query.usuario?.toString().trim() || "",
      modulo: req.query.modulo?.toString().trim() || "",
      accion: req.query.accion?.toString().trim() || "",
      desde: req.query.desde?.toString().trim() || "",
      hasta: req.query.hasta?.toString().trim() || "",
    };
    const params = [];
    const where = buildWhere(q, params);
    const { rows } = await pool.query(
      `${BASE} ${where} ORDER BY b.fecha_acceso DESC`,
      params,
    );

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = "Fecha,Usuario,Modulo,Accion,IP,Detalle";
    const lines = rows.map((r) =>
      [
        r.fecha_acceso,
        `${r.nombre} ${r.apellido}`.trim(),
        r.modulo,
        r.accion,
        r.ip_acceso,
        r.detalle,
      ]
        .map(esc)
        .join(","),
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "bitacora_exportada",
      ip: ipDe(req),
      modulo: "Auditoría",
      detalle: `Exportación CSV de ${rows.length} registros`,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="bitacora_acceso.csv"',
    );
    res.send(`\uFEFF${[header, ...lines].join("\n")}`);
  } catch (e) {
    next(e);
  }
});

export default router;
