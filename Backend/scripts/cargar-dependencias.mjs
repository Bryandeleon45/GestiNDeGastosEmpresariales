import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const OUT_DIR = path.join(__dirname, "..", "backups");

const RENOMBRAR = [
  [9, "Dirección Municipal de Planificación", "DMP"],
  [10, "Dirección de Administración Financiera Integrada Municipal", "DAFIM"],
  [11, "Dirección Municipal de la Mujer", "DMM"],
  [12, "Oficina Municipal de Agua y Saneamiento", "OMAS"],
  [14, "Secretaría Municipal", "SECR"],
  [15, "Alcaldía Municipal", "AM"],
  [16, "Unidad de Compras y Contrataciones", "UCC"],
];

const BORRAR = [13]; // DIGAM

const NUEVOS = [
  ["Concejo Municipal", "CM"],
  ["Unidad de Auditoría Interna", "UDAI"],
  ["Juzgado de Asuntos Municipales", "JAM"],
  ["Tesorería Municipal", "TES"],
  ["Oficina de Catastro y Control del IUSI", "IUSI"],
  ["Dirección de Servicios Públicos Municipales", "DSPM"],
  ["Oficina de Tren de Aseo y Manejo de Desechos Sólidos", "ASEO"],
  ["Dirección de Obras e Infraestructura", "DOI"],
  ["Oficina Municipal de Desarrollo Económico Local", "OMDEL"],
  ["Oficina de Juventud, Educación, Cultura y Deporte", "JECD"],
  ["Oficina de Organización Comunitaria y Coordinación de COCODES", "COCODES"],
  ["Oficina Municipal de Protección a la Niñez, Adolescencia y Discapacidad", "NINEZ"],
  ["Policía Municipal", "PM"],
  ["Policía Municipal de Tránsito", "PMT"],
  ["Unidad de Gestión Ambiental Municipal", "UGAM"],
  ["Oficina Municipal de Gestión de Riesgos y Desastres", "GRD"],
  ["Oficina de Recursos Humanos", "RRHH"],
  ["Unidad de Acceso a la Información Pública", "UAIP"],
  ["Oficina de Comunicación Social y Relaciones Públicas", "COM"],
];

function newPool() {
  return new pg.Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "123456",
    database: process.env.PGDATABASE || "GestionCadenadeProveedores",
  });
}

async function backup() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = path.join(OUT_DIR, `dependencias_antes_${ts}.sql`);
  execFileSync(
    "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe",
    [
      "-h", process.env.PGHOST || "localhost",
      "-p", process.env.PGPORT || "5432",
      "-U", process.env.PGUSER || "postgres",
      "-d", process.env.PGDATABASE || "GestionCadenadeProveedores",
      "-F", "p", "--no-owner", "--no-privileges", "-f", out,
    ],
    { env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || "123456" }, stdio: "inherit" },
  );
  console.log("Respaldo:", out);
}

async function aplicar(client) {
  for (const [id, nombre, siglas] of RENOMBRAR) {
    await client.query(
      "UPDATE dependencia_municipal SET nombre_dependencia = $1, siglas = $2 WHERE id_dependencia = $3",
      [nombre, siglas, id],
    );
  }
  await client.query("DELETE FROM dependencia_municipal WHERE id_dependencia = ANY($1::int[])", [BORRAR]);
  for (const [nombre, siglas] of NUEVOS) {
    await client.query(
      "INSERT INTO dependencia_municipal (nombre_dependencia, siglas) VALUES ($1,$2)",
      [nombre, siglas],
    );
  }
}

async function estado(client) {
  const r = await client.query(
    "SELECT id_dependencia, nombre_dependencia, siglas FROM dependencia_municipal WHERE activo ORDER BY id_dependencia",
  );
  const dupNom = await client.query(
    "SELECT count(*)::int n FROM (SELECT nombre_dependencia FROM dependencia_municipal GROUP BY nombre_dependencia HAVING count(*) > 1) t",
  );
  const dupSig = await client.query(
    "SELECT count(*)::int n FROM (SELECT siglas FROM dependencia_municipal WHERE siglas IS NOT NULL GROUP BY siglas HAVING count(*) > 1) t",
  );
  return { total: r.rowCount, duplicadosNombre: dupNom.rows[0].n, duplicadosSigla: dupSig.rows[0].n };
}

async function main() {
  const pool = newPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await aplicar(client);
    const s = await estado(client);
    await client.query("ROLLBACK");
    console.log("=== DRY-RUN (ROLLBACK) ===");
    console.log("dependencias que quedarían:", s.total, "| duplicados nombre:", s.duplicadosNombre, "| duplicados sigla:", s.duplicadosSigla);

    await backup();
    await client.query("BEGIN");
    await aplicar(client);
    await client.query("COMMIT");
    console.log("=== APPLY OK ===");
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("ERROR (ROLLBACK):", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  const vp = newPool();
  const s = await estado(vp);
  console.log("=== VERIFICACIÓN FINAL ===");
  console.log("total activas:", s.total, "| duplicados nombre:", s.duplicadosNombre, "| duplicados sigla:", s.duplicadosSigla);
  const e = await vp.query(
    "SELECT e.id_empleado, e.nombre, e.apellido, d.nombre_dependencia FROM empleado e JOIN dependencia_municipal d ON d.id_dependencia = e.id_dependencia",
  );
  console.log("empleados:", JSON.stringify(e.rows));
  const list = await vp.query(
    "SELECT nombre_dependencia, siglas FROM dependencia_municipal WHERE activo ORDER BY id_dependencia",
  );
  for (const r of list.rows) console.log(`  ${r.siglas ?? "-".padEnd(4)} ${r.nombre_dependencia}`);
  await vp.end();
}

main();
