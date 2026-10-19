import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import { env } from "./config/env.js";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import rolesRouter from "./routes/roles.js";
import menusRouter from "./routes/menus.js";
import dependenciesRouter from "./routes/dependencies.js";
import requisicionesRouter from "./routes/requisiciones.js";
import proveedoresRouter from "./routes/proveedores.js";
import proformasRouter from "./routes/proformas.js";
import facturacionRouter from "./routes/facturacion.js";
import bodegaRouter from "./routes/bodega.js";
import reportesRouter from "./routes/reportes.js";
import dashboardRouter from "./routes/dashboard.js";
import puestosRouter from "./routes/puestos.js";
import bitacoraRouter from "./routes/bitacora.js";
import portalRouter from "./routes/portal.js";
import configuracionRouter from "./routes/configuracion.routes.js";
import catalogosRouter from "./routes/catalogos.routes.js";
import periodosFiscalesRouter from "./routes/periodosFiscales.routes.js";
import notificacionesRouter from "./routes/notificaciones.js";
import { sincronizarAlertas } from "./services/alertas.service.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "ok",
      database: process.env.PGDATABASE || "GestionCadenadeProveedores",
    });
  } catch (e) {
    res.status(500).json({ status: "error", error: e.message });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/usuarios", usersRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/menus", menusRouter);
app.use("/api/dependencias", dependenciesRouter);
app.use("/api/requisiciones", requisicionesRouter);
app.use("/api/proveedores", proveedoresRouter);
app.use("/api/proformas", proformasRouter);
app.use("/api", facturacionRouter);
app.use("/api", bodegaRouter);
app.use("/api/reportes", reportesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/puestos", puestosRouter);
app.use("/api/bitacora", bitacoraRouter);
app.use("/api/portal", portalRouter);
app.use("/api/configuracion", configuracionRouter);
app.use("/api/catalogos", catalogosRouter);
app.use("/api/periodos-fiscales", periodosFiscalesRouter);
app.use("/api/notificaciones", notificacionesRouter);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Error interno" });
});

app.listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`);
});

// Alertas periódicas del sistema (stock bajo y vencimientos de facturas):
// corren al arrancar y luego cada minuto; no interrumpen el servidor si fallan.
function correrAlertas() {
  sincronizarAlertas().catch((e) => console.error("[alertas]", e.message));
}
setTimeout(correrAlertas, 3_000);
setInterval(correrAlertas, 60_000);
