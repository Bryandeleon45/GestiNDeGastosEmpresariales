const { pool } = require('./src/db.js');
(async () => {
  const b = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='bitacora_acceso' ORDER BY ordinal_position");
  console.log('bitacora_acceso cols:', b.rows.map(r => r.column_name + ':' + r.data_type).join(', '));
  await pool.end();
})();
