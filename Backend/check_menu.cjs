const { pool } = require('./src/db.js');
(async () => {
  const m = await pool.query("SELECT * FROM menu ORDER BY id_menu");
  console.log('MENUS:', JSON.stringify(m.rows, null, 2));
  const s = await pool.query("SELECT id_submenu, id_menu, nombre, controlador, vista, icono, activo FROM submenu ORDER BY id_menu, id_submenu");
  console.log('SUBMENUS:', JSON.stringify(s.rows, null, 2));
  const r = await pool.query("SELECT id_rol, descripcion, nombre_rol FROM rol ORDER BY id_rol");
  console.log('ROLES:', JSON.stringify(r.rows, null, 2));
  await pool.end();
})();
