const { pool } = require("./src/db.js");
const fs = require("fs");
const path = require("path");

(async () => {
  const file = process.argv[2];
  if (!file) {
    console.error("Uso: node run_sql.cjs <ruta.sql>");
    process.exit(1);
  }
  const sql = fs.readFileSync(path.resolve(file), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("OK:", file);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("ERROR:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
