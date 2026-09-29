import { pool } from "../db.js";

// Devuelve los menús y submenús permitidos para un rol (menú lateral dinámico).
export async function getMenuPermitido(idRol) {
  const { rows: submenus } = await pool.query(
    `SELECT m.id_menu, m.nombre AS menu, m.icono AS menu_icono,
            s.id_submenu, s.nombre AS submenu, s.controlador, s.vista, s.icono
       FROM permiso p
       JOIN submenu s ON s.id_submenu = p.id_submenu
       JOIN menu m ON m.id_menu = s.id_menu
      WHERE p.id_rol = $1 AND p.activo AND s.activo AND m.activo
      ORDER BY m.id_menu, s.id_submenu`,
    [idRol],
  );

  const menus = [];
  const map = new Map();
  for (const row of submenus) {
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
  return menus;
}
