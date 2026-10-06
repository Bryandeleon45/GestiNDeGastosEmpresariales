import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// Devolver columnas DATE como "YYYY-MM-DD" (sin conversión a Date con zona horaria).
pg.types.setTypeParser(1082, (val) => val);

export const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "123456",
  database: process.env.PGDATABASE || "GestionCadenadeProveedores",
});
