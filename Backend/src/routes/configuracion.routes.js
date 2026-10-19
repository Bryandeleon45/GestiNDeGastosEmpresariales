import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";
import * as parametros from "../services/parametros.service.js";

const router = Router();

function toDataUrl(buf, mime) {
  if (!buf) return null;
  const b64 = Buffer.isBuffer(buf) ? buf.toString("base64") : Buffer.from(buf).toString("base64");
  return `data:${mime || "application/octet-stream"};base64,${b64}`;
}

function parseDataUrl(dataUrl) {
  const m = /^data:(.*?);base64,(.*)$/s.exec(dataUrl || "");
  if (!m) return { mime: null, buffer: null };
  return { mime: m[1] || null, buffer: Buffer.from(m[2], "base64") };
}

function identidadPublica(row) {
  return {
    nombre_institucion: row.nombre_institucion,
    nombre_corto: row.nombre_corto,
    nombre_sistema: row.nombre_sistema,
    subtitulo_gestion: row.subtitulo_gestion,
    subtitulo_portal: row.subtitulo_portal,
    lema: row.lema,
    color_principal: row.color_principal,
    colores_acento: row.colores_acento,
    logo: toDataUrl(row.logo, row.logo_mime),
    imagen_login: toDataUrl(row.imagen_login, row.imagen_login_mime),
  };
}

async function getPreferencias(idUsuario) {
  const { rows } = await pool.query(
    `INSERT INTO usuario_preferencia (id_usuario) VALUES ($1)
     ON CONFLICT (id_usuario) DO NOTHING`,
    [idUsuario],
  );
  const { rows: r2 } = await pool.query(
    `SELECT tema, color_acento, interfaz_compacta, animaciones, idioma, zona_horaria,
            notif_correo, notif_sistema, alertas_vencimiento
       FROM usuario_preferencia WHERE id_usuario = $1`,
    [idUsuario],
  );
  return r2[0];
}

// ── Inicial: datos de arranque tras el login ─────────────────────────────────
router.get("/inicial", authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM identidad_institucional WHERE id_identidad = 1`,
    );
    const preferencias = await getPreferencias(req.user.id_usuario);
    const publicos = await parametros.listar("SISTEMA");
    res.json({
      identidad: identidadPublica(rows[0]),
      preferencias,
      parametros_publicos: publicos.reduce((acc, p) => {
        acc[p.clave] = p.valor;
        return acc;
      }, {}),
    });
  } catch (e) {
    next(e);
  }
});

// ── Preferencias (Mi cuenta) ─────────────────────────────────────────────────
router.get("/preferencias", authenticate, async (req, res, next) => {
  try {
    res.json(await getPreferencias(req.user.id_usuario));
  } catch (e) {
    next(e);
  }
});

router.put("/preferencias", authenticate, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const campos = [
      "tema",
      "color_acento",
      "interfaz_compacta",
      "animaciones",
      "idioma",
      "zona_horaria",
      "notif_correo",
      "notif_sistema",
      "alertas_vencimiento",
    ];
    const set = [];
    const params = [req.user.id_usuario];
    for (const c of campos) {
      if (c in b) {
        set.push(`${c} = $${params.length + 1}`);
        params.push(b[c]);
      }
    }
    if (!set.length) return res.json(await getPreferencias(req.user.id_usuario));
    await pool.query(
      `INSERT INTO usuario_preferencia (id_usuario) VALUES ($1)
       ON CONFLICT (id_usuario) DO NOTHING`,
      [req.user.id_usuario],
    );
    await pool.query(
      `UPDATE usuario_preferencia SET ${set.join(", ")} WHERE id_usuario = $1`,
      params,
    );
    res.json(await getPreferencias(req.user.id_usuario));
  } catch (e) {
    next(e);
  }
});

router.patch("/preferencias", authenticate, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const permitidos = new Set([
      "tema",
      "color_acento",
      "interfaz_compacta",
      "animaciones",
      "idioma",
      "zona_horaria",
      "notif_correo",
      "notif_sistema",
      "alertas_vencimiento",
    ]);
    const campo = Object.keys(b).find((k) => permitidos.has(k));
    if (!campo) return res.status(400).json({ error: "Campo no permitido" });
    await pool.query(
      `INSERT INTO usuario_preferencia (id_usuario) VALUES ($1)
       ON CONFLICT (id_usuario) DO NOTHING`,
      [req.user.id_usuario],
    );
    await pool.query(
      `UPDATE usuario_preferencia SET ${campo} = $1 WHERE id_usuario = $2`,
      [b[campo], req.user.id_usuario],
    );
    res.json(await getPreferencias(req.user.id_usuario));
  } catch (e) {
    next(e);
  }
});

// ── Perfil (Mi cuenta) ───────────────────────────────────────────────────────
router.get("/perfil", authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id_empleado, e.nombre, e.apellido, e.telefono, e.correo,
              e.fecha_ingreso, p.descripcion AS cargo, d.nombre_dependencia,
              d.siglas, u.nombre_usuario, up.foto, up.foto_mime
         FROM usuario u
         JOIN empleado e ON e.id_empleado = u.id_empleado
         LEFT JOIN puesto p ON p.id_puesto = e.id_puesto
         LEFT JOIN dependencia_municipal d ON d.id_dependencia = e.id_dependencia
         LEFT JOIN usuario_preferencia up ON up.id_usuario = u.id_usuario
        WHERE u.id_usuario = $1`,
      [req.user.id_usuario],
    );
    const row = rows[0];
    if (!row) return res.json(null);
    const { foto, foto_mime, ...resto } = row;
    res.json({ ...resto, foto: toDataUrl(foto, foto_mime) });
  } catch (e) {
    next(e);
  }
});

router.put("/perfil", authenticate, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const { rows } = await pool.query(
      `SELECT id_empleado FROM usuario WHERE id_usuario = $1`,
      [req.user.id_usuario],
    );
    const idEmpleado = rows[0]?.id_empleado;
    if (idEmpleado) {
      await pool.query(
        `UPDATE empleado
            SET nombre = COALESCE($1, nombre),
                apellido = COALESCE($2, apellido),
                telefono = COALESCE($3, telefono)
          WHERE id_empleado = $4`,
        [b.nombre ?? null, b.apellido ?? null, b.telefono ?? null, idEmpleado],
      );
    }
    if (b.foto != null) {
      const { mime, buffer } = parseDataUrl(b.foto);
      await pool.query(
        `INSERT INTO usuario_preferencia (id_usuario, foto, foto_mime)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_usuario)
         DO UPDATE SET foto = EXCLUDED.foto, foto_mime = EXCLUDED.foto_mime`,
        [req.user.id_usuario, buffer, mime],
      );
    }
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "perfil_actualizado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: "Actualización de datos de perfil propio",
    });
    const { rows: r2 } = await pool.query(
      `SELECT e.nombre, e.apellido, e.telefono, e.correo, p.descripcion AS cargo,
              up.foto, up.foto_mime
         FROM usuario u
         JOIN empleado e ON e.id_empleado = u.id_empleado
         LEFT JOIN puesto p ON p.id_puesto = e.id_puesto
         LEFT JOIN usuario_preferencia up ON up.id_usuario = u.id_usuario
        WHERE u.id_usuario = $1`,
      [req.user.id_usuario],
    );
    const row = r2[0];
    if (!row) return res.json(null);
    const { foto, foto_mime, ...resto } = row;
    res.json({ ...resto, foto: toDataUrl(foto, foto_mime) });
  } catch (e) {
    next(e);
  }
});

// ── Notificaciones (Mi cuenta) ───────────────────────────────────────────────
router.get("/notificaciones", authenticate, async (req, res, next) => {
  try {
    const p = await getPreferencias(req.user.id_usuario);
    res.json({
      notif_correo: p.notif_correo,
      notif_sistema: p.notif_sistema,
      alertas_vencimiento: p.alertas_vencimiento,
    });
  } catch (e) {
    next(e);
  }
});

router.put("/notificaciones", authenticate, async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const campos = ["notif_correo", "notif_sistema", "alertas_vencimiento"];
    const set = [];
    const params = [req.user.id_usuario];
    for (const c of campos) {
      if (typeof b[c] === "boolean") {
        set.push(`${c} = $${params.length + 1}`);
        params.push(b[c]);
      }
    }
    if (set.length) {
      await pool.query(
        `INSERT INTO usuario_preferencia (id_usuario) VALUES ($1)
         ON CONFLICT (id_usuario) DO NOTHING`,
        [req.user.id_usuario],
      );
      await pool.query(
        `UPDATE usuario_preferencia SET ${set.join(", ")} WHERE id_usuario = $1`,
        params,
      );
    }
    const p = await getPreferencias(req.user.id_usuario);
    res.json({
      notif_correo: p.notif_correo,
      notif_sistema: p.notif_sistema,
      alertas_vencimiento: p.alertas_vencimiento,
    });
  } catch (e) {
    next(e);
  }
});

// ── Identidad institucional (Administración) ────────────────────────────────
router.get("/identidad", authenticate, authorize("configuracion"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM identidad_institucional WHERE id_identidad = 1`,
    );
    res.json({
      ...rows[0],
      logo: toDataUrl(rows[0].logo, rows[0].logo_mime),
      imagen_login: toDataUrl(rows[0].imagen_login, rows[0].imagen_login_mime),
    });
  } catch (e) {
    next(e);
  }
});

router.put("/identidad", authenticate, authorize("configuracion"), async (req, res, next) => {
  try {
    const b = req.body ?? {};
    const campos = [
      "nombre_institucion",
      "nombre_corto",
      "nombre_sistema",
      "subtitulo_gestion",
      "subtitulo_portal",
      "lema",
      "nit_institucional",
      "direccion",
      "telefono",
      "correo_contacto",
      "color_principal",
      "colores_acento",
    ];
    const set = [];
    const params = [req.user.id_usuario];
    for (const c of campos) {
      if (c in b) {
        set.push(`${c} = $${params.length + 1}`);
        params.push(b[c]);
      }
    }
    if (set.length) {
      await pool.query(
        `UPDATE identidad_institucional
            SET ${set.join(", ")}, fecha_actualizacion = now(), id_usuario_actualiza = $1
          WHERE id_identidad = 1`,
        params,
      );
    }
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "identidad_actualizada",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: "Actualización de identidad institucional",
    });
    const { rows } = await pool.query(
      `SELECT * FROM identidad_institucional WHERE id_identidad = 1`,
    );
    res.json({ ...rows[0], logo: toDataUrl(rows[0].logo, rows[0].logo_mime) });
  } catch (e) {
    next(e);
  }
});

// ── Parámetros del sistema (Administración) ─────────────────────────────────
router.get("/parametros", authenticate, authorize("configuracion"), async (req, res, next) => {
  try {
    const grupo = req.query.grupo?.toString().trim() || "";
    res.json(await parametros.listar(grupo));
  } catch (e) {
    next(e);
  }
});

router.get("/parametros/:clave/historial", authenticate, authorize("configuracion"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT h.id_historial, h.clave, h.valor_anterior, h.valor_nuevo, h.fecha,
              e.nombre, e.apellido, u.nombre_usuario
         FROM parametro_historial h
         JOIN usuario u ON u.id_usuario = h.id_usuario
         LEFT JOIN empleado e ON e.id_empleado = u.id_empleado
        WHERE h.clave = $1
        ORDER BY h.fecha DESC
        LIMIT 50`,
      [req.params.clave],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.put("/parametros/:clave", authenticate, authorize("configuracion"), async (req, res, next) => {
  try {
    const clave = req.params.clave;
    const valor = req.body?.valor;
    if (valor === undefined || valor === null || valor === "") {
      return res.status(400).json({ error: "El valor es obligatorio" });
    }
    const valorNuevo = await parametros.cambiar(clave, valor, req.user.id_usuario);
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "parametro_cambiado",
      ip: ipDe(req),
      modulo: "Configuración",
      detalle: `Parámetro ${clave} → ${valorNuevo}`,
    });
    res.json({ clave, valor: valorNuevo });
  } catch (e) {
    if (e.message.includes("mínimo") || e.message.includes("máximo") || e.message.includes("inválido") || e.message.includes("Debe ser") || e.message.includes("desconocido")) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

// ── Sesiones abiertas (Mi cuenta) ────────────────────────────────────────────
router.get("/sesiones", authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id_sesion, navegador, ip_acceso, fecha_inicio, ultimo_uso, expira,
              (token_hash = $2) AS actual
         FROM sesion_usuario
        WHERE id_usuario = $1 AND NOT revocada
        ORDER BY fecha_inicio DESC`,
      [req.user.id_usuario, req.token_hash],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.delete("/sesiones/:id", authenticate, async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE sesion_usuario SET revocada = TRUE, motivo_cierre = 'LOGOUT'
        WHERE id_sesion = $1 AND id_usuario = $2`,
      [req.params.id, req.user.id_usuario],
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/sesiones", authenticate, async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE sesion_usuario SET revocada = TRUE, motivo_cierre = 'LOGOUT'
        WHERE id_usuario = $1 AND token_hash <> $2`,
      [req.user.id_usuario, req.token_hash],
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
