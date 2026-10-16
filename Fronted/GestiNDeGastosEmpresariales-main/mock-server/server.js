import express from "express"
import cors from "cors"

const app = express()
const PORT = 4001

app.use(cors())
app.use(express.json())

const asignaciones = []
let nextAsignacionId = 1

const proveedores = [
  { id_proveedor: 1, razon_social: "Comercial El Quetzal, S.A.", nit: "1234567-8", correo: "ventas@elquetzal.com" },
  { id_proveedor: 2, razon_social: "Suministros Oficina Total", nit: "7654321-0", correo: "contacto@oficinatotal.com" },
  { id_proveedor: 3, razon_social: "Construmateriales GT", nit: "1122334-5", correo: "ventas@construt-gt.com" },
  { id_proveedor: 4, razon_social: "Tecnología Aplicada Maya", nit: "5566778-9", correo: "info@tecmaya.com" },
]

const pedidosAsignadosMock = [
  {
    id_requisicion: 101,
    codigo_requisicion: "REQ-2026-001",
    tipo_solicitud: "Compra Directa",
    prioridad: "Alta",
    justificacion: "Se requiere material de oficina para administración del alcalde",
    dependencia: "Alcaldía Municipal",
    lugar_entrega: "Bodega Central",
    fecha_solicitud: "2026-10-01T09:00:00Z",
    fecha_asignacion: "2026-10-13T10:30:00Z",
    estado: "Asignado",
    monto_estimado: "12500.00",
    razon_social_proveedor: "Comercial El Quetzal, S.A.",
    nit_proveedor: "1234567-8",
    correo_proveedor: "ventas@elquetzal.com",
    items: [
      { id_detalle: 1, descripcion: "Papel bond carta (caja x 10 resmas)", cantidad: "5", unidad: "caja", observaciones: null },
      { id_detalle: 2, descripcion: "Tóner HP 26A original", cantidad: "3", unidad: "unidad", observaciones: "Para impresora principal" },
      { id_detalle: 3, descripcion: "Bolígrafos negros (caja x 50)", cantidad: "2", unidad: "caja", observaciones: null },
    ],
    documentos: [],
  },
  {
    id_requisicion: 102,
    codigo_requisicion: "REQ-2026-002",
    tipo_solicitud: "Compra Directa",
    prioridad: "Media",
    justificacion: "Reposición de insumos de limpieza para baños públicos del mercado municipal",
    dependencia: "Mercado Municipal",
    lugar_entrega: "Mercado Municipal, Bodega",
    fecha_solicitud: "2026-10-05T14:00:00Z",
    fecha_asignacion: "2026-10-13T11:00:00Z",
    estado: "Asignado",
    monto_estimado: "3200.00",
    razon_social_proveedor: "Suministros Oficina Total",
    nit_proveedor: "7654321-0",
    correo_proveedor: "contacto@oficinatotal.com",
    items: [
      { id_detalle: 1, descripcion: "Cloro líquido (galón)", cantidad: "10", unidad: "galón", observaciones: null },
      { id_detalle: 2, descripcion: "Jabón antibacterial (caja x 24)", cantidad: "5", unidad: "caja", observaciones: null },
      { id_detalle: 3, descripcion: "Desinfectante aroma lavador (litro)", cantidad: "8", unidad: "litro", observaciones: null },
    ],
    documentos: [],
  },
]

app.post("/api/requisiciones/:id/asignar-proveedor", (req, res) => {
  const id = Number(req.params.id)
  const { id_proveedor } = req.body

  if (!id_proveedor) {
    return res.status(400).json({ error: "id_proveedor es requerido" })
  }

  const proveedor = proveedores.find((p) => p.id_proveedor === Number(id_proveedor))
  if (!proveedor) {
    return res.status(404).json({ error: "Proveedor no encontrado" })
  }

  const existente = asignaciones.find((a) => a.id_requisicion === id)
  if (existente) {
    return res.status(409).json({ error: "Esta solicitud ya tiene un proveedor asignado" })
  }

  const nueva = {
    id_asignacion: nextAsignacionId++,
    id_requisicion: id,
    id_proveedor: Number(id_proveedor),
    fecha_asignacion: new Date().toISOString(),
  }
  asignaciones.push(nueva)

  res.json({ ok: true, mensaje: `Pedido asignado a ${proveedor.razon_social}`, asignacion: nueva })
})

app.get("/api/portal/pedidos-asignados", (req, res) => {
  res.json(pedidosAsignadosMock)
})

app.get("/api/proformas/proveedores-activos", (_req, res) => {
  res.json(proveedores)
})

app.get("/api/auth/login", (_req, res) => {
  res.json({ token: "mock-token", user: { nombre: "Proveedor Demo", rol: "proveedor" } })
})

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

app.listen(PORT, () => {
  console.log(`Mock server corriendo en http://localhost:${PORT}`)
})
