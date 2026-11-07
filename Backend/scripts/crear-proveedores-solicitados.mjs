import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = process.env.DATABASE_URL?.trim()
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "false" ? false : true,
      max: Number(process.env.PGPOOL_MAX || 5),
    })
  : new Pool({
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "123456",
      database: process.env.PGDATABASE || "GestionCadenadeProveedores",
    });

const PROVEEDORES = [
  {
    razon_social: "Agropecuaria Atitlán",
    nit: "781234-9",
    correo: "contacto@agroatitlan.gt",
    telefono: "77621589",
    categoria: "Insumos Generales",
    nombre_usuario: "contacto",
  },
  {
    razon_social: "Distribuidora de Alimentos Panajachel",
    nit: "654321-K",
    correo: "pedidos@alimentosrana.com",
    telefono: "77629831",
    categoria: "Distribución General",
    nombre_usuario: "pedidos",
  },
  {
    razon_social: "Vivero y Servicios Agroforestales Verdes",
    nit: "321654-8",
    correo: "info@agroforestalverdes.gt",
    telefono: "77625470",
    categoria: "Ferretería y Construcción",
    nombre_usuario: "info",
  },
  {
    razon_social: "Variedades e Importaciones Sololá",
    nit: "987123-2",
    correo: "miscelanea.solola@gmail.com",
    telefono: "77623399",
    categoria: "Distribución General",
    nombre_usuario: "miscelaneasolola",
  },
  {
    razon_social: "prueba",
    nit: "000000-0",
    correo: "prueba@munipanajachel.gob.gt",
    telefono: "77620000",
    categoria: "Distribución General",
    nombre_usuario: "prueba",
  },
];

const CARACTERES = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generarClave(longitud = 10) {
  let salida = "";
  for (let i = 0; i < longitud; i++) {
    salida += CARACTERES[crypto.randomInt(0, CARACTERES.length)];
  }
  return salida;
}

async function main() {
  const client = await pool.connect();
  const resultados = [];
  try {
    await client.query("BEGIN");

    const { rows: tipos } = await client.query(
      "SELECT id_tipo_proveedor, descripcion FROM tipo_proveedor WHERE activo = TRUE",
    );
    const tipoPorNombre = new Map(tipos.map((t) => [t.descripcion, t.id_tipo_proveedor]));

    const { rows: roles } = await client.query(
      "SELECT id_rol FROM rol WHERE descripcion = 'Proveedor' AND activo = TRUE LIMIT 1",
    );
    if (!roles[0]) throw new Error("No se encontró el rol activo 'Proveedor'");
    const idRolProveedor = roles[0].id_rol;

    for (const p of PROVEEDORES) {
      const idTipo = tipoPorNombre.get(p.categoria);
      if (!idTipo) throw new Error(`Categoría no encontrada: ${p.categoria}`);

      const { rows: provExistente } = await client.query(
        "SELECT id_proveedor FROM proveedor WHERE nit = $1",
        [p.nit],
      );

      let idProveedor = provExistente[0]?.id_proveedor;
      if (!idProveedor) {
        const { rows } = await client.query(
          `INSERT INTO proveedor (nit, razon_social, id_tipo_proveedor, correo, telefono, activo)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           RETURNING id_proveedor`,
          [p.nit, p.razon_social, idTipo, p.correo, p.telefono],
        );
        idProveedor = rows[0].id_proveedor;
      }

      const { rows: usuarioExistente } = await client.query(
        "SELECT id_usuario FROM usuario WHERE nombre_usuario = $1",
        [p.nombre_usuario],
      );

      let idUsuario;
      let claveTemporal = null;
      if (usuarioExistente[0]) {
        idUsuario = usuarioExistente[0].id_usuario;
      } else {
        claveTemporal = generarClave();
        const hash = await bcrypt.hash(claveTemporal, 10);
        const { rows } = await client.query(
          `INSERT INTO usuario
             (id_rol, nombre_usuario, clave, correo, activo, tipo_usuario, debe_cambiar_clave)
           VALUES ($1, $2, $3, $4, TRUE, 'PROVEEDOR', TRUE)
           RETURNING id_usuario`,
          [idRolProveedor, p.nombre_usuario, hash, p.correo],
        );
        idUsuario = rows[0].id_usuario;
      }

      const { rows: vinculo } = await client.query(
        "SELECT 1 FROM proveedor_usuario WHERE id_proveedor = $1 AND id_usuario = $2",
        [idProveedor, idUsuario],
      );
      if (!vinculo[0]) {
        await client.query(
          `INSERT INTO proveedor_usuario (id_proveedor, id_usuario, es_principal)
           VALUES ($1, $2, TRUE)`,
          [idProveedor, idUsuario],
        );
      }

      resultados.push({
        proveedor: p.razon_social,
        nit: p.nit,
        correo: p.correo,
        categoria: p.categoria,
        usuario: p.nombre_usuario,
        clave_temporal: claveTemporal,
      });
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  console.log("\n=== PROVEEDORES CREADOS ===");
  console.table(
    resultados.map((r) => ({
      Proveedor: r.proveedor,
      NIT: r.nit,
      Categoría: r.categoria,
      Usuario: r.usuario,
      "Clave temporal": r.clave_temporal ?? "(usuario ya existía)",
    })),
  );
  console.log("\nLas claves temporales son de un solo uso y deben cambiarse al iniciar sesión.\n");
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exitCode = 1;
});
