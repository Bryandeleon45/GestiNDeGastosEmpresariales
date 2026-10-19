import { pool } from "../db.js";
import { emitir } from "./eventos.js";

// Servicio de parámetros del sistema: lectura con caché (60s), validación por
// tipo y rango, e historial de cambios. Los demás módulos usan `obtener(clave)`
// en lugar de valores fijos en el código.

const TTL_MS = 60_000;

let cache = new Map();
let cacheHasta = 0;

export function invalidarCache() {
  cache.clear();
  cacheHasta = 0;
}

function convertir(tipo, valor) {
  switch (tipo) {
    case "ENTERO":
      return parseInt(valor, 10);
    case "DECIMAL":
      return parseFloat(valor);
    case "BOOLEANO":
      return ["SI", "TRUE", "1", "true"].includes(String(valor).toUpperCase());
    case "LISTA":
      return String(valor)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    default:
      return valor;
  }
}

export function validarValor(tipo, valor, min, max, opciones) {
  if (tipo === "ENTERO" || tipo === "DECIMAL") {
    const n = tipo === "ENTERO" ? parseInt(valor, 10) : parseFloat(valor);
    if (Number.isNaN(n)) throw new Error("Valor numérico inválido");
    if (min != null && n < Number(min)) throw new Error(`Valor mínimo permitido: ${min}`);
    if (max != null && n > Number(max)) throw new Error(`Valor máximo permitido: ${max}`);
    return String(n);
  }
  if (tipo === "BOOLEANO") {
    const v = String(valor).toUpperCase();
    if (!["SI", "NO", "TRUE", "FALSE", "1", "0"].includes(v)) {
      throw new Error("Valor booleano inválido (SI/NO)");
    }
    return ["SI", "TRUE", "1"].includes(v) ? "SI" : "NO";
  }
  if (tipo === "LISTA" && opciones) {
    const opts = opciones.split(",").map((s) => s.trim());
    if (!opts.includes(String(valor))) throw new Error(`Debe ser uno de: ${opts.join(", ")}`);
  }
  return String(valor);
}

export async function listar(grupo = "") {
  const params = [];
  let where = "";
  if (grupo) {
    params.push(grupo);
    where = "WHERE grupo = $1";
  }
  const { rows } = await pool.query(
    `SELECT clave, valor, descripcion, grupo, tipo, valor_min, valor_max, opciones, orden
       FROM parametro_sistema ${where} ORDER BY grupo, orden`,
    params,
  );
  return rows;
}

// Devuelve el valor convertido a su tipo (con caché).
export async function obtener(clave) {
  if (Date.now() < cacheHasta && cache.has(clave)) return cache.get(clave);

  const { rows } = await pool.query(
    `SELECT clave, valor, tipo FROM parametro_sistema WHERE clave = $1`,
    [clave],
  );
  const valor = rows[0] ? convertir(rows[0].tipo, rows[0].valor) : null;
  cache.set(clave, valor);
  cacheHasta = Date.now() + TTL_MS;
  return valor;
}

export async function cambiar(clave, valor, idUsuario) {
  const { rows } = await pool.query(
    `SELECT * FROM parametro_sistema WHERE clave = $1`,
    [clave],
  );
  if (!rows[0]) throw new Error(`Parámetro desconocido: ${clave}`);
  const p = rows[0];

  const valorNuevo = validarValor(p.tipo, valor, p.valor_min, p.valor_max, p.opciones);

  await pool.query(
    `UPDATE parametro_sistema
        SET valor = $1, fecha_actualizacion = now(), id_usuario_actualiza = $2
      WHERE clave = $3`,
    [valorNuevo, idUsuario, clave],
  );
  await pool.query(
    `INSERT INTO parametro_historial (clave, valor_anterior, valor_nuevo, id_usuario)
     VALUES ($1, $2, $3, $4)`,
    [clave, p.valor, valorNuevo, idUsuario],
  );

  invalidarCache();
  emitir("CONFIG_ACTUALIZADA", { clave, valorAnterior: p.valor, valorNuevo });
  return valorNuevo;
}
