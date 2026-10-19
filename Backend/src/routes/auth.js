import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { firmarToken } from "../utils/jwt.js";
import { authenticate } from "../middlewares/authenticate.js";
import { getMenuPermitido } from "../services/menu.service.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

function toDataUrl(buf, mime) {
  if (!buf) return null;
  const b64 = Buffer.isBuffer(buf) ? buf.toString("base64") : Buffer.from(buf).toString("base64");
  return `data:${mime || "application/octet-stream"};base64,${b64}`;
}

router.post("/login", async (req, res, next) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: "usuario y password son requeridos" });
    }

    const { rows } = await pool.query(
      `SELECT u.*, e.nombre, e.apellido, r.nombre_rol, r.descripcion AS rol_descripcion,
              up.foto, up.foto_mime
         FROM usuario u
         LEFT JOIN empleado e ON e.id_empleado = u.id_empleado
         JOIN rol r ON r.id_rol = u.id_rol
         LEFT JOIN usuario_preferencia up ON up.id_usuario = u.id_usuario
        WHERE u.nombre_usuario = $1 OR u.correo = $1`,
      [usuario],
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (!user.activo) {
      return res.status(401).json({ error: "Usuario inactivo" });
    }
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      return res.status(403).json({
        error: `Cuenta bloqueada. Intente de nuevo en unos minutos.`,
      });
    }

    const valid = await bcrypt.compare(password, user.clave);
    const ip = ipDe(req);

    if (!valid) {
      const intentos = user.intentos_fallidos + 1;
      if (intentos >= MAX_INTENTOS) {
        await pool.query(
          `UPDATE usuario SET intentos_fallidos = 0,
              bloqueado_hasta = now() + ($1 * interval '1 minute')
            WHERE id_usuario = $2`,
          [BLOQUEO_MINUTOS, user.id_usuario],
        );
      } else {
        await pool.query(
          "UPDATE usuario SET intentos_fallidos = $1 WHERE id_usuario = $2",
          [intentos, user.id_usuario],
        );
      }
      await registrarBitacora({
        idUsuario: user.id_usuario,
        accion: "login_fallido",
        ip,
        modulo: "Autenticación",
        detalle: `Intento fallido de inicio de sesión (${intentos}/${MAX_INTENTOS})`,
      });
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    await pool.query(
      `UPDATE usuario
          SET intentos_fallidos = 0, bloqueado_hasta = NULL, fecha_ultimo_acceso = now()
        WHERE id_usuario = $1`,
      [user.id_usuario],
    );
    await registrarBitacora({
      idUsuario: user.id_usuario,
      accion: "login_exitoso",
      ip,
      modulo: "Autenticación",
      detalle: "Inicio de sesión correcto",
    });

    const menu = await getMenuPermitido(user.id_rol);
    const token = firmarToken({
      sub: user.id_usuario,
      usuario: user.nombre_usuario,
      rol: user.id_rol,
    });

    // Registra la sesión para poder listarla y cerrarla de forma remota.
    const decoded = jwt.decode(token);
    const expira = decoded?.exp ? new Date(decoded.exp * 1000) : null;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await pool.query(
      `INSERT INTO sesion_usuario (id_usuario, token_hash, ip_acceso, navegador, expira)
       VALUES ($1, $2, $3, $4, COALESCE($5, now() + interval '8 hours'))`,
      [
        user.id_usuario,
        tokenHash,
        ip,
        (req.headers["user-agent"] || "").slice(0, 200) || null,
        expira,
      ],
    );

    res.json({
      token,
      menu,
      debe_cambiar_clave: user.debe_cambiar_clave,
      user: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        id_rol: user.id_rol,
        nombre_completo: user.nombre ? `${user.nombre} ${user.apellido}`.trim() : user.nombre_usuario,
        rol: user.nombre_rol || user.rol_descripcion,
        foto: toDataUrl(user.foto, user.foto_mime),
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", authenticate, async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE sesion_usuario SET revocada = TRUE, motivo_cierre = 'LOGOUT'
        WHERE token_hash = $1`,
      [req.token_hash],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "logout",
      ip: ipDe(req),
      modulo: "Autenticación",
      detalle: "Cierre de sesión",
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/cambiar-clave", authenticate, async (req, res, next) => {
  try {
    const { clave_actual, clave_nueva } = req.body;
    if (!clave_actual || !clave_nueva) {
      return res
        .status(400)
        .json({ error: "clave_actual y clave_nueva son requeridos" });
    }
    if (clave_nueva.length < 8) {
      return res.status(400).json({ error: "La clave debe tener mínimo 8 caracteres" });
    }

    const { rows } = await pool.query(
      "SELECT clave FROM usuario WHERE id_usuario = $1",
      [req.user.id_usuario],
    );
    const valid = await bcrypt.compare(clave_actual, rows[0].clave);
    if (!valid) {
      return res.status(401).json({ error: "La clave actual es incorrecta" });
    }

    const hashed = await bcrypt.hash(clave_nueva, 12);
    await pool.query(
      "UPDATE usuario SET clave = $1, debe_cambiar_clave = FALSE WHERE id_usuario = $2",
      [hashed, req.user.id_usuario],
    );
    // Cerrar las demás sesiones del usuario (regla 10 del plan).
    await pool.query(
      `UPDATE sesion_usuario SET revocada = TRUE, motivo_cierre = 'CLAVE_CAMBIADA'
        WHERE id_usuario = $1 AND token_hash <> $2`,
      [req.user.id_usuario, req.token_hash],
    );
    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "cambio_clave",
      ip: ipDe(req),
      modulo: "Autenticación",
      detalle: "Cambio de clave propia",
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/recuperar", async (req, res, next) => {
  try {
    const { correo } = req.body;
    if (!correo) return res.status(400).json({ error: "correo es requerido" });

    const { rows } = await pool.query(
      "SELECT id_usuario FROM usuario WHERE correo = $1 AND activo",
      [correo],
    );
    if (!rows[0]) {
      // Respuesta genérica para no revelar si el correo existe.
      return res.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await pool.query(
      `INSERT INTO token_reset (id_usuario, token_hash, expira)
       VALUES ($1, $2, now() + interval '30 minutes')`,
      [rows[0].id_usuario, tokenHash],
    );
    await registrarBitacora({
      idUsuario: rows[0].id_usuario,
      accion: "reset_solicitado",
      ip: ipDe(req),
      modulo: "Autenticación",
      detalle: "Solicitud de restablecimiento de clave",
    });

    // Sin servicio de correo, se devuelve el token para pruebas.
    res.json({ ok: true, token_reset: token });
  } catch (e) {
    next(e);
  }
});

router.post("/restablecer", async (req, res, next) => {
  try {
    const { token, clave_nueva } = req.body;
    if (!token || !clave_nueva) {
      return res.status(400).json({ error: "token y clave_nueva son requeridos" });
    }
    if (clave_nueva.length < 8) {
      return res.status(400).json({ error: "La clave debe tener mínimo 8 caracteres" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { rows } = await pool.query(
      `SELECT * FROM token_reset
        WHERE token_hash = $1 AND usado = FALSE AND expira > now()`,
      [tokenHash],
    );
    if (!rows[0]) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const hashed = await bcrypt.hash(clave_nueva, 12);
    await pool.query(
      "UPDATE usuario SET clave = $1, debe_cambiar_clave = FALSE WHERE id_usuario = $2",
      [hashed, rows[0].id_usuario],
    );
    await pool.query("UPDATE token_reset SET usado = TRUE WHERE id_token = $1", [
      rows[0].id_token,
    ]);
    await registrarBitacora({
      idUsuario: rows[0].id_usuario,
      accion: "reset_completado",
      ip: ipDe(req),
      modulo: "Autenticación",
      detalle: "Clave restablecida mediante token",
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
