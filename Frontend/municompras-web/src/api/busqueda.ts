import { api } from "./client"
import { listarRequisiciones } from "./requisiciones"
import { listarProveedores } from "./proveedores"
import { listarInventario } from "./bodega"
import type { SearchResult } from "@/models/busqueda"

// Buscador global del portal municipal: consulta en paralelo los módulos
// reales (solicitudes, proveedores e inventario) y unifica los resultados.
// Se usa Promise.allSettled para que un 403 de un módulo sin permiso no
// anule los resultados de los otros.

const LIMITE_POR_TIPO = 4

const ESTILO_POR_ESTADO_SOLICITUD: Record<string, string> = {
  Pendiente: "bg-gray-100 text-gray-600 border-gray-200",
  "En Revisión": "bg-amber-50 text-amber-700 border-amber-200",
  Aprobada: "bg-blue-50 text-blue-700 border-blue-200",
  Rechazada: "bg-red-50 text-red-700 border-red-200",
  "En Compra": "bg-amber-50 text-amber-700 border-amber-200",
  Cancelada: "bg-gray-100 text-gray-600 border-gray-200",
}

const ESTILO_POR_ALERTA: Record<string, string> = {
  OK: "bg-blue-50 text-blue-700 border-blue-200",
  Bajo: "bg-orange-50 text-orange-600 border-orange-200",
  "Crítico": "bg-red-50 text-red-700 border-red-200",
}

export async function buscarGlobal(q: string): Promise<SearchResult[]> {
  const [sol, prov, inv] = await Promise.allSettled([
    listarRequisiciones({ q, pageSize: LIMITE_POR_TIPO }),
    listarProveedores({ q, pageSize: LIMITE_POR_TIPO }),
    listarInventario({ q }),
  ])

  const resultados: SearchResult[] = []

  if (sol.status === "fulfilled") {
    for (const r of sol.value.data.slice(0, LIMITE_POR_TIPO)) {
      resultados.push({
        id: `s-${r.id_requisicion}`,
        type: "solicitud",
        title: `${r.codigo_requisicion} — ${r.siglas || r.nombre_dependencia}`,
        meta: r.justificacion,
        badge: r.estado,
        badgeStyle:
          ESTILO_POR_ESTADO_SOLICITUD[r.estado] ??
          "bg-gray-100 text-gray-600 border-gray-200",
      })
    }
  }

  if (prov.status === "fulfilled") {
    for (const p of prov.value.data.slice(0, LIMITE_POR_TIPO)) {
      resultados.push({
        id: `p-${p.id_proveedor}`,
        type: "proveedor",
        title: p.razon_social,
        meta: `NIT ${p.nit} · ${p.tipo}`,
        badge: p.activo ? "Activo" : "Inactivo",
        badgeStyle: p.activo
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-gray-100 text-gray-600 border-gray-200",
      })
    }
  }

  if (inv.status === "fulfilled") {
    for (const i of inv.value.slice(0, LIMITE_POR_TIPO)) {
      resultados.push({
        id: `i-${i.id_insumo}`,
        type: "stock",
        title: i.nombre,
        meta: `${i.stock_actual} ${i.unidad_simbolo} · ${i.nombre_bodega ?? "Bodega"}`,
        badge: i.alerta === "OK" ? "Disponible" : i.alerta,
        badgeStyle:
          ESTILO_POR_ALERTA[i.alerta] ??
          "bg-gray-100 text-gray-600 border-gray-200",
      })
    }
  }

  return resultados
}
