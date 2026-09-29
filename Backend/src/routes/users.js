import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

function pad(n) {
  return String(n).padStart(3, "0");
}

// El listado "Usuarios" gestiona PERSONAL (empleado) con una cuenta de acceso opcional.
function dto(row) {
  const tieneAcceso = row.id_usuario != null;
  return {
    id: `e${row.id_empleado}`,
    codigo: tieneAcceso ? `USR-${pad(row.id_usuario)}` : `PER-${pad(row.id_empleado)}`,
    nombre: `${row.nombre} ${row.apellido}`.trim(),
    primer_nombre: row.nombre,
    apellido: row.apellido,
    dpi: row.dpi,
    telefono: row.telefono,
    correo: row.correo,
    ingreso: row.fecha_ingreso,
    estado: row.activo_empleado ? "Activo" : "Inactivo",
    tieneAcceso,
    id_empleado: row.id_empleado,
    id_usuario: row.id_usuario ?? null,
    nombre_usuario: row.nombre_usuario ?? null,
    activo_cuenta: row.activo_cuenta ?? null,
    id_rol: row.id_rol ?? null,
    rol: row.rol ?? null,
    id_dependencia: row.id_dependencia,
    dependencia: row.nombre_dependencia,
    id_puesto: row.id_puesto,
    puesto: row.puesto,
  };
}

const BASE_SELECT = `
  SELECT e.id_empleado, e.dpi, e.nombre, e.apellido, e.telefono, e.correo,
         e.fecha_ingreso, e.activo AS activo_empleado,
         d.id_dependencia, d.nombre_dependencia,
         p.id_puesto, p.descripcion AS puesto,
         u.id_usuario, u.nombre_usuario, u.activo AS activo_cuenta, u.id_rol,
         r.nombre_rol AS rol
    FROM empleado e
    LEFT JOIN dependencia_municipal d ON d.id_dependencia = e.id_dependencia
    LEFT JOIN puesto p ON p.id_puesto = e.id_puesto
    LEFT JOIN usuario u ON u.id_empleado = e.id_empleado
    LEFT JOIN rol r ON r.id_rol = u.id_rol
`;

router.get("/resumen", authorize("usuarios"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM empleado) AS total,
         (SELECT COUNT(*)::int FROM empleado WHERE activo) AS activos,
         (SELECT COUNT(*)::int FROM empleado WHERE NOT activo) AS inactivos,
         (SELECT COUNT(*)::int FROM usuario WHERE activo) AS con_acceso`,
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.get("/", authorize("usuarios"), async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const estado = (req.query.estado || "").toString().trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));

    const where = [];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      where.push(
        `(e.nombre ILIKE $${params.length} OR e.apellido ILIKE $${params.length}
          OR e.dpi ILIKE $${params.length} OR u.nombre_usuario ILIKE $${params.length}
          OR u.id_usuario::text = ${JSON.stringify(q)})`,
      );
    }
    if (estado === "Activo" || estado === "Inactivo") {
      params.push(estado === "Activo");
      where.push(`e.activo = $${params.length}`);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const { rows: totalRows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM empleado e
         LEFT JOIN usuario u ON u.id_empleado = e.id_empleado ${whereClause}`,
      params,
    );
    const total = totalRows[0].total;

    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);
    const { rows } = await pool.query(
      `${BASE_SELECT} ${whereClause}
        ORDER BY e.id_empleado
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({ data: rows.map(dto), total, page, pageSize });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", authorize("usuarios"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `${BASE_SELECT} WHERE e.id_empleado = $1`,
      [req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Personal no encontrado" });
    res.json(dto(rows[0]));
  } catch (e) {
    next(e);
  }
});

router.post("/", authorize("usuarios"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      nombre,
      apellido,
      dpi,
      telefono = null,
      correo = null,
      fecha_ingreso = null,
      id_dependencia = null,
      id_puesto = null,
      acceso = false,
      nombre_usuario = null,
      id_rol = null,
      clave = null,
    } = req.body;

    if (!nombre || !apellido || !dpi || !correo) {
      return res.status(400).json({ error: "nombre, apellido, dpi y correo son requeridos" });
    }

    let depId = id_dependencia;
    let pueId = id_puesto;
    if (!depId) {
      const { rows } = await client.query(
        "SELECT id_dependencia FROM dependencia_municipal WHERE activo ORDER BY id_dependencia LIMIT 1",
      );
      if (!rows[0]) return res.status(400).json({ error: "No hay dependencias disponibles" });
      depId = rows[0].id_dependencia;
    }
    if (!pueId) {
      const { rows } = await client.query(
        "SELECT id_puesto FROM puesto WHERE activo ORDER BY id_puesto LIMIT 1",
      );
      if (!rows[0]) return res.status(400).json({ error: "No hay puestos disponibles" });
      pueId = rows[0].id_puesto;
    }

    if (acceso && (!nombre_usuario || !id_rol || !clave)) {
      return res
        .status(400)
        .json({ error: "Para habilitar acceso se requiere usuario, rol y clave" });
    }
    if (acceso && clave && clave.length < 8) {
      return res.status(400).json({ error: "La clave debe tener mínimo 8 caracteres" });
    }

    await client.query("BEGIN");
    const { rows: emp } = await client.query(
      `INSERT INTO empleado (id_dependencia, id_puesto, dpi, nombre, apellido, telefono, correo, fecha_ingreso)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id_empleado`,
      [depId, pueId, dpi, nombre, apellido, telefono, correo, fecha_ingreso],
    );

    if (acceso) {
      const hashed = await bcrypt.hash(clave, 12);
      await client.query(
        `INSERT INTO usuario (id_empleado, id_rol, nombre_usuario, clave, correo, debe_cambiar_clave)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [emp[0].id_empleado, id_rol, nombre_usuario, hashed, correo],
      );
    }

    await client.query("COMMIT");
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "usuario_creado",
      ip: ipDe(req),
      modulo: "Usuarios",
      detalle: `Alta de ${nombre} ${apellido}${acceso ? " con acceso al sistema" : ""}`,
    });

    const { rows: full } = await pool.query(
      `${BASE_SELECT} WHERE e.id_empleado = $1`,
      [emp[0].id_empleado],
    );
    res.status(201).json(dto(full[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") {
      return res.status(409).json({ error: "DPI, correo o nombre de usuario duplicado" });
    }
    next(e);
  } finally {
    client.release();
  }
});

router.put("/:id", authorize("usuarios"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      nombre,
      apellido,
      dpi,
      telefono,
      correo,
      fecha_ingreso,
      id_dependencia,
      id_puesto,
      id_rol,
      acceso,
      nombre_usuario,
      clave,
    } = req.body;

    await client.query("BEGIN");

    const { rows: exist } = await client.query(
      `${BASE_SELECT} WHERE e.id_empleado = $1`,
      [req.params.id],
    );
    if (!exist[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Personal no encontrado" });
    }
    const current = exist[0];

    await client.query(
      `UPDATE empleado
          SET nombre = COALESCE($1, nombre),
              apellido = COALESCE($2, apellido),
              dpi = COALESCE($3, dpi),
              telefono = COALESCE($4, telefono),
              correo = COALESCE($5, correo),
              fecha_ingreso = COALESCE($6, fecha_ingreso),
              id_dependencia = COALESCE($7, id_dependencia),
              id_puesto = COALESCE($8, id_puesto)
        WHERE id_empleado = $9`,
      [
        nombre ?? null,
        apellido ?? null,
        dpi ?? null,
        telefono ?? null,
        correo ?? null,
        fecha_ingreso ?? null,
        id_dependencia ?? null,
        id_puesto ?? null,
        req.params.id,
      ],
    );

    const deseaAcceso = acceso ?? current.id_usuario != null;
    if (deseaAcceso && !current.id_usuario) {
      if (!nombre_usuario || !id_rol || !clave || !correo) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Para habilitar acceso se requiere usuario, rol, clave y correo",
        });
      }
      const hashed = await bcrypt.hash(clave, 12);
      await client.query(
        `INSERT INTO usuario (id_empleado, id_rol, nombre_usuario, clave, correo, debe_cambiar_clave)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [req.params.id, id_rol, nombre_usuario, hashed, correo ?? current.correo],
      );
    } else if (deseaAcceso && current.id_usuario) {
      if (id_rol) {
        await client.query("UPDATE usuario SET id_rol = $1 WHERE id_usuario = $2", [
          id_rol,
          current.id_usuario,
        ]);
      }
      if (clave) {
        const hashed = await bcrypt.hash(clave, 12);
        await client.query(
          "UPDATE usuario SET clave = $1, debe_cambiar_clave = TRUE WHERE id_usuario = $2",
          [hashed, current.id_usuario],
        );
      }
    } else if (!deseaAcceso && current.id_usuario) {
      await client.query("UPDATE usuario SET activo = FALSE WHERE id_usuario = $1", [
        current.id_usuario,
      ]);
    }

    await client.query("COMMIT");
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "usuario_editado",
      ip: ipDe(req),
      modulo: "Usuarios",
      detalle: `Edición de ${current.nombre} ${current.apellido}`,
    });

    const { rows: full } = await pool.query(
      `${BASE_SELECT} WHERE e.id_empleado = $1`,
      [req.params.id],
    );
    res.json(dto(full[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505") {
      return res.status(409).json({ error: "DPI, correo o nombre de usuario duplicado" });
    }
    next(e);
  } finally {
    client.release();
  }
});

router.patch("/:id/estado", authorize("usuarios"), async (req, res, next) => {
  try {
    const { accion } = req.body; // "activar" | "desactivar" | "desbloquear"

    if (accion === "desbloquear") {
      await pool.query(
        "UPDATE usuario SET bloqueado_hasta = NULL, intentos_fallidos = 0 WHERE id_empleado = $1",
        [req.params.id],
      );
      return res.json({ ok: true });
    }

    if (!["activar", "desactivar"].includes(accion)) {
      return res.status(400).json({ error: "accion debe ser activar, desactivar o desbloquear" });
    }
    const activo = accion === "activar";
    const { rows } = await pool.query(
      "UPDATE empleado SET activo = $1 WHERE id_empleado = $2 RETURNING id_empleado",
      [activo, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "Personal no encontrado" });
    // Un empleado inactivo tampoco debe poder iniciar sesión.
    if (!activo) {
      await pool.query(
        "UPDATE usuario SET activo = FALSE WHERE id_empleado = $1",
        [req.params.id],
      );
    }
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: activo ? "usuario_activado" : "usuario_desactivado",
      ip: ipDe(req),
      modulo: "Usuarios",
      detalle: `${activo ? "Activación" : "Desactivación"} del personal ${req.params.id}`,
    });
    res.json({ ok: true, activo });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/reset-clave", authorize("usuarios"), async (req, res, next) => {
  try {
    const { clave_temporal } = req.body;
    if (!clave_temporal || clave_temporal.length < 8) {
      return res.status(400).json({ error: "clave_temporal debe tener mínimo 8 caracteres" });
    }
    const hashed = await bcrypt.hash(clave_temporal, 12);
    const { rows } = await pool.query(
      `UPDATE usuario
          SET clave = $1, debe_cambiar_clave = TRUE, bloqueado_hasta = NULL, intentos_fallidos = 0
        WHERE id_empleado = $2 RETURNING id_usuario`,
      [hashed, req.params.id],
    );
    if (!rows[0]) return res.status(404).json({ error: "El usuario no tiene cuenta de acceso" });
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "reset_clave",
      ip: ipDe(req),
      modulo: "Usuarios",
      detalle: `Clave temporal asignada al personal ${req.params.id}`,
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
