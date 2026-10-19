import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

// Registro de catálogos administrables. Los nombres de columnas son fijos aquí
// (nunca vienen del cliente), por lo que es seguro interpolarlos.
const CATALOGOS = {
  categorias: {
    tabla: "categoria",
    pk: "id_categoria",
    nombre: "nombre",
    campos: ["nombre", "descripcion"],
    label: "Categoría",
  },
  "unidades-medida": {
    tabla: "unidad_medida",
    pk: "id_unidad_medida",
    nombre: "nombre",
    campos: ["nombre", "simbolo"],
    label: "Unidad de medida",
  },
  partidas: {
    tabla: "partida_presupuestaria",
    pk: "id_partida",
    nombre: "descripcion",
    campos: ["codigo", "descripcion"],
    label: "Partida presupuestaria",
  },
  "fuentes-financiamiento": {
    tabla: "fuente_financiamiento",
    pk: "id_fuente",
    nombre: "descripcion",
    campos: ["codigo", "descripcion"],
    label: "Fuente de financiamiento",
  },
  puestos: {
    tabla: "puesto",
    pk: "id_puesto",
    nombre: "descripcion",
    campos: ["descripcion", "salario_base"],
    label: "Puesto",
  },
};

router.get("/", authorize("configuracion"), (_req, res) => {
  res.json(
    Object.entries(CATALOGOS).map(([key, c]) => ({
      clave: key,
      label: c.label,
      tabla: c.tabla,
    })),
  );
});

// ── Días inhábiles (antes de /:catalogo para no chocar con el parámetro) ─────
router.get("/dias-inhabiles", authorize("configuracion"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_dia_inhabil, fecha, descripcion FROM dia_inhabil ORDER BY fecha`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/dias-inhabiles", authorize("configuracion"), async (req, res, next) => {
  try {
    const { fecha, descripcion } = req.body ?? {};
    if (!fecha) return res.status(400).json({ error: "Fecha obligatoria" });
    const { rows } = await pool.query(
      `INSERT INTO dia_inhabil (fecha, descripcion) VALUES ($1, $2)
       ON CONFLICT (fecha) DO UPDATE SET descripcion = EXCLUDED.descripcion
       RETURNING *`,
      [fecha, descripcion ?? null],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "dia_inhabil_creado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Día inhábil ${fecha}`,
    });
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.delete("/dias-inhabiles/:id", authorize("configuracion"), async (req, res, next) => {
  try {
    await pool.query(`DELETE FROM dia_inhabil WHERE id_dia_inhabil = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ── CRUD genérico por catálogo ───────────────────────────────────────────────
function getCatalogo(req, res) {
  const c = CATALOGOS[req.params.catalogo];
  if (!c) {
    res.status(404).json({ error: "Catálogo no encontrado" });
    return null;
  }
  return c;
}

router.get("/:catalogo", authorize("configuracion"), async (req, res, next) => {
  const c = getCatalogo(req, res);
  if (!c) return;
  try {
    const soloActivos = req.query.activos === "1";
    const where = soloActivos ? "WHERE activo" : "";
    const { rows } = await pool.query(
      `SELECT * FROM ${c.tabla} ${where} ORDER BY ${c.nombre}`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/:catalogo", authorize("configuracion"), async (req, res, next) => {
  const c = getCatalogo(req, res);
  if (!c) return;
  try {
    const cols = c.campos.filter((col) => col in (req.body ?? {}));
    if (!cols.length) return res.status(400).json({ error: "Sin datos para crear" });
    const values = cols.map((col) => req.body[col]);
    const marks = cols.map((_, i) => `$${i + 1}`);
    const { rows } = await pool.query(
      `INSERT INTO ${c.tabla} (${cols.join(", ")})
       VALUES (${marks.join(", ")}) RETURNING *`,
      values,
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "catalogo_creado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `${c.label} creado (id ${rows[0][c.pk]})`,
    });
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Valor duplicado" });
    next(e);
  }
});

router.put("/:catalogo/:id", authorize("configuracion"), async (req, res, next) => {
  const c = getCatalogo(req, res);
  if (!c) return;
  try {
    const cols = c.campos.filter((col) => col in (req.body ?? {}));
    if (!cols.length) return res.status(400).json({ error: "Sin datos para actualizar" });
    const set = cols.map((col, i) => `${col} = $${i + 1}`);
    const values = [...cols.map((col) => req.body[col]), req.params.id];
    const { rows } = await pool.query(
      `UPDATE ${c.tabla} SET ${set.join(", ")} WHERE ${c.pk} = $${values.length} RETURNING *`,
      values,
    );
    if (!rows[0]) return res.status(404).json({ error: "Registro no encontrado" });
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "catalogo_actualizado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `${c.label} actualizado (id ${req.params.id})`,
    });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Valor duplicado" });
    next(e);
  }
});

router.patch("/:catalogo/:id/estado", authorize("configuracion"), async (req, res, next) => {
  const c = getCatalogo(req, res);
  if (!c) return;
  try {
    const activo = req.body?.activo === false ? false : true;
    const { rows } = await pool.query(
      `UPDATE ${c.tabla} SET activo = $1 WHERE ${c.pk} = $2 RETURNING *`,
      [activo, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Registro no encontrado" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;
