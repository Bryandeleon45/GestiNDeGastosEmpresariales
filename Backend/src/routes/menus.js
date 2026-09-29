import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

const router = Router();

router.use(authenticate);

// Lista completa de menús y submenús activos (para construir la matriz de permisos).
router.get("/", authorize("roles"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.id_menu, m.nombre AS menu, m.icono AS menu_icono,
              s.id_submenu, s.nombre AS submenu, s.controlador, s.vista, s.icono
         FROM menu m
         JOIN submenu s ON s.id_menu = m.id_menu
        WHERE m.activo AND s.activo
        ORDER BY m.id_menu, s.id_submenu`,
    );
    const menus = [];
    const map = new Map();
    for (const row of rows) {
      if (!map.has(row.id_menu)) {
        map.set(row.id_menu, {
          id: row.id_menu,
          nombre: row.menu,
          icono: row.menu_icono,
          submenus: [],
        });
        menus.push(map.get(row.id_menu));
      }
      map.get(row.id_menu).submenus.push({
        id: row.id_submenu,
        nombre: row.submenu,
        controlador: row.controlador,
        vista: row.vista,
        icono: row.icono,
      });
    }
    res.json(menus);
  } catch (e) {
    next(e);
  }
});

export default router;
