const { pool } = require('./src/db.js');

async function check() {
  try {
    const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));

    const deps = await pool.query('SELECT * FROM dependencia_municipal ORDER BY id_dependencia');
    console.log('Dependencias:', deps.rows);

    const periodo = await pool.query('SELECT * FROM periodo_fiscal');
    console.log('Periodo fiscal:', periodo.rows);

    const pres = await pool.query('SELECT * FROM presupuesto_dependencia');
    console.log('Presupuesto dependencia:', pres.rows);

    const req = await pool.query('SELECT * FROM requisicion LIMIT 5');
    console.log('Requisiciones sample:', req.rows);

    const det = await pool.query('SELECT * FROM detalle_requisicion LIMIT 5');
    console.log('Detalle requisicion sample:', det.rows);
  } catch(e) { console.error(e.message); }
  finally { await pool.end(); process.exit(0); }
}

check();