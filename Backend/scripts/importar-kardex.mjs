import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const REPO_ROOT = path.resolve(__dirname, "..", "..");

const require = createRequire(import.meta.url);
const ExcelJS = require(
  path.join(
    REPO_ROOT,
    "Frontend",
    "municompras-web",
    "node_modules",
    "exceljs",
    "excel.js",
  ),
);

const EXCEL =
  process.env.KARDEX_EXCEL ||
  path.join(REPO_ROOT, "kardex", "CARDEX..xlsx");
const OUT_DIR = path.join(__dirname, "..", "backups");
const OUT_JSON = path.join(OUT_DIR, "kardex_insumos.json");
const OUT_CSV = path.join(OUT_DIR, "kardex_preview.csv");

const CATEGORIAS = {
  CEMENTO: 2,
  "ARENA Y PIEDRIN": 2,
  "ARTICULOS DE METAL": 2,
  CLAVOS: 2,
  TORNILLOS: 2,
  MADERA: 2,
  ELECTRODO: 2,
  CHAPAS: 2,
  "ACCESORIOS PVC": 4,
  SANITARIOS: 4,
  "LLAVES DE COMPUERTA": 4,
  "ACCESORIOS ELECTRICOS": 3,
  LIBRERIA: 1,
  SELLOS: 1,
  "EQUIPO COMPUTO": 5,
  "ACCESORIOS DE LIMPIEZA": 9,
  "PRODUCTOS QUIMICOS": 9,
  "DISCOS DE CORTE Y PULIR": 7,
  "BROCHAS Y RODOS": 7,
  "HERRAMIENTAS MENORES": 7,
  "PINTURAS Y TINTES": 10,
  THINER: 10,
  "MATERIALES DE PLASTICO": 10,
  "REPUESTOS Y ACCESORIOS": 10,
  LUBRICANTES: 10,
  LLANTAS: 10,
  "BOTAS DE HULE": 10,
  "CILINDRO DE GAS": 10,
  WYPE: 10,
  LAZO: 10,
  PURINA: 10,
  "PRODUCTOS E INSUMO": 10,
};
const CATEGORIA_FALLBACK = 10;
const UNIDAD_DEFECTO = 1; // Unidad (UND)

const DEST_MANUAL = [
  "BODEGA", "CAMPO", "MERCADO", "DIGAM", "OMAS", "PMT", "MECANICO", "HERRERIA",
  "TALLER", "MUNI", "DESPACHO", "SECRETARIA", "DMM", "DAFIM", "DMP", "DMT", "DTM",
  "BIBLIOTECA", "TURISMO", "DEPORTES", "ESTADIO", "ADULTO MAYOR", "REFUGIO CANINO",
  "COCODE", "POZO", "JORNADA", "SALON", "ESCUELA", "CENTRO", "RECURSOS HUMANOS",
  "RECAUDACION", "ALUMBRADO", "PARQUE", "MALECON", "PLANTA", "PLAN", "CUADRILLA",
  "INVENTARIO", "DISCAPACIDAD", "INFORMATICA", "ELECTRICISTA", "SOS", "IUSI",
  "RECEPCION", "PAMUCH", "JUZGADO", "OFICINA", "COMITE", "AREA", "NUEVO", "NUEVA",
];

function fuzzy(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s*\/\s*/g, "/")
    .replace(/[^A-Z0-9/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function num(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object") v = v.result ?? v.text ?? "";
  const s = String(v).trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function fechaValida(dia, mes, anio) {
  if (dia === null || mes === null || anio === null) return null;
  const y = anio < 100 ? 2000 + anio : anio;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const d = new Date(Date.UTC(y, mes - 1, dia));
  if (d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return `${y}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function categoriaDe(grupo) {
  const g = fuzzy(grupo);
  for (const [nombre, id] of Object.entries(CATEGORIAS)) {
    if (fuzzy(nombre) === g) return id;
  }
  return CATEGORIA_FALLBACK;
}

function buildDestinations(rows) {
  const set = new Set(DEST_MANUAL.map(fuzzy));
  for (const r of rows) {
    const d = fuzzy(r.detalle);
    if (d.includes("/")) {
      const pre = fuzzy(d.split("/")[0]);
      if (pre) set.add(pre);
    }
  }
  return [...set].filter((x) => x.length >= 2).sort((a, b) => b.length - a.length);
}

function extractItem(detalle, destinations) {
  const d = fuzzy(detalle);
  if (!d) return null;
  if (d.includes("/")) {
    const item = d.slice(d.indexOf("/") + 1).replace(/^[\s/]+/, "").trim();
    return item || null;
  }
  for (const dest of destinations) {
    if (d === dest) return null;
    if (d.startsWith(dest) && d.length > dest.length) {
      const rest = d.slice(dest.length).trim();
      if (rest && rest.length >= 2) return rest;
    }
  }
  return d;
}

async function leerExcel() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL);
  const rows = [];
  let si = 0;
  for (const ws of wb.worksheets) {
    const grupo = fuzzy(ws.getRow(8).getCell(21).value) || fuzzy(ws.getRow(8).getCell(22).value);
    for (let r = 13; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const detalle = row.getCell(5).value;
      const dia = num(row.getCell(2).value);
      const mes = num(row.getCell(3).value);
      const anio = num(row.getCell(4).value);
      const entrada = num(row.getCell(15).value) || 0;
      const salida = num(row.getCell(17).value) || 0;
      const precio = num(row.getCell(21).value);
      const fecha = fechaValida(dia, mes, anio);
      if (!fuzzy(detalle) && entrada === 0 && salida === 0) continue;
      rows.push({ hoja: ws.name, grupo, detalle, fecha, entrada, salida, precio, si, ri: r });
    }
    si++;
  }
  return rows;
}

function agregar(rows) {
  const destinations = buildDestinations(rows);
  const items = new Map();
  let sinArticulo = 0;
  for (const r of rows) {
    const item = extractItem(r.detalle, destinations);
    if (!item) {
      sinArticulo++;
      continue;
    }
    let rec = items.get(item);
    if (!rec) {
      rec = {
        nombre: item,
        totalEntrada: 0,
        totalSalida: 0,
        precio: null,
        grupos: new Set(),
        categorias: new Map(),
        ejemplos: [],
      };
      items.set(item, rec);
    }
    rec.totalEntrada += r.entrada;
    rec.totalSalida += r.salida;
    if (r.precio !== null && r.precio > 0) rec.precio = r.precio;
    if (r.grupo) rec.grupos.add(r.grupo);
    const cat = categoriaDe(r.grupo);
    rec.categorias.set(cat, (rec.categorias.get(cat) || 0) + 1);
    if (rec.ejemplos.length < 3) rec.ejemplos.push(fuzzy(r.detalle));
  }
  const list = [];
  for (const rec of items.values()) {
    let cat = CATEGORIA_FALLBACK;
    let best = -1;
    for (const [c, n] of rec.categorias.entries()) {
      if (n > best) {
        best = n;
        cat = c;
      }
    }
    list.push({
      nombre: rec.nombre,
      id_categoria: cat,
      id_unidad_medida: UNIDAD_DEFECTO,
      precio_referencial: rec.precio ?? 0,
      total_entrada: Math.round(rec.totalEntrada),
      total_salida: Math.round(rec.totalSalida),
      stock_net: Math.round(rec.totalEntrada - rec.totalSalida),
      stock: Math.max(0, Math.round(rec.totalEntrada - rec.totalSalida)),
      grupos: [...rec.grupos].sort(),
      ejemplos: rec.ejemplos,
    });
  }
  list.sort((a, b) => a.nombre.localeCompare(b.nombre));
  return { list, sinArticulo, totalRows: rows.length, destinations };
}

function esc(s) {
  const t = String(s ?? "");
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

async function preview() {
  mkdirSync(OUT_DIR, { recursive: true });
  const rows = await leerExcel();
  const { list, sinArticulo, totalRows, destinations } = agregar(rows);

  writeFileSync(OUT_JSON, JSON.stringify(list, null, 2), "utf8");

  const header = [
    "nombre", "categoria_id", "unidad_id", "precio_referencial",
    "total_entrada", "total_salida", "stock_net", "stock", "grupos", "ejemplos",
  ];
  const lines = [header.join(",")];
  for (const it of list) {
    lines.push(
      [
        esc(it.nombre),
        it.id_categoria,
        it.id_unidad_medida,
        it.precio_referencial,
        it.total_entrada,
        it.total_salida,
        it.stock_net,
        it.stock,
        esc(it.grupos.join("|")),
        esc(it.ejemplos.join(" | ")),
      ].join(","),
    );
  }
  writeFileSync(OUT_CSV, lines.join("\n"), "utf8");

  const conStock = list.filter((x) => x.stock_net > 0).length;
  const negativos = list.filter((x) => x.stock_net < 0).length;
  const cero = list.filter((x) => x.stock_net === 0).length;
  const porCat = {};
  for (const it of list) porCat[it.id_categoria] = (porCat[it.id_categoria] || 0) + 1;

  console.log("=== PREVIEW ===");
  console.log("Excel:", EXCEL);
  console.log("filas leídas:", totalRows, "| sin artículo identificado:", sinArticulo);
  console.log("artículos únicos:", list.length, "| stock_net > 0:", conStock, "| = 0:", cero, "| < 0 (negativo):", negativos);
  console.log("por categoría (id:cantidad):", JSON.stringify(porCat));
  console.log("destinos detectados:", destinations.length);
  console.log("JSON ->", OUT_JSON);
  console.log("CSV  ->", OUT_CSV);

  const sospechosos = list
    .filter((x) => x.nombre.length < 3 || x.nombre.includes("/"))
    .slice(0, 30);
  console.log("\nArtículos sospechosos (cortos o con '/'), máx 30:");
  for (const s of sospechosos) console.log("  -", s.nombre, "| ej:", s.ejemplos.join(" | "));

  console.log("\nMuestra (primeros 40):");
  for (const s of list.slice(0, 40))
    console.log(`  ${s.nombre.padEnd(40)} cat=${s.id_categoria} E=${s.total_entrada} S=${s.total_salida} net=${s.stock_net} stock=${s.stock} precio=${s.precio_referencial}`);
}

async function backup() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = path.join(OUT_DIR, `kardex_antes_aplicar_${ts}.sql`);
  const pgdump = "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe";
  execFileSync(
    pgdump,
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

async function apply() {
  if (!existsSync(OUT_JSON)) {
    console.error("No existe", OUT_JSON, "— corre --preview primero.");
    process.exit(1);
  }
  const list = JSON.parse(readFileSync(OUT_JSON, "utf8"));
  await backup();

  const pool = new pg.Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "123456",
    database: process.env.PGDATABASE || "GestionCadenadeProveedores",
  });
  const client = await pool.connect();
  let creados = 0;
  let conStock = 0;
  try {
    await client.query("BEGIN");
    let seq = 0;
    for (const it of list) {
      seq++;
      const codigo = `KAR-${String(seq).padStart(5, "0")}`;
      const { rows } = await client.query(
        `INSERT INTO insumo (id_categoria, id_unidad_medida, codigo_insumo, nombre, precio_referencial, activo)
         VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING id_insumo`,
        [it.id_categoria, it.id_unidad_medida, codigo, it.nombre, it.precio_referencial],
      );
      const idInsumo = rows[0].id_insumo;
      await client.query(
        `INSERT INTO insumo_bodega (id_insumo, id_bodega, stock_actual, stock_minimo)
         VALUES ($1,1,$2,0)`,
        [idInsumo, it.stock],
      );
      creados++;
      if (it.stock !== 0) conStock++;
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("ERROR aplicando (ROLLBACK):", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
  console.log(`=== APPLY OK === insumos creados: ${creados} | con stock != 0: ${conStock}`);
}

async function computeKardexData(pool) {
  const rows = await leerExcel();
  const destinations = buildDestinations(rows);
  const { rows: insRows } = await pool.query("SELECT id_insumo, nombre FROM insumo");
  const nameToId = new Map(insRows.map((r) => [r.nombre, r.id_insumo]));

  const byInsumo = new Map();
  let noInsumo = 0;
  let movimientos = 0;
  for (const r of rows) {
    const item = extractItem(r.detalle, destinations);
    if (!item) continue;
    const delta = Math.round(r.entrada) - Math.round(r.salida);
    if (delta === 0) continue;
    const idInsumo = nameToId.get(item);
    if (!idInsumo) {
      noInsumo++;
      continue;
    }
    if (!byInsumo.has(idInsumo)) byInsumo.set(idInsumo, []);
    byInsumo.get(idInsumo).push({ fecha: r.fecha || "2026-01-01", delta, si: r.si, ri: r.ri });
    movimientos++;
  }

  const kardexRows = [];
  const finalStock = new Map();
  let openingRows = 0;
  let insumosConOpening = 0;
  let minActual = Infinity;
  for (const [idInsumo, list] of byInsumo.entries()) {
    list.sort((a, b) =>
      a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.si - b.si) || (a.ri - b.ri),
    );
    let bal = 0;
    let min = 0;
    for (const m of list) {
      bal += m.delta;
      if (bal < min) min = bal;
    }
    const opening = Math.max(0, -min);
    let cur = 0;
    if (opening > 0) {
      openingRows++;
      insumosConOpening++;
      kardexRows.push({ id_insumo: idInsumo, tipo: "Ajuste", cantidad: opening, anterior: 0, actual: opening, fecha: list[0].fecha });
      cur = opening;
      if (opening < minActual) minActual = opening;
    }
    for (const m of list) {
      const anterior = cur;
      cur += m.delta;
      kardexRows.push({
        id_insumo: idInsumo,
        tipo: m.delta > 0 ? "Entrada" : "Salida",
        cantidad: Math.abs(m.delta),
        anterior,
        actual: cur,
        fecha: m.fecha,
      });
      if (cur < minActual) minActual = cur;
    }
    finalStock.set(idInsumo, cur);
  }

  return {
    kardexRows,
    finalStock,
    stats: {
      movimientos,
      noInsumo,
      openingRows,
      insumosConOpening,
      totalFilas: kardexRows.length,
      minActual: minActual === Infinity ? null : minActual,
    },
  };
}

function newPool() {
  return new pg.Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "123456",
    database: process.env.PGDATABASE || "GestionCadenadeProveedores",
  });
}

async function aplicarKardexEn(client, data) {
  await client.query("TRUNCATE kardex RESTART IDENTITY");
  await client.query("ALTER TABLE kardex DROP CONSTRAINT IF EXISTS kardex_check");
  for (const k of data.kardexRows) {
    await client.query(
      `INSERT INTO kardex (id_insumo, id_bodega, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_actual, fecha_movimiento)
       VALUES ($1,1,1,$2,$3,$4,$5,$6)`,
      [k.id_insumo, k.tipo, k.cantidad, k.anterior, k.actual, k.fecha],
    );
  }
  for (const [idInsumo, stock] of data.finalStock.entries()) {
    await client.query(
      `UPDATE insumo_bodega SET stock_actual = $1 WHERE id_insumo = $2 AND id_bodega = 1`,
      [stock, idInsumo],
    );
  }
}

async function applyKardex() {
  const pool = newPool();
  const data = await computeKardexData(pool);
  const client = await pool.connect();
  try {
    // ── Dry-run ──
    await client.query("BEGIN");
    await aplicarKardexEn(client, data);
    const v = await client.query("SELECT count(*)::int n FROM kardex");
    const m = await client.query("SELECT min(stock_actual)::int m, max(stock_actual)::int x FROM kardex");
    await client.query("ROLLBACK");
    console.log("=== DRY-RUN KARDEX ===");
    console.log("movimientos:", data.stats.movimientos, "| filas totales (incl. saldo inicial):", data.stats.totalFilas);
    console.log("saldo inicial: filas =", data.stats.openingRows, "| insumos =", data.stats.insumosConOpening);
    console.log("movimientos sin insumo mapeado:", data.stats.noInsumo);
    console.log("min(stock_actual) simulado:", data.stats.minActual);
    console.log("filas que insertaría:", v.rows[0].n, "| min/max stock_actual en kardex:", m.rows[0].m, "/", m.rows[0].x);

    // ── Ejecución real ──
    await backup();
    await client.query("BEGIN");
    await aplicarKardexEn(client, data);
    await client.query("COMMIT");
    console.log("=== APPLY KARDEX OK ===");
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    console.error("ERROR aplicando kardex (ROLLBACK):", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  // Verificación final
  const vp = newPool();
  const k = await vp.query("SELECT count(*)::int n FROM kardex");
  const ib = await vp.query("SELECT count(*)::int n FROM insumo_bodega WHERE stock_actual > 0");
  const mismatch = await vp.query(
    `SELECT count(*)::int n FROM insumo_bodega ib
      JOIN LATERAL (SELECT stock_actual FROM kardex WHERE kardex.id_insumo = ib.id_insumo AND kardex.id_bodega = ib.id_bodega ORDER BY id_kardex DESC LIMIT 1) kf ON true
     WHERE ib.stock_actual <> kf.stock_actual`,
  );
  console.log("=== VERIFICACIÓN ===");
  console.log("kardex filas:", k.rows[0].n, "| insumos con stock > 0:", ib.rows[0].n, "| desajustes inventario vs kardex:", mismatch.rows[0].n);
  await vp.end();
}

const modo = process.argv[2] || "--preview";
if (modo === "--apply-kardex") {
  await applyKardex();
} else if (modo === "--apply") {
  apply();
} else {
  await preview();
}
