import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

// Devolver columnas DATE como "YYYY-MM-DD" (sin conversión a Date con zona horaria).
pg.types.setTypeParser(1082, (val) => val);

const url = process.env.DATABASE_URL?.trim();

export const pool = url
  ? new Pool({
      connectionString: url,
      ssl: process.env.PGSSL === "false" ? false : true,
      max: Number(process.env.PGPOOL_MAX || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "123456",
      database: process.env.PGDATABASE || "GestionCadenadeProveedores",
    });

pool.on("error", (err) => console.error("[db] idle client error:", err.message));
