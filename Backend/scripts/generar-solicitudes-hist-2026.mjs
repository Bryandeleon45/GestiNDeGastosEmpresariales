import PDFDocument from "pdfkit";
import { pool } from "../src/db.js";

// Genera un PDF de "Solicitud de Compra" para cada expediente histórico
// (HIST-2026-*) de la Unidad de Compras y Contrataciones y lo adjunta como
// requisicion_imagen, para que en "Dependencias y Solicitudes" se vea la
// solicitud (y no la factura, que vive en Facturación).
//
// Uso:
//   node scripts/generar-solicitudes-hist-2026.mjs          # dry-run
//   node scripts/generar-solicitudes-hist-2026.mjs --apply  # commit

const APLICAR = process.argv.includes("--apply");

const money = (n) =>
  `Q ${Number(n).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function buildPdf(req, items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 44 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#1E5E2F").text("MUNICIPALIDAD DE PANAJACHEL", { align: "center" });
    doc.font("Helvetica").fontSize(9).fillColor("#374151").text("Unidad de Compras y Contrataciones", { align: "center" });
    doc.moveDown(0.4);
    doc.font("Helvetica-Bold").fontSize(15).fillColor("#111827").text("SOLICITUD DE COMPRA", { align: "center" });
    doc.moveDown(1);

    const y0 = doc.y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111827");
    const info = [
      ["Código", req.codigo_requisicion],
      ["Fecha", req.fecha],
      ["Dependencia", req.nombre_dependencia],
      ["Tipo de solicitud", req.tipo_solicitud],
      ["Prioridad", req.prioridad],
      ["Estado", req.estado],
    ];
    info.forEach(([label, value]) => {
      doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
      doc.font("Helvetica").text(value ?? "—");
    });
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Justificación: ", { continued: true });
    doc.font("Helvetica").text(req.justificacion || "—");
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Detalle de la solicitud");
    doc.moveDown(0.4);

    const colX = { n: 44, desc: 66, cant: 360, und: 420, precio: 455, subt: 520 };
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#FFFFFF");
    doc.rect(44, doc.y, 520, 16).fill("#1E5E2F");
    doc.fillColor("#FFFFFF");
    doc.text("#", colX.n, doc.y - 13);
    doc.text("Descripción", colX.desc, doc.y - 13);
    doc.text("Cant.", colX.cant, doc.y - 13);
    doc.text("Und.", colX.und, doc.y - 13);
    doc.text("P. Unit.", colX.precio, doc.y - 13);
    doc.text("Subtotal", colX.subt, doc.y - 13);
    doc.y += 16;

    let total = 0;
    items.forEach((it, i) => {
      const subtotal = Number(it.cantidad) * Number(it.precio_estimado);
      total += subtotal;
      const desc = it.descripcion_libre || it.insumo || "";
      doc.font("Helvetica").fontSize(8).fillColor("#111827");
      doc.text(String(i + 1), colX.n, doc.y);
      doc.text(desc, colX.desc, doc.y, { width: colX.cant - colX.desc - 4 });
      doc.text(String(Number(it.cantidad)), colX.cant, doc.y);
      doc.text(it.unidad || "", colX.und, doc.y);
      doc.text(money(it.precio_estimado), colX.precio, doc.y);
      doc.text(money(subtotal), colX.subt, doc.y);
      doc.moveDown(0.2);
      doc.rect(44, doc.y, 520, 0.5).fill("#E5E7EB");
      doc.moveDown(0.4);
    });

    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Total estimado: ", { continued: true });
    doc.font("Helvetica-Bold").fillColor("#1E5E2F").text(money(req.monto_estimado || total));

    doc.end();
  });
}

async function main() {
  const client = await pool.connect();
  const generados = [];
  try {
    await client.query("BEGIN");

    const { rows: reqs } = await client.query(
      `SELECT r.id_requisicion, r.codigo_requisicion, r.tipo_solicitud, r.justificacion,
              r.prioridad, r.estado, r.monto_estimado, to_char(r.fecha_solicitud, 'DD/MM/YYYY') AS fecha,
              d.nombre_dependencia
         FROM requisicion r
         JOIN dependencia_municipal d ON d.id_dependencia = r.id_dependencia
        WHERE r.codigo_requisicion LIKE 'HIST-2026-%'
        ORDER BY r.id_requisicion`,
    );

    for (const req of reqs) {
      const existe = await client.query(
        `SELECT 1 FROM requisicion_imagen WHERE id_requisicion = $1 LIMIT 1`,
        [req.id_requisicion],
      );
      if (existe.rows[0]) continue;

      const { rows: items } = await client.query(
        `SELECT dr.descripcion_libre, dr.cantidad, dr.precio_estimado, um.simbolo AS unidad, i.nombre AS insumo
           FROM detalle_requisicion dr
           JOIN unidad_medida um ON um.id_unidad_medida = dr.id_unidad_medida
           LEFT JOIN insumo i ON i.id_insumo = dr.id_insumo
          WHERE dr.id_requisicion = $1
          ORDER BY dr.id_detalle`,
        [req.id_requisicion],
      );

      const pdfBuffer = await buildPdf(req, items);
      await client.query(
        `INSERT INTO requisicion_imagen (id_requisicion, nombre_archivo, mime_type, contenido_base64)
         VALUES ($1, $2, 'application/pdf', $3)`,
        [req.id_requisicion, `${req.codigo_requisicion}.pdf`, pdfBuffer.toString("base64")],
      );
      generados.push(req.codigo_requisicion);
    }

    console.log(`Solicitudes generadas: ${generados.length}`);
    console.log(generados.join(", ") || "(ninguna nueva)");

    if (APLICAR) {
      await client.query("COMMIT");
      console.log("COMMIT: aplicado.");
    } else {
      await client.query("ROLLBACK");
      console.log("DRY-RUN: revertido. Use --apply para aplicar.");
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
