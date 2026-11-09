import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { pool } from "../src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(__dirname, "..");
const ROOT = path.resolve(BACKEND, "..");
const FAC_DIR = path.join(ROOT, "Fac");
const IMG_DIR = path.join(ROOT, "WhatsApp Unknown 2026-11-08 at 4.09.49 PM");
const BACKUP_DIR = path.join(BACKEND, "backups");
const APPLY = process.argv.includes("--apply");
const USER_ID = 1;
const BODEGA_ID = 1;
const PERIODO_ID = 1;
const UCC_ID = 16;

const money = (n) => Number(Number(n).toFixed(2));
const pad = (n, width = 3) => String(n).padStart(width, "0");
const addDays = (date, days) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const ts = (date, time = "09:00:00") => `${date} ${time}`;
const tz = (date, time = "09:00:00") => `${date}T${time}-06:00`;

const invoices = JSON.parse(fs.readFileSync(path.join(BACKEND, "seeds", "facturas-2026.json"), "utf8"));
const pending = JSON.parse(fs.readFileSync(path.join(BACKEND, "seeds", "solicitudes-2026.json"), "utf8"));

const providers = [
  {
    nit: "2736920K",
    razon_social: "MULTISERVICIOS DANY",
    representante_legal: "GUILLERMO ELISEO MUCÚN CHURUNEL",
    nombre_contacto: "Guillermo Mucún",
    telefono_contacto: "77620101",
    telefono: "77620101",
    correo: "proveedor.dany@example.com",
    direccion: "Camino Santa Catarina, zona 3, Panajachel, Sololá",
    id_tipo_proveedor: 1,
  },
  {
    nit: "111476097",
    razon_social: "DEPOSITO DE MADERA BOCEL",
    representante_legal: "ISMAEL BOCEL MARTÍN",
    nombre_contacto: "Ismael Bocel",
    telefono_contacto: "77620202",
    telefono: "77620202",
    correo: "proveedor.bocel@example.com",
    direccion: "Calle Estadio, zona 2, Panajachel, Sololá",
    id_tipo_proveedor: 2,
  },
  {
    nit: "119841-6",
    razon_social: "SUZUKI S.A.",
    representante_legal: "Representante legal Suzuki",
    nombre_contacto: "Ventas Suzuki",
    telefono_contacto: "24210303",
    telefono: "24210303",
    correo: "proveedor.suzuki@example.com",
    direccion: "Avenida La Castellana 39-48, zona 8, Guatemala",
    id_tipo_proveedor: 3,
  },
  {
    nit: "10728473",
    razon_social: "CONSTRUSERVICIOS ROQUEL",
    representante_legal: "Representante legal Roquel",
    nombre_contacto: "Ventas Roquel",
    telefono_contacto: "77620404",
    telefono: "77620404",
    correo: "proveedor.roquel@example.com",
    direccion: "Panajachel, Sololá",
    id_tipo_proveedor: 2,
  },
  {
    nit: "120670968",
    razon_social: "MULTISERVICIOS G&J S.A.",
    representante_legal: "Representante legal G&J",
    nombre_contacto: "Ventas G&J",
    telefono_contacto: "77620505",
    telefono: "77620505",
    correo: "proveedor.gyj@example.com",
    direccion: "15 calle A, colonia Prados del Tabacal 2, 13-27 zona 5, Villa Nueva, Guatemala",
    id_tipo_proveedor: 1,
  },
  {
    nit: "114350388",
    razon_social: "TRIGO Y OLIVO",
    representante_legal: "HUSSELLY ALICIA GRISELDA VASQUEZ RATZÁN",
    nombre_contacto: "Husselly Vásquez",
    telefono_contacto: "77620606",
    telefono: "77620606",
    correo: "proveedor.trigoyolivo@example.com",
    direccion: "4 avenida 2-023, zona 2, Santiago Atitlán, Sololá",
    id_tipo_proveedor: 1,
  },
  {
    nit: "119376245",
    razon_social: "VARIEDADES YASLIN",
    representante_legal: "ANGEL LEONARDO RECINOS MEJIA",
    nombre_contacto: "Angel Recinos",
    telefono_contacto: "77620707",
    telefono: "77620707",
    correo: "proveedor.yaslin@example.com",
    direccion: "Calle Salpores, zona 3, Panajachel, Sololá",
    id_tipo_proveedor: 1,
  },
  {
    nit: "89800346",
    razon_social: "LIBRERIA MONTSERRAT",
    representante_legal: "PAOLA ALEJANDRA CABRERA LINARES",
    nombre_contacto: "Paola Cabrera",
    telefono_contacto: "77620808",
    telefono: "77620808",
    correo: "proveedor.montserrat@example.com",
    direccion: "Calle Principal 81-95, zona 2, Panajachel, Sololá",
    id_tipo_proveedor: 1,
  },
];

const paidInvoices = {
  A2B01570: { npg: "NPG-2026-001", op: "OP-2026-001", ref: "PAGO-HISTORICO-001" },
  "607828BA": { npg: "NPG-2026-002", op: "OP-2026-002", ref: "PAGO-HISTORICO-002" },
  "10B9912D": { npg: "NPG-2026-003", op: "OP-2026-003", ref: "PAGO-HISTORICO-003" },
};

const lowStock = [
  { serie: "A2B01570", nro: 1, minimo: 50 },
  { serie: "A2B01570", nro: 2, minimo: 10 },
  { serie: "607828BA", nro: 1, minimo: 20 },
  { serie: "607828BA", nro: 2, minimo: 10 },
  { serie: "745DE9CE", nro: 3, minimo: 8 },
];

const vales = [
  {
    dependencia_id: 11,
    fecha: "2026-10-20T10:00:00-06:00",
    estado: "Entregado",
    justificacion: "Material de oficina para el registro y atención de usuarias de la Dirección Municipal de la Mujer.",
    items: [
      { id_insumo: 665, cantidad: 50, observacion: "Hojas de opalina para papelería interna" },
      { id_insumo: 733, cantidad: 10, observacion: "Lapiceros para atención al público" },
    ],
  },
  {
    dependencia_id: 12,
    fecha: "2026-10-25T11:00:00-06:00",
    estado: "Entregado",
    justificacion: "Útiles de oficina para el área administrativa de OMAS.",
    items: [
      { id_insumo: 567, cantidad: 20, observacion: "Folders para expedientes de usuarios" },
      { id_insumo: 1095, cantidad: 2, observacion: "Resmas para documentación interna" },
    ],
  },
  {
    dependencia_id: 45,
    fecha: "2026-11-03T09:30:00-06:00",
    estado: "Entregado",
    justificacion: "Papelería y lapiceros para talleres de la Escuela Municipal de Arte.",
    items: [
      { id_insumo: 665, cantidad: 100, observacion: "Hojas de opalina para actividades artísticas" },
      { id_insumo: 733, cantidad: 20, observacion: "Lapiceros para talleres" },
    ],
  },
  {
    dependencia_id: 11,
    fecha: "2026-11-05T14:00:00-06:00",
    estado: "Pendiente",
    justificacion: "Reposición de papelería para las jornadas de atención de noviembre.",
    items: [
      { id_insumo: 665, cantidad: 30, observacion: null },
      { id_insumo: 1192, cantidad: 100, observacion: null },
    ],
  },
  {
    dependencia_id: 52,
    fecha: "2026-11-06T08:30:00-06:00",
    estado: "Pendiente",
    justificacion: "Útiles de oficina para la actualización de expedientes de personal.",
    items: [
      { id_insumo: 733, cantidad: 15, observacion: null },
      { id_insumo: 567, cantidad: 10, observacion: null },
    ],
  },
];

function readPdf(fileName) {
  const full = path.join(FAC_DIR, fileName);
  return { name: fileName, base64: fs.readFileSync(full).toString("base64") };
}

function imageToPdf(imagePath, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 24 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(8).text(title, { align: "center" });
    doc.moveDown(0.5);
    doc.image(imagePath, 24, 48, { fit: [547, 735], align: "center", valign: "center" });
    doc.end();
  });
}

async function main() {
  const client = await pool.connect();
  let receiptNo = 0;
  const invoiceItemIds = new Map();
  const created = [];
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM requisicion WHERE codigo_requisicion LIKE 'HIST-2026-%' OR codigo_requisicion LIKE 'SC-2026-%') AS requisiciones,
         (SELECT COUNT(*)::int FROM factura WHERE serie = ANY($1)) AS facturas,
         (SELECT COUNT(*)::int FROM proveedor WHERE nit = ANY($2)) AS proveedores`,
      [Object.keys(paidInvoices).concat(invoices.map((i) => i.serie)), providers.map((p) => p.nit)],
    );
    const counts = existing.rows[0];
    if (counts.requisiciones > 0 || counts.facturas > 0 || counts.proveedores > 0) {
      throw new Error(
        `Ya existen datos de esta carga (requisiciones=${counts.requisiciones}, facturas=${counts.facturas}, proveedores=${counts.proveedores}). No se aplicó ningún cambio.`,
      );
    }

    if (APPLY) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const affected = await client.query(
        `SELECT ib.* FROM insumo_bodega ib WHERE ib.id_insumo = ANY($1) ORDER BY ib.id_insumo`,
        [[567, 665, 733, 1095, 1192]],
      );
      const backup = {
        generatedAt: new Date().toISOString(),
        scope: "Carga histórica MuniCompras 2026",
        affectedInsumoBodega: affected.rows,
        tableCounts: counts,
      };
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(BACKUP_DIR, `pre-carga-2026-${stamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), "utf8");
      console.log(`Respaldo lógico: ${backupFile}`);
    }

    for (const p of providers) {
      await client.query(
        `INSERT INTO proveedor
           (id_tipo_proveedor, nit, razon_social, representante_legal, nombre_contacto,
            telefono_contacto, telefono, correo, direccion, activo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
         ON CONFLICT (nit) DO UPDATE SET
           id_tipo_proveedor = EXCLUDED.id_tipo_proveedor,
           razon_social = EXCLUDED.razon_social,
           representante_legal = EXCLUDED.representante_legal,
           nombre_contacto = EXCLUDED.nombre_contacto,
           telefono_contacto = EXCLUDED.telefono_contacto,
           telefono = EXCLUDED.telefono,
           correo = EXCLUDED.correo,
           direccion = EXCLUDED.direccion,
           activo = TRUE`,
        [
          p.id_tipo_proveedor,
          p.nit,
          p.razon_social,
          p.representante_legal,
          p.nombre_contacto,
          p.telefono_contacto,
          p.telefono,
          p.correo,
          p.direccion,
        ],
      );
    }
    const provRows = await client.query("SELECT id_proveedor, nit FROM proveedor WHERE nit = ANY($1)", [providers.map((p) => p.nit)]);
    const providerByNit = new Map(provRows.rows.map((r) => [r.nit, r.id_proveedor]));

    const budgets = [{ id_dependencia: UCC_ID, monto: 200000 }, ...pending.map((p) => ({ id_dependencia: p.dependencia_id, monto: 15000 }))];
    const seenBudget = new Set();
    for (const b of budgets) {
      if (seenBudget.has(b.id_dependencia)) continue;
      seenBudget.add(b.id_dependencia);
      await client.query(
        `INSERT INTO presupuesto_dependencia (id_dependencia, id_periodo, monto_asignado)
         VALUES ($1,$2,$3)
         ON CONFLICT (id_dependencia, id_periodo) DO UPDATE SET monto_asignado = EXCLUDED.monto_asignado`,
        [b.id_dependencia, PERIODO_ID, b.monto],
      );
    }

    const ensureInsumoBodega = async (idInsumo) => {
      await client.query(
        `INSERT INTO insumo_bodega (id_insumo, id_bodega, stock_actual, stock_minimo)
         VALUES ($1,$2,0,0) ON CONFLICT (id_insumo, id_bodega) DO NOTHING`,
        [idInsumo, BODEGA_ID],
      );
    };

    const entradaStock = async (idInsumo, cantidad, idRecepcion, fecha) => {
      const qty = Math.trunc(Number(cantidad));
      if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Cantidad de entrada inválida: ${cantidad}`);
      await ensureInsumoBodega(idInsumo);
      const ib = await client.query(
        "SELECT stock_actual FROM insumo_bodega WHERE id_insumo = $1 AND id_bodega = $2 FOR UPDATE",
        [idInsumo, BODEGA_ID],
      );
      const prev = ib.rows[0].stock_actual;
      const next = prev + qty;
      await client.query("UPDATE insumo_bodega SET stock_actual = $1 WHERE id_insumo = $2 AND id_bodega = $3", [next, idInsumo, BODEGA_ID]);
      await client.query(
        `INSERT INTO kardex
           (id_insumo, id_bodega, id_recepcion, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_actual, fecha_movimiento)
         VALUES ($1,$2,$3,$4,'Entrada',$5,$6,$7,$8)`,
        [idInsumo, BODEGA_ID, idRecepcion, USER_ID, qty, prev, next, fecha],
      );
    };

    const salidaStock = async (idInsumo, cantidad, idVale, fecha) => {
      const qty = Math.trunc(Number(cantidad));
      if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Cantidad de salida inválida: ${cantidad}`);
      const ib = await client.query(
        "SELECT stock_actual FROM insumo_bodega WHERE id_insumo = $1 AND id_bodega = $2 FOR UPDATE",
        [idInsumo, BODEGA_ID],
      );
      const prev = ib.rows[0]?.stock_actual ?? 0;
      if (prev < qty) throw new Error(`Stock insuficiente para insumo ${idInsumo}: ${prev} < ${qty}`);
      const next = prev - qty;
      await client.query("UPDATE insumo_bodega SET stock_actual = $1 WHERE id_insumo = $2 AND id_bodega = $3", [next, idInsumo, BODEGA_ID]);
      await client.query(
        `INSERT INTO kardex
           (id_insumo, id_bodega, id_vale_salida, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_actual, fecha_movimiento)
         VALUES ($1,$2,$3,$4,'Salida',$5,$6,$7,$8)`,
        [idInsumo, BODEGA_ID, idVale, USER_ID, qty, prev, next, fecha],
      );
    };

    const insertInsumo = async ({ codigo, nombre, descripcion, categoria, unidad, precio }) => {
      const r = await client.query(
        `INSERT INTO insumo
           (id_categoria, id_unidad_medida, codigo_insumo, nombre, descripcion, precio_referencial, activo)
         VALUES ($1,$2,$3,$4,$5,$6,TRUE)
         ON CONFLICT (codigo_insumo) DO UPDATE SET
           id_categoria = EXCLUDED.id_categoria,
           id_unidad_medida = EXCLUDED.id_unidad_medida,
           nombre = EXCLUDED.nombre,
           descripcion = EXCLUDED.descripcion,
           precio_referencial = EXCLUDED.precio_referencial,
           activo = TRUE
         RETURNING id_insumo`,
        [categoria, unidad, codigo, nombre, descripcion, precio],
      );
      return r.rows[0].id_insumo;
    };

    for (let index = 0; index < invoices.length; index++) {
      const inv = invoices[index];
      const histCode = `HIST-2026-${pad(index + 1)}`;
      const providerId = providerByNit.get(inv.proveedor_nit);
      if (!providerId) throw new Error(`Proveedor no encontrado para ${inv.proveedor_nit}`);
      const itemsTotal = money(inv.items.reduce((s, it) => s + it.subtotal, 0));
      if (itemsTotal !== money(inv.total)) throw new Error(`Diferencia de total en ${inv.serie}: ${itemsTotal} vs ${inv.total}`);

      const reqDate = addDays(inv.fecha_emision, -5);
      const req = await client.query(
        `INSERT INTO requisicion
           (codigo_requisicion, id_usuario, id_dependencia, id_periodo, tipo_solicitud, justificacion,
            lugar_entrega, prioridad, estado, monto_estimado, notas_aprobacion, id_usuario_revisor,
            fecha_solicitud, fecha_resolucion, monto_adjudicado, adjudicada)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Media','En Compra',$8,$9,$2,$10,$11,$8,TRUE)
         RETURNING id_requisicion`,
        [
          histCode,
          USER_ID,
          UCC_ID,
          PERIODO_ID,
          "Compra de Materiales",
          `Reposición de repuestos y mantenimiento vehicular. Factura ${inv.serie}-${inv.numero_factura}.`,
          "Bodega Municipal",
          money(inv.total),
          "Expediente histórico cargado desde factura FEL con adjudicación directa y soporte documental.",
          ts(reqDate, "09:00:00"),
          ts(addDays(inv.fecha_emision, -2), "10:00:00"),
        ],
      );
      const reqId = req.rows[0].id_requisicion;

      const details = [];
      for (const item of inv.items) {
        const codigo = `H26-${pad(index + 1)}-${pad(item.nro, 2)}`;
        const insumoId = await insertInsumo({
          codigo,
          nombre: item.descripcion,
          descripcion: `Repuesto histórico según factura ${inv.serie}`,
          categoria: item.id_categoria,
          unidad: item.id_unidad_medida,
          precio: item.precio_unitario,
        });
        invoiceItemIds.set(`${inv.serie}-${item.nro}`, insumoId);
        const dr = await client.query(
          `INSERT INTO detalle_requisicion
             (id_requisicion, id_insumo, descripcion_libre, id_unidad_medida, cantidad, precio_estimado, observaciones)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id_detalle`,
          [reqId, insumoId, item.descripcion, item.id_unidad_medida, item.cantidad, item.precio_unitario, `Factura ${inv.serie}`],
        );
        details.push({ ...item, id_detalle: dr.rows[0].id_detalle, id_insumo: insumoId });
      }

      const proc = await client.query(
        `INSERT INTO proceso_cotizacion
           (id_requisicion, fase, fecha_publicacion, fecha_limite, min_ofertas, motivo_adjudicacion,
            id_usuario_publica, id_usuario_adjudica, fecha_adjudicacion)
         VALUES ($1,'Adjudicada',$2,$3,1,$4,$5,$5,$6)
         RETURNING id_proceso`,
        [
          reqId,
          tz(addDays(inv.fecha_emision, -4), "08:00:00"),
          tz(addDays(inv.fecha_emision, -3), "17:00:00"),
          "Proveedor único con factura de respaldo y disponibilidad inmediata.",
          USER_ID,
          tz(addDays(inv.fecha_emision, -2), "16:00:00"),
        ],
      );
      const procId = proc.rows[0].id_proceso;

      await client.query(
        `INSERT INTO invitacion_proveedor (id_proceso, id_proveedor, fecha_invitacion, estado)
         VALUES ($1,$2,$3,'Invitado')`,
        [procId, providerId, tz(addDays(inv.fecha_emision, -4), "08:30:00")],
      );

      const cot = await client.query(
        `INSERT INTO cotizacion
           (id_requisicion, id_proveedor, numero_cotizacion, referencia_proveedor, fecha_cotizacion,
            fecha_validez, monto_total, condiciones_pago, tiempo_entrega_dias, tiempo_entrega_texto,
            estado_cotizacion, cumple_tecnico, seleccionada, origen, id_usuario_registra,
            fecha_envio, plazo_credito_dias)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Crédito 30 días',5,'5 días',
                 'Aceptada',TRUE,TRUE,'MANUAL',$8,$9,30)
         RETURNING id_cotizacion`,
        [
          reqId,
          providerId,
          `COT-2026-${pad(index + 1)}`,
          inv.serie,
          addDays(inv.fecha_emision, -3),
          addDays(inv.fecha_emision, 27),
          money(inv.total),
          USER_ID,
          tz(addDays(inv.fecha_emision, -3), "10:00:00"),
        ],
      );
      const cotId = cot.rows[0].id_cotizacion;

      for (const d of details) {
        await client.query(
          `INSERT INTO detalle_cotizacion
             (id_cotizacion, id_detalle_requisicion, cantidad_cotizada, precio_unitario, descripcion_oferta)
           VALUES ($1,$2,$3,$4,$5)`,
          [cotId, d.id_detalle, d.cantidad, d.precio_unitario, d.descripcion],
        );
      }

      const pdf = readPdf(inv.archivo);
      await client.query(
        `INSERT INTO documento_cotizacion (id_cotizacion, nombre_archivo, mime_type, contenido_base64)
         VALUES ($1,$2,'application/pdf',$3)`,
        [cotId, pdf.name, pdf.base64],
      );

      const ocState = inv.serie === "607828BA" ? "Aprobada" : "Entregada";
      const oc = await client.query(
        `INSERT INTO orden_compra
           (numero_orden, id_requisicion, id_cotizacion, id_proveedor, fecha_emision,
            fecha_entrega_estimada, monto_total, estado, id_usuario_emite, id_usuario_aprobador,
            fecha_aprobacion, plazo_credito_dias)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9,$10,30)
         RETURNING id_orden_compra`,
        [
          `OC-2026-${pad(index + 1)}`,
          reqId,
          cotId,
          providerId,
          ts(addDays(inv.fecha_emision, -1), "11:00:00"),
          inv.fecha_emision,
          money(inv.total),
          ocState,
          USER_ID,
          ts(addDays(inv.fecha_emision, -2), "15:00:00"),
        ],
      );
      const ocId = oc.rows[0].id_orden_compra;

      const orderDetails = [];
      for (const d of details) {
        const od = await client.query(
          `INSERT INTO detalle_orden_compra
             (id_orden_compra, id_detalle_requisicion, cantidad_comprada, precio_unitario)
           VALUES ($1,$2,$3,$4)
           RETURNING id_detalle_orden`,
          [ocId, d.id_detalle, d.cantidad, d.precio_unitario],
        );
        orderDetails.push({ ...d, id_detalle_orden: od.rows[0].id_detalle_orden });
      }

      const receptionDate = addDays(inv.fecha_emision, -1);
      const makeReception = async (parts, estado, fecha) => {
        receiptNo += 1;
        const comp = `RC-2026-${pad(receiptNo)}`;
        const rec = await client.query(
          `INSERT INTO recepcion_bodega
             (id_orden_compra, id_bodega, id_usuario, numero_comprobante, fecha_recepcion, estado, observaciones)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           RETURNING id_recepcion`,
          [ocId, BODEGA_ID, USER_ID, comp, fecha, estado, estado === "Parcial" ? "Recepción parcial: pendiente un tambor JAC." : null],
        );
        const recId = rec.rows[0].id_recepcion;
        for (const d of parts) {
          const qty = Math.trunc(Number(d.cantidad));
          await client.query(
            `INSERT INTO detalle_recepcion_bodega
               (id_recepcion, id_detalle_orden, id_insumo, cantidad_esperada, cantidad_recibida, cantidad_aceptada, estado_item)
             VALUES ($1,$2,$3,$4,$4,$4,'Recibido')`,
            [recId, d.id_detalle_orden, d.id_insumo, qty],
          );
          await entradaStock(d.id_insumo, qty, recId, fecha);
        }
        return recId;
      };

      if (inv.serie === "607828BA") {
        await makeReception(orderDetails.slice(0, 3), "Parcial", tz(addDays(inv.fecha_emision, -2), "09:30:00"));
        await makeReception(orderDetails.slice(3), "Completa", tz(receptionDate, "10:30:00"));
      } else {
        await makeReception(orderDetails, "Completa", tz(receptionDate, "10:30:00"));
      }

      const paid = paidInvoices[inv.serie];
      const estado = paid ? "Aprobada" : inv.serie === "93B67AF1" ? "En Revisión" : "Recibida";
      const dueDate = addDays(inv.fecha_emision, 30);
      const fac = await client.query(
        `INSERT INTO factura
           (id_orden_compra, id_proveedor, serie, numero_factura, numero_autorizacion, npg,
            fecha_emision, monto_total, plazo_credito_dias, fecha_vencimiento, estado, observaciones,
            origen, archivo_pdf_nombre, archivo_pdf_base64, id_usuario_registra, id_usuario_revisa,
            fecha_registro, fecha_revision)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,30,$9,$10,$11,'MANUAL',$12,$13,$14,$15,$16,$17)
         RETURNING id_factura`,
        [
          ocId,
          providerId,
          inv.serie,
          inv.numero_factura,
          inv.numero_autorizacion,
          paid?.npg ?? null,
          inv.fecha_emision,
          money(inv.total),
          dueDate,
          estado,
          `Factura histórica cargada desde PDF FEL. Estado inicial: ${estado}.`,
          pdf.name,
          pdf.base64,
          USER_ID,
          estado === "Recibida" ? null : USER_ID,
          tz(inv.fecha_emision, "15:00:00"),
          estado === "Recibida" ? null : tz(addDays(inv.fecha_emision, 2), "09:00:00"),
        ],
      );
      const facturaId = fac.rows[0].id_factura;

      if (paid) {
        await client.query(
          `INSERT INTO orden_pago
             (numero_orden_pago, id_factura, id_proveedor, concepto, monto, id_partida, id_fuente,
              fecha_vencimiento, fecha_pago_programada, fecha_pago_real, referencia_pago, estado,
              id_usuario_crea, id_usuario_programa, id_usuario_paga, fecha_registro, pagado_atraso)
           VALUES ($1,$2,$3,$4,$5,2,1,$6,'2026-11-05','2026-11-06',$7,'Pagada',$8,$8,$8,$9,TRUE)`,
          [
            paid.op,
            facturaId,
            providerId,
            `Pago de factura ${inv.serie}-${inv.numero_factura} (NPG ${paid.npg})`,
            money(inv.total),
            dueDate,
            paid.ref,
            USER_ID,
            tz("2026-11-05", "10:00:00"),
          ],
        );
      }

      created.push({ histCode, reqId, ocId, facturaId, total: money(inv.total), ocState, estado });
    }

    for (let index = 0; index < pending.length; index++) {
      const s = pending[index];
      const total = money(s.items.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0));
      const req = await client.query(
        `INSERT INTO requisicion
           (codigo_requisicion, id_usuario, id_dependencia, id_periodo, tipo_solicitud, justificacion,
            lugar_entrega, prioridad, estado, monto_estimado, notas_aprobacion, fecha_solicitud)
         VALUES ($1,$2,$3,$4,'Compra de Materiales',$5,$6,$7,'Pendiente',$8,$9,$10)
         RETURNING id_requisicion`,
        [
          s.codigo,
          USER_ID,
          s.dependencia_id,
          PERIODO_ID,
          `${s.justificacion} Documento de referencia del ${s.fecha_documento}.`,
          s.dependencia,
          s.prioridad,
          total,
          `Solicitud pendiente de revisión y cotización. Monto estimado referencial: Q${total.toFixed(2)}.`,
          ts(s.fecha_solicitud, "09:00:00"),
        ],
      );
      const reqId = req.rows[0].id_requisicion;

      for (let j = 0; j < s.items.length; j++) {
        const it = s.items[j];
        const codigo = `S26-${pad(index + 1)}-${pad(j + 1, 2)}`;
        const insumoId = await insertInsumo({
          codigo,
          nombre: it.descripcion,
          descripcion: `Solicitud ${s.codigo} - ${s.dependencia}`,
          categoria: it.id_categoria,
          unidad: it.id_unidad_medida,
          precio: it.precio_unitario,
        });
        await client.query(
          `INSERT INTO detalle_requisicion
             (id_requisicion, id_insumo, descripcion_libre, id_unidad_medida, cantidad, precio_estimado, observaciones)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [reqId, insumoId, it.descripcion, it.id_unidad_medida, it.cantidad, it.precio_unitario, s.codigo],
        );
      }

      const imagePath = path.join(IMG_DIR, s.imagen);
      const pdfBuffer = await imageToPdf(imagePath, `Solicitud ${s.codigo} - ${s.dependencia}`);
      const pdfName = `${s.codigo}.pdf`;
      await client.query(
        `INSERT INTO requisicion_imagen (id_requisicion, nombre_archivo, mime_type, contenido_base64)
         VALUES ($1,$2,'application/pdf',$3)`,
        [reqId, pdfName, pdfBuffer.toString("base64")],
      );
      created.push({ code: s.codigo, reqId, total });
    }

    for (const cfg of lowStock) {
      const idInsumo = invoiceItemIds.get(`${cfg.serie}-${cfg.nro}`);
      if (!idInsumo) throw new Error(`No se encontró insumo para mínimo de stock: ${cfg.serie}-${cfg.nro}`);
      await client.query("UPDATE insumo_bodega SET stock_minimo = $1 WHERE id_insumo = $2 AND id_bodega = $3", [cfg.minimo, idInsumo, BODEGA_ID]);
    }

    for (const v of vales) {
      const val = await client.query(
        `INSERT INTO vale_salida
           (id_dependencia, id_usuario_solicitante, id_usuario_autoriza, fecha_salida, justificacion, estado)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id_vale_salida`,
        [v.dependencia_id, USER_ID, v.estado === "Entregado" ? USER_ID : null, v.fecha, v.justificacion, v.estado],
      );
      const valeId = val.rows[0].id_vale_salida;
      for (const it of v.items) {
        await client.query(
          `INSERT INTO detalle_vale_salida (id_vale_salida, id_insumo, cantidad_salida, observacion)
           VALUES ($1,$2,$3,$4)`,
          [valeId, it.id_insumo, it.cantidad, it.observacion],
        );
        if (v.estado === "Entregado") await salidaStock(it.id_insumo, it.cantidad, valeId, v.fecha);
      }
    }

    for (let i = 0; i < created.length; i++) {
      const c = created[i];
      const isHist = Boolean(c.histCode);
      const ref = c.histCode ?? c.code;
      await client.query(
        `INSERT INTO notificacion (id_usuario, tipo, titulo, mensaje, referencia, leida, fecha)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          USER_ID,
          isHist ? "EXPEDIENTE" : "SOLICITUD",
          isHist ? "Expediente histórico cargado" : "Solicitud pendiente registrada",
          isHist
            ? `Se cargó el expediente ${ref} por Q${Number(c.total).toFixed(2)} con orden ${c.ocState}.`
            : `La solicitud ${ref} está pendiente de revisión por Q${Number(c.total).toFixed(2)}.`,
          ref,
          i % 3 === 0,
          tz("2026-11-08", `${String(8 + (i % 10)).padStart(2, "0")}:00:00`),
        ],
      );
      await client.query(
        `INSERT INTO bitacora_acceso
           (id_usuario, accion, ip_acceso, fecha_acceso, modulo, detalle, entidad, id_entidad, estado_nuevo, resultado)
         VALUES ($1,$2,'127.0.0.1',$3,'Carga de datos',$4,$5,$6,$7,'EXITO')`,
        [
          USER_ID,
          isHist ? "carga_historica" : "solicitud_registrada",
          tz("2026-11-08", "07:30:00"),
          isHist ? `Carga histórica ${ref}` : `Registro de solicitud ${ref}`,
          isHist ? "requisicion" : "requisicion",
          c.reqId,
          isHist ? "En Compra" : "Pendiente",
        ],
      );
    }

    await client.query(
      `INSERT INTO bitacora_acceso
         (id_usuario, accion, ip_acceso, fecha_acceso, modulo, detalle, resultado)
       VALUES
         ($1,'carga_proveedores','127.0.0.1',$2,'Proveedores','Se cargaron 8 proveedores activos','EXITO'),
         ($1,'carga_presupuesto','127.0.0.1',$2,'Presupuesto','Se asignó presupuesto a UCC y dependencias solicitantes','EXITO'),
         ($1,'carga_recepciones','127.0.0.1',$2,'Bodega','Se registraron 11 recepciones y entradas de kardex','EXITO'),
         ($1,'carga_pagos','127.0.0.1',$2,'Facturación','Se registraron 3 órdenes de pago pagadas','EXITO'),
         ($1,'carga_vales','127.0.0.1',$2,'Bodega','Se registraron 5 vales de salida','EXITO')`,
      [USER_ID, tz("2026-11-08", "07:35:00")],
    );

    const validation = await client.query(
      `SELECT
         (SELECT COUNT(*)::int FROM proveedor WHERE activo) AS proveedores,
         (SELECT COUNT(*)::int FROM requisicion WHERE codigo_requisicion LIKE 'HIST-2026-%') AS historicas,
         (SELECT COUNT(*)::int FROM requisicion WHERE codigo_requisicion LIKE 'SC-2026-%') AS pendientes,
         (SELECT COUNT(*)::int FROM orden_compra) AS ordenes,
         (SELECT COUNT(*)::int FROM recepcion_bodega) AS recepciones,
         (SELECT COUNT(*)::int FROM factura) AS facturas,
         (SELECT COALESCE(SUM(monto_total),0)::numeric(12,2) FROM factura) AS facturado,
         (SELECT COUNT(*)::int FROM orden_pago WHERE estado='Pagada') AS pagos,
         (SELECT COALESCE(SUM(monto),0)::numeric(12,2) FROM orden_pago WHERE estado='Pagada') AS pagado,
         (SELECT COUNT(*)::int FROM vale_salida) AS vales,
         (SELECT COUNT(*)::int FROM vale_salida WHERE estado='Pendiente') AS vales_pendientes,
         (SELECT COUNT(*)::int FROM insumo_bodega WHERE stock_actual < 0) AS stock_negativo,
         (SELECT COUNT(*)::int FROM insumo_bodega WHERE stock_minimo > 0 AND stock_actual <= stock_minimo) AS bajo_minimo,
         (SELECT COUNT(*)::int FROM notificacion) AS notificaciones,
         (SELECT COUNT(*)::int FROM factura f WHERE f.estado IN ('Recibida','En Revisión','Aprobada')
            AND NOT EXISTS (SELECT 1 FROM orden_pago op WHERE op.id_factura=f.id_factura AND op.estado <> 'Anulada')) AS por_pagar,
         (SELECT COUNT(*)::int FROM requisicion WHERE date_trunc('month',fecha_solicitud)=date_trunc('month',CURRENT_DATE)) AS solicitudes_mes,
         (SELECT COUNT(*)::int FROM requisicion WHERE date_trunc('month',fecha_solicitud)=date_trunc('month',CURRENT_DATE - INTERVAL '1 month')) AS solicitudes_mes_anterior,
         (SELECT COALESCE(SUM(monto_total),0)::numeric(12,2) FROM orden_compra WHERE estado <> 'Cancelada') AS comprometido,
         (SELECT COALESCE(SUM(monto_asignado),0)::numeric(12,2) FROM presupuesto_dependencia) AS asignado`,
    );

    const r = validation.rows[0];
    const expected = {
      proveedores: 8,
      historicas: 10,
      pendientes: 10,
      ordenes: 10,
      recepciones: 11,
      facturas: 10,
      facturado: 148228.49,
      pagos: 3,
      pagado: 55232.56,
      vales: 5,
      vales_pendientes: 2,
      stock_negativo: 0,
      bajo_minimo: 5,
      notificaciones: 20,
      por_pagar: 7,
      solicitudes_mes: 1,
      solicitudes_mes_anterior: 2,
      comprometido: 148228.49,
      asignado: 350000,
    };
    const errors = [];
    for (const [key, value] of Object.entries(expected)) {
      if (Number(r[key]) !== Number(value)) errors.push(`${key}: esperado ${value}, obtenido ${r[key]}`);
    }
    if (errors.length) throw new Error(`Validación fallida:\n- ${errors.join("\n- ")}`);

    console.log("\nResumen de carga");
    console.table(r);
    if (APPLY) {
      await client.query("COMMIT");
      console.log("COMMIT: datos aplicados.");
    } else {
      await client.query("ROLLBACK");
      console.log("DRY-RUN: todo validado; cambios revertidos. Use --apply para aplicar.");
    }
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("ERROR:", e.message);
    console.error(e.stack);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
