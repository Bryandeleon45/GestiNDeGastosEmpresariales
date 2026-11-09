import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { pool } from "../src/db.js";

// Conecta los 8 proveedores sembrados al portal (cuentas de proveedor),
// deja una recepción en "En Proceso" y registra el cambio real del parámetro
// MIN_OFERTAS_DEFECTO (3 -> 1) en el historial de parámetros.
//
// NO envía correos. Las credenciales temporales solo se imprimen en consola.
//
// Uso:
//   node scripts/conectar-portal-2026.mjs          # dry-run (rollback)
//   node scripts/conectar-portal-2026.mjs --apply  # commit

const APLICAR = process.argv.includes("--apply");
const ID_ROL_PROVEEDOR = 15;
const ID_USUARIO_ADMIN = 1;

function generarUsername(correo, nit, ocupados) {
  const base = (correo || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const nitDigits = (nit || "").replace(/[^0-9A-Za-z]/g, "").toLowerCase();
  let candidate = base || `prov${nitDigits}`;
  let name = candidate;
  let i = 1;
  while (ocupados.has(name)) {
    name = `${candidate}${i++}`;
  }
  ocupados.add(name);
  return name;
}

async function main() {
  const client = await pool.connect();
  const credenciales = [];

  try {
    await client.query("BEGIN");

    const { rows: proveedores } = await client.query(
      `SELECT id_proveedor, nit, razon_social, correo
         FROM proveedor
        WHERE activo = TRUE
        ORDER BY id_proveedor`,
    );

    const { rows: usernames } = await client.query(
      `SELECT nombre_usuario FROM usuario`,
    );
    const ocupados = new Set(usernames.map((u) => u.nombre_usuario));

    for (const p of proveedores) {
      const existe = await client.query(
        `SELECT 1 FROM proveedor_usuario WHERE id_proveedor = $1 LIMIT 1`,
        [p.id_proveedor],
      );
      if (existe.rows[0]) {
        credenciales.push({ razon_social: p.razon_social, ya_existia: true });
        continue;
      }

      const nombre_usuario = generarUsername(p.correo, p.nit, ocupados);
      const claveTemporal = crypto.randomBytes(6).toString("base64url");
      const hash = await bcrypt.hash(claveTemporal, 10);

      const { rows: usr } = await client.query(
        `INSERT INTO usuario
           (id_rol, nombre_usuario, clave, correo, activo, tipo_usuario, debe_cambiar_clave)
         VALUES ($1, $2, $3, $4, TRUE, 'PROVEEDOR', TRUE)
         RETURNING id_usuario`,
        [ID_ROL_PROVEEDOR, nombre_usuario, hash, p.correo],
      );
      const idUsuario = usr[0].id_usuario;

      await client.query(
        `INSERT INTO proveedor_usuario (id_proveedor, id_usuario, es_principal)
         VALUES ($1, $2, TRUE)`,
        [p.id_proveedor, idUsuario],
      );

      credenciales.push({
        razon_social: p.razon_social,
        nit: p.nit,
        nombre_usuario,
        clave_temporal: claveTemporal,
      });
    }

    const { rows: paramRows } = await client.query(
      `SELECT valor FROM parametro_sistema WHERE clave = 'MIN_OFERTAS_DEFECTO'`,
    );
    const valorAnterior = paramRows[0]?.valor ?? null;
    if (valorAnterior === "1") {
      console.log("MIN_OFERTAS_DEFECTO ya está en 1; no se registra cambio.");
    } else {
      await client.query(
        `UPDATE parametro_sistema
            SET valor = '1', fecha_actualizacion = now(), id_usuario_actualiza = $1
          WHERE clave = 'MIN_OFERTAS_DEFECTO'`,
        [ID_USUARIO_ADMIN],
      );
      await client.query(
        `INSERT INTO parametro_historial (clave, valor_anterior, valor_nuevo, id_usuario)
         VALUES ('MIN_OFERTAS_DEFECTO', $1, '1', $2)`,
        [valorAnterior, ID_USUARIO_ADMIN],
      );
    }

    const { rows: rec } = await client.query(
      `UPDATE recepcion_bodega
          SET estado = 'En Proceso'
        WHERE id_orden_compra = (SELECT id_orden_compra FROM orden_compra WHERE numero_orden = 'OC-2026-003')
          AND estado = 'Completa'
        RETURNING id_recepcion, numero_comprobante`,
    );

    const resumen = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM proveedor_usuario) AS cuentas_portal,
         (SELECT COUNT(*)::int FROM parametro_historial) AS historial_parametros,
         (SELECT COUNT(*)::int FROM recepcion_bodega WHERE estado = 'En Proceso') AS en_proceso`,
    );

    console.log("\nCredenciales temporales del portal (no se enviaron correos):\n");
    for (const c of credenciales) {
      if (c.ya_existia) {
        console.log(`- ${c.razon_social}: ya tenía cuenta (omitida)`);
      } else {
        console.log(`- ${c.razon_social}`);
        console.log(`    usuario: ${c.nombre_usuario}`);
        console.log(`    clave  : ${c.clave_temporal}`);
      }
    }

    console.log("\nResumen:");
    console.table(resumen.rows[0]);
    console.log(
      `Recepción → En Proceso: ${rec.length ? rec.map((r) => r.numero_comprobante).join(", ") : "ninguna (verificar OC-2026-003)"}`,
    );

    if (APLICAR) {
      await client.query("COMMIT");
      console.log("\nCOMMIT: cambios aplicados.");
    } else {
      await client.query("ROLLBACK");
      console.log("\nDRY-RUN: cambios revertidos. Use --apply para aplicar.");
    }
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("ERROR:", e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
