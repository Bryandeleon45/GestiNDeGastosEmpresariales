import { pool } from "../db.js";

// Cifra única de presupuesto (sección 7.1 del plan de integración):
//   asignado     = monto del período para la dependencia
//   comprometido = solicitudes 'Aprobada'/'En Compra' (adjudicado o estimado)
//   pagado       = órdenes de pago 'Pagada'
//   disponible   = asignado - comprometido

export async function resumenPresupuesto(idPeriodo = null) {
  const params = [];
  let where = "";
  if (idPeriodo != null) {
    params.push(idPeriodo);
    where = "WHERE id_periodo = $1";
  }
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(monto_asignado), 0)::numeric(12,2) AS asignado,
            COALESCE(SUM(comprometido), 0)::numeric(12,2) AS comprometido,
            COALESCE(SUM(pagado), 0)::numeric(12,2) AS pagado,
            COALESCE(SUM(disponible), 0)::numeric(12,2) AS disponible
       FROM v_presupuesto_dependencia ${where}`,
    params,
  );
  const r = rows[0] ?? {};
  const asignado = parseFloat(r.asignado || "0");
  const pagado = parseFloat(r.pagado || "0");
  return {
    asignado,
    comprometido: parseFloat(r.comprometido || "0"),
    pagado,
    disponible: parseFloat(r.disponible || "0"),
    ejecutado_pct: asignado > 0 ? Math.round((pagado / asignado) * 1000) / 10 : 0,
  };
}

export async function disponible(idDependencia, idPeriodo) {
  const { rows } = await pool.query(
    `SELECT disponible FROM v_presupuesto_dependencia
      WHERE id_dependencia = $1 AND id_periodo = $2`,
    [idDependencia, idPeriodo],
  );
  return rows[0] ? parseFloat(rows[0].disponible) : null;
}

export async function presupuestoPorDependencia(idPeriodo = null) {
  const params = [];
  let where = "";
  if (idPeriodo != null) {
    params.push(idPeriodo);
    where = "WHERE id_periodo = $1";
  }
  const { rows } = await pool.query(
    `SELECT v.*, d.nombre_dependencia, d.siglas
       FROM v_presupuesto_dependencia v
       JOIN dependencia_municipal d ON d.id_dependencia = v.id_dependencia
       ${where}
       ORDER BY d.nombre_dependencia`,
    params,
  );
  return rows;
}
