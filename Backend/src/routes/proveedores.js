import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

// Umbral para considerar "Conectado" (horas).
const UMBRAL_CONECTADO_HORAS = 48;

function estadoConexion(u) {
  if (!u || u.id_usuario == null) return "sin_conexion";
  if (u.usuario_activo === false) return "bloqueado";
  if (u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date()) return "bloqueado";
  if (u.fecha_ultimo_acceso) {
    const diffMs = Date.now() - new Date(u.fecha_ultimo_acceso).getTime();
    if (diffMs <= UMBRAL_CONECTADO_HORAS * 3600 * 1000) return "conectado";
  }
  return "sin_conexion";
}

const SELECT_PROVEEDOR = `
  SELECT p.id_proveedor, p.nit, p.razon_social, p.correo, p.telefono, p.activo,
         p.representante_legal, p.nombre_contacto, p.telefono_contacto, p.direccion,
         p.fecha_registro, tp.id_tipo_proveedor, tp.descripcion AS tipo,
         u.id_usuario, u.nombre_usuario, u.activo AS usuario_activo,
         u.bloqueado_hasta, u.fecha_ultimo_acceso,
         r.id_rol, r.descripcion AS rol
    FROM proveedor p
    JOIN tipo_proveedor tp ON tp.id_tipo_proveedor = p.id_tipo_proveedor
    LEFT JOIN proveedor_usuario pu ON pu.id_proveedor = p.id_proveedor AND pu.es_principal
    LEFT JOIN usuario u ON u.id_usuario = pu.id_usuario
    LEFT JOIN rol r ON r.id_rol = u.id_rol`;

function mapRow(row) {
  return {
    ...row,
    estado_conexion: estadoConexion(row),
    tiene_acceso: row.id_usuario != null,
  };
}

// ── Listado paginado ──────────────────────────────────────────────────────────
router.get("/", authorize("proveedores"), async (req, res, next) => {
  try {
    const { q, tipo, estado, page = 1, pageSize = 10 } = req.query;
    const where = ["1=1"];
    const params = [];
    const add = (v) => params.push(v);

    if (q) {
      where.push(`(p.razon_social ILIKE $${params.length + 1} OR p.nit ILIKE $${params.length + 1})`);
      add(`%${q}%`);
    }
    if (tipo) {
      where.push(`p.id_tipo_proveedor = $${params.length + 1}`);
      add(tipo);
    }
    if (estado === "activos") where.push("p.activo = TRUE");
    if (estado === "inactivos") where.push("p.activo = FALSE");

    const whereSql = `WHERE ${where.join(" AND ")}`;
    const offset = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);

    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM proveedor p ${whereSql}`, params);
    const total = count.rows[0].total;

    const { rows } = await pool.query(
      `${SELECT_PROVEEDOR}
       ${whereSql}
       ORDER BY p.razon_social
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(pageSize, 10), offset],
    );

    res.json({
      data: rows.map(mapRow),
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  } catch (e) {
    next(e);
  }
});

// ── Resumen (KPIs) ────────────────────────────────────────────────────────────
router.get("/resumen", authorize("proveedores"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(SELECT_PROVEEDOR);
    const list = rows.map(mapRow);
    const resumen = {
      total: list.length,
      activos_portal: list.filter((p) => p.estado_conexion === "conectado").length,
      sin_conexion: list.filter((p) => p.estado_conexion === "sin_conexion").length,
      bloqueados: list.filter((p) => p.estado_conexion === "bloqueado").length,
    };
    res.json(resumen);
  } catch (e) {
    next(e);
  }
});

// ── Catálogos ─────────────────────────────────────────────────────────────────
router.get("/tipos-proveedor", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_tipo_proveedor, descripcion, activo FROM tipo_proveedor WHERE activo = TRUE ORDER BY descripcion",
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/roles-portal", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT r.id_rol, r.descripcion
         FROM rol r
         JOIN permiso p ON p.id_rol = r.id_rol AND p.activo
         JOIN submenu s ON s.id_submenu = p.id_submenu AND s.activo
        WHERE s.controlador LIKE 'portal_%' AND r.activo
        ORDER BY r.descripcion`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Detalle ───────────────────────────────────────────────────────────────────
router.get("/:id", authorize("proveedores"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(`${SELECT_PROVEEDOR} WHERE p.id_proveedor = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json(mapRow(rows[0]));
  } catch (e) {
    next(e);
  }
});

// ── Crear (sin acceso al portal) ──────────────────────────────────────────────
router.post("/", authorize("proveedores"), async (req, res, next) => {
  try {
    const {
      nit,
      razon_social,
      id_tipo_proveedor,
      correo,
      telefono,
      representante_legal,
      nombre_contacto,
      telefono_contacto,
      direccion,
    } = req.body;

    if (!nit || !nit.trim()) return res.status(400).json({ error: "El NIT es obligatorio" });
    if (!razon_social || !razon_social.trim()) return res.status(400).json({ error: "La razón social es obligatoria" });
    if (!correo || !correo.trim()) return res.status(400).json({ error: "El correo es obligatorio" });
    if (!id_tipo_proveedor) return res.status(400).json({ error: "La categoría es obligatoria" });

    const { rows } = await pool.query(
      `INSERT INTO proveedor
         (nit, razon_social, id_tipo_proveedor, correo, telefono,
          representante_legal, nombre_contacto, telefono_contacto, direccion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        nit.trim(),
        razon_social.trim(),
        id_tipo_proveedor,
        correo.trim(),
        telefono?.trim() || null,
        representante_legal?.trim() || null,
        nombre_contacto?.trim() || null,
        telefono_contacto?.trim() || null,
        direccion?.trim() || null,
      ],
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "proveedor_creado",
      ip: ipDe(req),
      modulo: "Proveedores",
      detalle: `Alta de proveedor ${razon_social} (NIT ${nit})`,
    });

    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe un proveedor con ese NIT" });
    next(e);
  }
});

// ── Editar ────────────────────────────────────────────────────────────────────
router.put("/:id", authorize("proveedores"), async (req, res, next) => {
  try {
    const {
      razon_social,
      id_tipo_proveedor,
      correo,
      telefono,
      representante_legal,
      nombre_contacto,
      telefono_contacto,
      direccion,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE proveedor
          SET razon_social = COALESCE($1, razon_social),
              id_tipo_proveedor = COALESCE($2, id_tipo_proveedor),
              correo = COALESCE($3, correo),
              telefono = COALESCE($4, telefono),
              representante_legal = COALESCE($5, representante_legal),
              nombre_contacto = COALESCE($6, nombre_contacto),
              telefono_contacto = COALESCE($7, telefono_contacto),
              direccion = COALESCE($8, direccion)
        WHERE id_proveedor = $9 RETURNING *`,
      [
        razon_social?.trim() ?? null,
        id_tipo_proveedor ?? null,
        correo?.trim() ?? null,
        telefono?.trim() ?? null,
        representante_legal?.trim() ?? null,
        nombre_contacto?.trim() ?? null,
        telefono_contacto?.trim() ?? null,
        direccion?.trim() ?? null,
        req.params.id,
      ],
    );
    if (!rows[0]) return res.status(404).json({ error: "Proveedor no encontrado" });

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "proveedor_editado",
      ip: ipDe(req),
      modulo: "Proveedores",
      detalle: `Edición de proveedor ${rows[0].razon_social}`,
    });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Baja lógica / activación ──────────────────────────────────────────────────
router.patch("/:id/estado", authorize("proveedores"), async (req, res, next) => {
  try {
    const { activo } = req.body;
    if (typeof activo !== "boolean") return res.status(400).json({ error: "activo debe ser boolean" });

    const { rows } = await pool.query(
      "UPDATE proveedor SET activo = $1 WHERE id_proveedor = $2 RETURNING *",
      [activo, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Proveedor no encontrado" });

    // Al desactivar, bloquear también su cuenta del portal.
    if (!activo) {
      await pool.query(
        `UPDATE usuario u SET activo = FALSE
           FROM proveedor_usuario pu
          WHERE pu.id_usuario = u.id_usuario AND pu.id_proveedor = $1`,
        [req.params.id],
      );
    }

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: activo ? "proveedor_activado" : "proveedor_desactivado",
      ip: ipDe(req),
      modulo: "Proveedores",
      detalle: `${activo ? "Activación" : "Baja"} de proveedor ${rows[0].razon_social}`,
    });

    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Conectar al portal (crea proveedor + usuario) ─────────────────────────────
async function generarUsername(correo, nit) {
  const base = (correo || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const nitDigits = (nit || "").replace(/[^0-9A-Za-z]/g, "").toLowerCase();
  const candidate = base || `prov${nitDigits}`;
  for (let i = 0; i < 20; i++) {
    const name = i === 0 ? candidate : `${candidate}${i}`;
    const { rows } = await pool.query("SELECT 1 FROM usuario WHERE nombre_usuario = $1", [name]);
    if (!rows[0]) return name;
  }
  return `${candidate}${crypto.randomBytes(2).toString("hex")}`;
}

router.post("/conectar", authorize("proveedores"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { razon_social, nit, correo, telefono, id_rol, id_tipo_proveedor } = req.body;

    if (!razon_social || !razon_social.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La razón social es obligatoria" });
    }
    if (!nit || !nit.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El NIT es obligatorio" });
    }
    if (!correo || !correo.trim()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El correo es obligatorio" });
    }
    if (!id_rol) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Seleccione el rol del portal" });
    }
    if (!id_tipo_proveedor) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Seleccione la categoría" });
    }

    // ¿El NIT ya existe?
    const existente = await client.query("SELECT * FROM proveedor WHERE nit = $1", [nit.trim()]);
    if (existente.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Ya existe un proveedor con ese NIT" });
    }

    // Rol debe ser de tipo portal.
    const rolCheck = await client.query(
      `SELECT 1 FROM permiso p JOIN submenu s ON s.id_submenu = p.id_submenu
        WHERE p.id_rol = $1 AND p.activo AND s.activo AND s.controlador LIKE 'portal_%' LIMIT 1`,
      [id_rol],
    );
    if (!rolCheck.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El rol seleccionado no es un rol de portal" });
    }

    const proveedor = await client.query(
      `INSERT INTO proveedor (nit, razon_social, id_tipo_proveedor, correo, telefono)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nit.trim(), razon_social.trim(), id_tipo_proveedor, correo.trim(), telefono?.trim() || null],
    );

    const nombre_usuario = await generarUsername(correo.trim(), nit.trim());
    const claveTemporal = crypto.randomBytes(6).toString("base64url");
    const hash = await bcrypt.hash(claveTemporal, 10);

    const usuario = await client.query(
      `INSERT INTO usuario (id_rol, nombre_usuario, clave, correo, activo, tipo_usuario, debe_cambiar_clave)
       VALUES ($1, $2, $3, $4, TRUE, 'PROVEEDOR', TRUE)
       RETURNING id_usuario, nombre_usuario`,
      [id_rol, nombre_usuario, hash, correo.trim()],
    );

    await client.query(
      `INSERT INTO proveedor_usuario (id_proveedor, id_usuario, es_principal)
       VALUES ($1, $2, TRUE)`,
      [proveedor.rows[0].id_proveedor, usuario.rows[0].id_usuario],
    );

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "conectar_proveedor",
      ip: ipDe(req),
      modulo: "Proveedores",
      detalle: `Proveedor ${razon_social} conectado al portal (${nombre_usuario})`,
    });

    res.status(201).json({
      proveedor: proveedor.rows[0],
      credenciales: {
        nombre_usuario: usuario.rows[0].nombre_usuario,
        clave_temporal: claveTemporal,
      },
    });
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") return res.status(409).json({ error: "Ya existe un proveedor o usuario con esos datos" });
    next(e);
  } finally {
    client.release();
  }
});

// ── Cambiar rol del portal ────────────────────────────────────────────────────
router.patch("/:id/portal/rol", authorize("proveedores"), async (req, res, next) => {
  try {
    const { id_rol } = req.body;
    if (!id_rol) return res.status(400).json({ error: "Seleccione un rol" });

    const { rows } = await pool.query(
      `UPDATE usuario u SET id_rol = $1
         FROM proveedor_usuario pu
        WHERE pu.id_usuario = u.id_usuario AND pu.id_proveedor = $2 AND pu.es_principal
        RETURNING u.id_usuario`,
      [id_rol, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "El proveedor no tiene acceso al portal" });

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "proveedor_rol_cambiado",
      ip: ipDe(req),
      modulo: "Proveedores",
      detalle: `Cambio de rol del proveedor ${req.params.id}`,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ── Restablecer credenciales ──────────────────────────────────────────────────
router.post("/:id/portal/reset-clave", authorize("proveedores"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id_usuario FROM usuario u
         JOIN proveedor_usuario pu ON pu.id_usuario = u.id_usuario
        WHERE pu.id_proveedor = $1 AND pu.es_principal`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "El proveedor no tiene acceso al portal" });

    const claveTemporal = crypto.randomBytes(6).toString("base64url");
    const hash = await bcrypt.hash(claveTemporal, 10);
    await pool.query(
      "UPDATE usuario SET clave = $1, debe_cambiar_clave = TRUE WHERE id_usuario = $2",
      [hash, rows[0].id_usuario],
    );

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "proveedor_reset_clave",
      ip: ipDe(req),
      modulo: "Proveedores",
      detalle: `Restablecimiento de credenciales del proveedor ${req.params.id}`,
    });

    res.json({ clave_temporal: claveTemporal });
  } catch (e) {
    next(e);
  }
});

// ── Bloquear / desbloquear acceso ─────────────────────────────────────────────
router.patch("/:id/portal/bloqueo", authorize("proveedores"), async (req, res, next) => {
  try {
    const { bloquear } = req.body;
    if (typeof bloquear !== "boolean") return res.status(400).json({ error: "bloquear debe ser boolean" });

    const { rows } = await pool.query(
      `UPDATE usuario u SET activo = $1, bloqueado_hasta = $2
         FROM proveedor_usuario pu
        WHERE pu.id_usuario = u.id_usuario AND pu.id_proveedor = $3 AND pu.es_principal
        RETURNING u.id_usuario`,
      [bloquear ? false : true, bloquear ? new Date(Date.now() + 365 * 24 * 3600 * 1000) : null, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "El proveedor no tiene acceso al portal" });

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: bloquear ? "proveedor_bloqueado" : "proveedor_desbloqueado",
      ip: ipDe(req),
      modulo: "Proveedores",
      detalle: `${bloquear ? "Bloqueo" : "Desbloqueo"} del proveedor ${req.params.id}`,
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
