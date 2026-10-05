const { pool } = require('./src/db.js');
(async () => {
  const u = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='usuario' ORDER BY ordinal_position");
  console.log('usuario cols:', u.rows.map(r => r.column_name).join(', '));
  const e = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='empleado' ORDER BY ordinal_position");
  console.log('empleado cols:', e.rows.map(r => r.column_name).join(', '));
  const r = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='rol' ORDER BY ordinal_position");
  console.log('rol cols:', r.rows.map(r => r.column_name).join(', '));
  await pool.end();
})();
