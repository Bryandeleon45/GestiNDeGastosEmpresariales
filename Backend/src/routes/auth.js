import { Router } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { firmarToken } from "../utils/jwt.js";
import { authenticate } from "../middlewares/authenticate.js";
import { getMenuPermitido } from "../services/menu.service.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

router.post("/login", async (req, res, next) => {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: "usuario y password son requeridos" });
    }

    const { rows } = await pool.query(
      `SELECT u.*, e.nombre, e.apellido, r.nombre_rol, r.descripcion AS rol_descripcion
         FROM usuario u
         JOIN empleado e ON e.id_empleado = u.id_empleado
         JOIN rol r ON r.id_rol = u.id_rol
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

    res.json({
      token,
      menu,
      debe_cambiar_clave: user.debe_cambiar_clave,
      user: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        id_rol: user.id_rol,
        nombre_completo: `${user.nombre} ${user.apellido}`.trim(),
        rol: user.nombre_rol || user.rol_descripcion,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", authenticate, async (req, res, next) => {
  try {
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
