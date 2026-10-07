import { Router } from "express";
import { pool } from "../db.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { registrarBitacora, ipDe } from "../services/bitacora.service.js";

const router = Router();

router.use(authenticate);

function esAdmin(user) {
  return user.rol === "Administrador General";
}

function yearNow() {
  return new Date().getFullYear();
}

async function nextNumero(prefix, table, column, client) {
  const anio = yearNow();
  const { rows } = await client.query(
    `SELECT COALESCE(MAX(SPLIT_PART(${column}, '-', 3)::int), 0) + 1 AS siguiente
       FROM ${table}
      WHERE ${column} LIKE '${prefix}-' || $1 || '-%'`,
    [anio],
  );
  return `${prefix}-${anio}-${String(rows[0].siguiente).padStart(3, "0")}`;
}

// Resuelve (o crea) un insumo a partir de la descripción libre de la requisición.
async function resolverInsumo(client, idInsumo, descripcionLibre) {
  if (idInsumo) {
    const { rows } = await client.query("SELECT id_insumo FROM insumo WHERE id_insumo = $1", [idInsumo]);
    if (rows[0]) return rows[0].id_insumo;
  }
  const nombre = (descripcionLibre || "").trim();
  if (!nombre) return null;
  const { rows } = await client.query(
    "SELECT id_insumo FROM insumo WHERE nombre ILIKE $1 OR $2 ILIKE '%' || nombre || '%' ORDER BY id_insumo LIMIT 1",
    [`%${nombre}%`, nombre],
  );
  if (rows[0]) return rows[0].id_insumo;
  // Crear insumo genérico
  const { rows: nuevo } = await client.query(
    `INSERT INTO insumo (id_categoria, id_unidad_medida, codigo_insumo, nombre, precio_referencial)
     VALUES (10, 1, $1, $2, 0) RETURNING id_insumo`,
    [`IN-AUTO-${Date.now()}`, nombre.slice(0, 100)],
  );
  return nuevo[0].id_insumo;
}

function estadoAlerta(stockActual, stockMinimo) {
  if (!stockMinimo || stockMinimo <= 0) return "OK";
  if (stockActual < stockMinimo * 0.5) return "Crítico";
  if (stockActual <= stockMinimo) return "Bajo";
  return "OK";
}

// ── Bodegas ───────────────────────────────────────────────────────────────────
router.get("/bodegas", async (_req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM bodega WHERE activo = TRUE ORDER BY nombre_bodega");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/bodegas", authorize("bodega"), async (req, res, next) => {
  try {
    const { nombre_bodega, ubicacion, encargado } = req.body;
    if (!nombre_bodega) return res.status(400).json({ error: "El nombre es requerido" });
    const { rows } = await pool.query(
      "INSERT INTO bodega (nombre_bodega, ubicacion, encargado) VALUES ($1,$2,$3) RETURNING *",
      [nombre_bodega.trim(), ubicacion || null, encargado || null],
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Catálogos de insumos ──────────────────────────────────────────────────────
router.get("/categorias", async (_req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT id_categoria, nombre, descripcion FROM categoria WHERE activo = TRUE ORDER BY nombre");
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get("/insumos", async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const { rows } = await pool.query(
      `SELECT i.id_insumo, i.codigo_insumo, i.nombre, i.descripcion, i.precio_referencial,
              i.id_categoria, i.id_unidad_medida, c.nombre AS categoria, um.nombre AS unidad, um.simbolo
         FROM insumo i
         JOIN categoria c ON c.id_categoria = i.id_categoria
         JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
        WHERE i.activo = TRUE ${q ? "AND (i.nombre ILIKE $1 OR i.codigo_insumo ILIKE $1)" : ""}
        ORDER BY i.nombre LIMIT 100`,
      q ? [`%${q}%`] : [],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Inventario ────────────────────────────────────────────────────────────────
router.get("/inventario", async (req, res, next) => {
  try {
    const { categoriaId, q, bajoStock } = req.query;
    const where = ["1=1"];
    const params = [];
    if (categoriaId) {
      where.push(`i.id_categoria = $${params.length + 1}`);
      params.push(categoriaId);
    }
    if (q) {
      where.push(`(i.nombre ILIKE $${params.length + 1} OR i.codigo_insumo ILIKE $${params.length + 1})`);
      params.push(`%${q}%`);
    }
    const { rows } = await pool.query(
      `SELECT i.id_insumo, i.codigo_insumo, i.nombre, i.descripcion,
              c.nombre AS categoria, um.simbolo AS unidad_simbolo,
              ib.stock_actual, ib.stock_minimo, b.nombre_bodega
         FROM insumo i
         JOIN categoria c ON c.id_categoria = i.id_categoria
         JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
         LEFT JOIN insumo_bodega ib ON ib.id_insumo = i.id_insumo
         LEFT JOIN bodega b ON b.id_bodega = ib.id_bodega
        WHERE i.activo = TRUE AND ${where.join(" AND ")}
        ORDER BY i.nombre`,
      params,
    );
    const list = rows.map((r) => ({ ...r, stock_actual: r.stock_actual ?? 0, stock_minimo: r.stock_minimo ?? 0, alerta: estadoAlerta(r.stock_actual ?? 0, r.stock_minimo ?? 0) }));
    if (bajoStock === "true") return res.json(list.filter((r) => r.alerta !== "OK"));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/inventario/alertas", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.id_insumo, i.codigo_insumo, i.nombre, um.simbolo AS unidad_simbolo,
              ib.stock_actual, ib.stock_minimo
         FROM insumo i
         JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
         JOIN insumo_bodega ib ON ib.id_insumo = i.id_insumo
        WHERE i.activo = TRUE AND ib.stock_actual <= ib.stock_minimo AND ib.stock_minimo > 0
        ORDER BY (ib.stock_actual::numeric / NULLIF(ib.stock_minimo, 0)) ASC
        LIMIT 20`,
    );
    res.json(rows.map((r) => ({ ...r, alerta: estadoAlerta(r.stock_actual, r.stock_minimo) })));
  } catch (e) {
    next(e);
  }
});

// ── OC pendientes de recepción ────────────────────────────────────────────────
router.get("/ordenes-compra/pendientes-recepcion", authorize("bodega"), async (req, res, next) => {
  try {
    const q = (req.query.numero || "").toString().trim();
    const { rows } = await pool.query(
      `SELECT oc.id_orden_compra, oc.numero_orden, oc.monto_total, oc.fecha_emision,
              p.nit, p.razon_social
         FROM orden_compra oc
         JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
        WHERE oc.estado IN ('Aprobada','Enviada')
          ${q ? "AND oc.numero_orden ILIKE $1" : ""}
        ORDER BY oc.fecha_emision DESC LIMIT 30`,
      q ? [`%${q}%`] : [],
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Recepciones: listado e historial ──────────────────────────────────────────
router.get("/recepciones", authorize("bodega"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, oc.numero_orden, p.razon_social, b.nombre_bodega, u.nombre_usuario
         FROM recepcion_bodega r
         JOIN orden_compra oc ON oc.id_orden_compra = r.id_orden_compra
         JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
         JOIN bodega b ON b.id_bodega = r.id_bodega
         JOIN usuario u ON u.id_usuario = r.id_usuario
        ORDER BY r.fecha_recepcion DESC LIMIT 100`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Crear recepción ───────────────────────────────────────────────────────────
router.post("/recepciones", authorize("bodega"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { id_orden_compra, id_bodega } = req.body;
    if (!id_orden_compra) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La orden de compra es requerida" });
    }

    const ocRes = await client.query("SELECT * FROM orden_compra WHERE id_orden_compra = $1", [id_orden_compra]);
    const oc = ocRes.rows[0];
    if (!oc) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Orden de compra no encontrada" });
    }
    if (!["Aprobada", "Enviada"].includes(oc.estado)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se recibe contra una OC Aprobada o Enviada" });
    }
    // RN-08: quien emitió la OC no puede recibirla (salvo administrador)
    if (oc.id_usuario_emite === req.user.id_usuario && !esAdmin(req.user)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El usuario que emitió la orden no puede registrar su recepción" });
    }

    const bodegaRes = await client.query("SELECT id_bodega FROM bodega WHERE activo = TRUE ORDER BY id_bodega LIMIT 1");
    const idBodega = id_bodega || bodegaRes.rows[0]?.id_bodega;
    if (!idBodega) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No hay bodega activa" });
    }

    // Items de la OC (detalle_orden_compra -> detalle_requisicion)
    const itemsRes = await client.query(
      `SELECT doc.id_detalle_orden, doc.cantidad_comprada,
              dr.id_insumo, dr.descripcion_libre
         FROM detalle_orden_compra doc
         JOIN detalle_requisicion dr ON dr.id_detalle = doc.id_detalle_requisicion
        WHERE doc.id_orden_compra = $1`,
      [id_orden_compra],
    );
    if (!itemsRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La orden de compra no tiene ítems" });
    }

    const numero = await nextNumero("RC", "recepcion_bodega", "numero_comprobante", client);
    const { rows: recRows } = await client.query(
      `INSERT INTO recepcion_bodega (id_orden_compra, id_bodega, id_usuario, numero_comprobante, estado)
       VALUES ($1,$2,$3,$4,'En Proceso') RETURNING *`,
      [id_orden_compra, idBodega, req.user.id_usuario, numero],
    );
    const recepcion = recRows[0];

    for (const it of itemsRes.rows) {
      const idInsumo = await resolverInsumo(client, it.id_insumo, it.descripcion_libre);
      if (!idInsumo) continue;
      await client.query(
        `INSERT INTO detalle_recepcion_bodega
           (id_recepcion, id_detalle_orden, id_insumo, cantidad_esperada)
         VALUES ($1,$2,$3,$4)`,
        [recepcion.id_recepcion, it.id_detalle_orden, idInsumo, Math.round(Number(it.cantidad_comprada))],
      );
    }

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "recepcion_creada",
      ip: ipDe(req),
      modulo: "Bodega",
      detalle: `Recepción ${numero} creada para ${oc.numero_orden}`,
    });

    res.status(201).json(recepcion);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Detalle de recepción ──────────────────────────────────────────────────────
router.get("/recepciones/:id", authorize("bodega"), async (req, res, next) => {
  try {
    const { rows: recRows } = await pool.query(
      `SELECT r.*, oc.numero_orden, oc.id_usuario_emite, p.razon_social, p.nit, b.nombre_bodega
         FROM recepcion_bodega r
         JOIN orden_compra oc ON oc.id_orden_compra = r.id_orden_compra
         JOIN proveedor p ON p.id_proveedor = oc.id_proveedor
         JOIN bodega b ON b.id_bodega = r.id_bodega
        WHERE r.id_recepcion = $1`,
      [req.params.id],
    );
    if (!recRows[0]) return res.status(404).json({ error: "Recepción no encontrada" });

    const { rows: items } = await pool.query(
      `SELECT dr.*, i.codigo_insumo, i.nombre AS insumo_nombre, um.simbolo AS unidad_simbolo
         FROM detalle_recepcion_bodega dr
         JOIN insumo i ON i.id_insumo = dr.id_insumo
         JOIN unidad_medida um ON um.id_unidad_medida = i.id_unidad_medida
        WHERE dr.id_recepcion = $1
        ORDER BY dr.id_detalle_recepcion`,
      [req.params.id],
    );

    res.json({ ...recRows[0], items });
  } catch (e) {
    next(e);
  }
});

// ── Verificar un ítem de la recepción ─────────────────────────────────────────
router.patch("/recepciones/:id/items/:idDetalle", authorize("bodega"), async (req, res, next) => {
  try {
    const { estado_item, cantidad_aceptada, observacion } = req.body;
    const validos = ["Pendiente", "Recibido", "Rechazado", "Faltante"];
    if (!validos.includes(estado_item)) return res.status(400).json({ error: "Estado de ítem inválido" });

    const { rows: recRows } = await pool.query("SELECT * FROM recepcion_bodega WHERE id_recepcion = $1", [req.params.id]);
    if (!recRows[0]) return res.status(404).json({ error: "Recepción no encontrada" });
    if (recRows[0].estado !== "En Proceso") return res.status(400).json({ error: "Solo se verifica en recepciones En Proceso" });

    const { rows: detRows } = await pool.query(
      "SELECT * FROM detalle_recepcion_bodega WHERE id_detalle_recepcion = $1 AND id_recepcion = $2",
      [req.params.idDetalle, req.params.id],
    );
    if (!detRows[0]) return res.status(404).json({ error: "Ítem no encontrado" });
    const det = detRows[0];

    let cantidadRecibida = det.cantidad_recibida;
    let cantidadAceptada = det.cantidad_aceptada;
    if (estado_item === "Recibido") {
      cantidadRecibida = det.cantidad_esperada;
      cantidadAceptada = cantidad_aceptada != null ? Math.min(parseInt(cantidad_aceptada, 10) || det.cantidad_esperada, det.cantidad_esperada) : det.cantidad_esperada;
      if (cantidadAceptada > det.cantidad_esperada) cantidadAceptada = det.cantidad_esperada;
    } else if (estado_item === "Rechazado" || estado_item === "Faltante") {
      cantidadAceptada = 0;
      cantidadRecibida = estado_item === "Rechazado" ? 0 : (parseInt(cantidad_aceptada, 10) || 0);
    }

    const { rows } = await pool.query(
      `UPDATE detalle_recepcion_bodega
          SET estado_item = $1, cantidad_recibida = $2, cantidad_aceptada = $3, observacion = $4
        WHERE id_detalle_recepcion = $5
        RETURNING *`,
      [estado_item, cantidadRecibida, cantidadAceptada, observacion || null, req.params.idDetalle],
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Finalizar recepción (transacción) ─────────────────────────────────────────
router.post("/recepciones/:id/finalizar", authorize("bodega"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: recRows } = await client.query(
      "SELECT * FROM recepcion_bodega WHERE id_recepcion = $1 FOR UPDATE",
      [req.params.id],
    );
    const recepcion = recRows[0];
    if (!recepcion) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Recepción no encontrada" });
    }
    if (recepcion.estado !== "En Proceso") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se finaliza una recepción En Proceso" });
    }

    const { rows: items } = await client.query(
      "SELECT * FROM detalle_recepcion_bodega WHERE id_recepcion = $1",
      [recepcion.id_recepcion],
    );

    let tieneRechazo = false;
    let tieneFaltante = false;
    let totalAceptado = 0;
    let totalEsperado = 0;

    for (const it of items) {
      totalEsperado += it.cantidad_esperada;
      if (it.cantidad_aceptada > 0) {
        totalAceptado += it.cantidad_aceptada;
        // Bloquear/crear existencia
        await client.query(
          `INSERT INTO insumo_bodega (id_insumo, id_bodega, stock_actual, stock_minimo)
           VALUES ($1,$2,0,0) ON CONFLICT (id_insumo, id_bodega) DO NOTHING`,
          [it.id_insumo, recepcion.id_bodega],
        );
        const ibRes = await client.query(
          "SELECT * FROM insumo_bodega WHERE id_insumo = $1 AND id_bodega = $2 FOR UPDATE",
          [it.id_insumo, recepcion.id_bodega],
        );
        const ib = ibRes.rows[0];
        const nuevo = ib.stock_actual + it.cantidad_aceptada;
        await client.query(
          "UPDATE insumo_bodega SET stock_actual = $1 WHERE id_insumo = $2 AND id_bodega = $3",
          [nuevo, it.id_insumo, recepcion.id_bodega],
        );
        await client.query(
          `INSERT INTO kardex (id_insumo, id_bodega, id_recepcion, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_actual)
           VALUES ($1,$2,$3,$4,'Entrada',$5,$6,$7)`,
          [it.id_insumo, recepcion.id_bodega, recepcion.id_recepcion, req.user.id_usuario, it.cantidad_aceptada, ib.stock_actual, nuevo],
        );
      }
      if (it.estado_item === "Rechazado") tieneRechazo = true;
      if (it.estado_item === "Faltante") tieneFaltante = true;
    }

    let estado;
    if (tieneRechazo) estado = "Con Novedades";
    else if (tieneFaltante) estado = "Parcial";
    else estado = "Completa";

    await client.query(
      "UPDATE recepcion_bodega SET estado = $1 WHERE id_recepcion = $2",
      [estado, recepcion.id_recepcion],
    );

    // RN-06: si todo fue aceptado, la OC pasa a Entregada
    if (estado === "Completa") {
      await client.query(
        "UPDATE orden_compra SET estado = 'Entregada' WHERE id_orden_compra = $1",
        [recepcion.id_orden_compra],
      );
    }

    await client.query("COMMIT");

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "recepcion_finalizada",
      ip: ipDe(req),
      modulo: "Bodega",
      detalle: `Recepción ${recepcion.numero_comprobante} finalizada (${estado})`,
    });

    res.json({ estado, total_aceptado: totalAceptado });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Cancelar recepción ────────────────────────────────────────────────────────
router.post("/recepciones/:id/cancelar", authorize("bodega"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "UPDATE recepcion_bodega SET estado = 'Cancelada' WHERE id_recepcion = $1 AND estado = 'En Proceso' RETURNING *",
      [req.params.id],
    );
    if (!rows[0]) return res.status(400).json({ error: "Solo se cancela una recepción En Proceso" });

    await registrarBitacora({
      idUsuario: req.user.id_usuario,
      accion: "recepcion_cancelada",
      ip: ipDe(req),
      modulo: "Bodega",
      detalle: `Recepción ${rows[0].numero_comprobante} cancelada`,
    });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Kardex ────────────────────────────────────────────────────────────────────
router.get("/kardex", authorize("bodega"), async (req, res, next) => {
  try {
    const { insumoId } = req.query;
    const where = ["1=1"];
    const params = [];
    if (insumoId) {
      where.push(`k.id_insumo = $${params.length + 1}`);
      params.push(insumoId);
    }
    const { rows } = await pool.query(
      `SELECT k.*, i.codigo_insumo, i.nombre AS insumo_nombre, b.nombre_bodega, u.nombre_usuario
         FROM kardex k
         JOIN insumo i ON i.id_insumo = k.id_insumo
         JOIN bodega b ON b.id_bodega = k.id_bodega
         JOIN usuario u ON u.id_usuario = k.id_usuario
        WHERE ${where.join(" AND ")}
        ORDER BY k.fecha_movimiento DESC LIMIT 200`,
      params,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ── Ajuste de inventario ──────────────────────────────────────────────────────
router.post("/kardex/ajustes", authorize("bodega"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id_insumo, id_bodega, cantidad } = req.body;
    if (!id_insumo || !id_bodega || !cantidad) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "insumo, bodega y cantidad son requeridos" });
    }
    await client.query(
      `INSERT INTO insumo_bodega (id_insumo, id_bodega, stock_actual, stock_minimo)
       VALUES ($1,$2,0,0) ON CONFLICT (id_insumo, id_bodega) DO NOTHING`,
      [id_insumo, id_bodega],
    );
    const ibRes = await client.query(
      "SELECT * FROM insumo_bodega WHERE id_insumo = $1 AND id_bodega = $2 FOR UPDATE",
      [id_insumo, id_bodega],
    );
    const ib = ibRes.rows[0];
    const ajuste = parseInt(cantidad, 10); // positivo = suma, negativo = resta
    const nuevo = ib.stock_actual + ajuste;
    if (nuevo < 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El ajuste deja el stock negativo" });
    }
    await client.query(
      "UPDATE insumo_bodega SET stock_actual = $1 WHERE id_insumo = $2 AND id_bodega = $3",
      [nuevo, id_insumo, id_bodega],
    );
    await client.query(
      `INSERT INTO kardex (id_insumo, id_bodega, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_actual)
       VALUES ($1,$2,$3,'Ajuste',$4,$5,$6)`,
      [id_insumo, id_bodega, req.user.id_usuario, Math.abs(ajuste), ib.stock_actual, nuevo],
    );
    await client.query("COMMIT");
    res.json({ stock_actual: nuevo });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

// ── Vales de salida ───────────────────────────────────────────────────────────
router.get("/vales-salida", authorize("bodega"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, d.nombre_dependencia, u.nombre_usuario
         FROM vale_salida v
         JOIN dependencia_municipal d ON d.id_dependencia = v.id_dependencia
         JOIN usuario u ON u.id_usuario = v.id_usuario_solicitante
        ORDER BY v.fecha_salida DESC LIMIT 100`,
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.post("/vales-salida", authorize("bodega"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id_dependencia, justificacion, items } = req.body;
    if (!id_dependencia) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La dependencia es requerida" });
    }
    if (!Array.isArray(items) || !items.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Debe incluir al menos un ítem" });
    }
    const { rows } = await client.query(
      `INSERT INTO vale_salida (id_dependencia, id_usuario_solicitante, justificacion, estado)
       VALUES ($1,$2,$3,'Pendiente') RETURNING *`,
      [id_dependencia, req.user.id_usuario, justificacion || null],
    );
    const vale = rows[0];
    for (const it of items) {
      await client.query(
        `INSERT INTO detalle_vale_salida (id_vale_salida, id_insumo, cantidad_salida, observacion)
         VALUES ($1,$2,$3,$4)`,
        [vale.id_vale_salida, it.id_insumo, it.cantidad, it.observacion || null],
      );
    }
    await client.query("COMMIT");
    res.status(201).json(vale);
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

router.patch("/vales-salida/:id/autorizar", authorize("bodega"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "UPDATE vale_salida SET estado = 'Autorizado', id_usuario_autoriza = $1 WHERE id_vale_salida = $2 AND estado = 'Pendiente' RETURNING *",
      [req.user.id_usuario, req.params.id],
    );
    if (!rows[0]) return res.status(400).json({ error: "Solo se autoriza un vale Pendiente" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

router.patch("/vales-salida/:id/entregar", authorize("bodega"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: valeRows } = await client.query(
      "SELECT * FROM vale_salida WHERE id_vale_salida = $1 FOR UPDATE",
      [req.params.id],
    );
    const vale = valeRows[0];
    if (!vale) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Vale no encontrado" });
    }
    if (vale.estado !== "Autorizado") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Solo se entrega un vale Autorizado" });
    }

    const bodegaRes = await client.query("SELECT id_bodega FROM bodega WHERE activo = TRUE ORDER BY id_bodega LIMIT 1");
    const idBodega = bodegaRes.rows[0].id_bodega;

    const { rows: items } = await client.query(
      "SELECT * FROM detalle_vale_salida WHERE id_vale_salida = $1",
      [vale.id_vale_salida],
    );
    for (const it of items) {
      const ibRes = await client.query(
        "SELECT * FROM insumo_bodega WHERE id_insumo = $1 AND id_bodega = $2 FOR UPDATE",
        [it.id_insumo, idBodega],
      );
      const ib = ibRes.rows[0];
      const stock = ib ? ib.stock_actual : 0;
      if (stock < it.cantidad_salida) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Stock insuficiente para el insumo ${it.id_insumo}` });
      }
      const nuevo = stock - it.cantidad_salida;
      await client.query(
        "UPDATE insumo_bodega SET stock_actual = $1 WHERE id_insumo = $2 AND id_bodega = $3",
        [nuevo, it.id_insumo, idBodega],
      );
      await client.query(
        `INSERT INTO kardex (id_insumo, id_bodega, id_vale_salida, id_usuario, tipo_movimiento, cantidad, stock_anterior, stock_actual)
         VALUES ($1,$2,$3,$4,'Salida',$5,$6,$7)`,
        [it.id_insumo, idBodega, vale.id_vale_salida, req.user.id_usuario, it.cantidad_salida, stock, nuevo],
      );
    }
    await client.query("UPDATE vale_salida SET estado = 'Entregado' WHERE id_vale_salida = $1", [vale.id_vale_salida]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

router.patch("/vales-salida/:id/cancelar", authorize("bodega"), async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "UPDATE vale_salida SET estado = 'Cancelado' WHERE id_vale_salida = $1 AND estado IN ('Pendiente','Autorizado') RETURNING *",
      [req.params.id],
    );
    if (!rows[0]) return res.status(400).json({ error: "No se puede cancelar este vale" });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

// ── Resumen del dashboard de bodega ───────────────────────────────────────────
router.get("/resumen", authorize("bodega"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM recepcion_bodega WHERE estado IN ('Completa','Parcial','Con Novedades')) AS recepciones,
         (SELECT COUNT(*)::int FROM recepcion_bodega WHERE estado = 'En Proceso') AS en_proceso,
         (SELECT COUNT(*)::int FROM insumo_bodega ib WHERE ib.stock_actual <= ib.stock_minimo) AS alertas_stock`,
    );
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

export default router;
