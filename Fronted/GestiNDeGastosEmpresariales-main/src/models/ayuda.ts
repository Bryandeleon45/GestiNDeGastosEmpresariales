// ─── Centro de ayuda model ────────────────────────────────────────────────────
export interface GuiaSeccion {
  titulo: string
  pasos: string[]
}

export interface Guia {
  id: string
  q: string
  titulo: string
  archivo: string
  intro: string
  secciones: GuiaSeccion[]
  notas: string[]
}

export const GUIAS: Guia[] = [
  {
    id: "solicitudes",
    q: "¿Cómo crear una solicitud?",
    titulo: "Cómo crear una solicitud de compra o servicio",
    archivo: "guia-solicitudes.pdf",
    intro:
      "La solicitud es el punto de partida del ciclo de compras: la dependencia municipal expone la necesidad y el sistema la canaliza hacia aprobación, cotización y compra. Esta guía describe el proceso completo para crear y dar seguimiento a una solicitud dentro del sistema.",
    secciones: [
      {
        titulo: "1. Ingresar al módulo",
        pasos: [
          "Inicie sesión en el sistema con su usuario y contraseña institucionales.",
          "En el menú lateral izquierdo seleccione la opción «Dependencias».",
          "Presione el botón «Nueva solicitud», ubicado en la esquina superior derecha de la pantalla.",
        ],
      },
      {
        titulo: "2. Completar los datos de la solicitud",
        pasos: [
          "Seleccione la dependencia responsable y el tipo de solicitud correspondiente.",
          "Describa el motivo de la solicitud con la mayor claridad posible; este texto forma parte del expediente.",
          "Indique el lugar de entrega y asigne la prioridad (Normal, Alta o Urgente).",
          "Agregue los ítems requeridos: seleccione un insumo del catálogo de bodega o escriba una descripción libre, indicando cantidad y unidad de medida.",
        ],
      },
      {
        titulo: "3. Enviar y dar seguimiento",
        pasos: [
          "Presione «Guardar» para conservar un borrador, o «Enviar» para iniciar el trámite.",
          "El estado visible en la lista refleja el avance del proceso (Pendiente, Aprobada, En Compra, Cerrada).",
          "Usted y los responsables del módulo reciben notificaciones del sistema en cada cambio de estado.",
          "Puede consultar el detalle completo en cualquier momento desde la lista de solicitudes.",
        ],
      },
    ],
    notas: [
      "Solo las solicitudes aprobadas pasan a cotización con proveedores.",
      "Verifique las existencias en Bodega antes de crear ítems nuevos: en muchos casos la compra puede evitarse.",
      "El campo de justificación es obligatorio y constituye el sustento formal de la necesidad.",
    ],
  },
  {
    id: "bodega",
    q: "Guía de Bodega y Stock",
    titulo: "Bodega y control de existencias (stock)",
    archivo: "guia-bodega-stock.pdf",
    intro:
      "El módulo de Bodega administra el inventario de insumos de la Municipalidad: existencias mínimas, entradas por recepción de mercancía, salidas por requisición y el historial de movimientos (kardex) de cada artículo.",
    secciones: [
      {
        titulo: "1. Consultar el inventario",
        pasos: [
          "Seleccione «Bodega» en el menú lateral izquierdo.",
          "La pestaña de existencias muestra cada insumo, su unidad de medida y la cantidad disponible.",
          "Utilice el buscador para localizar un insumo por nombre o código.",
        ],
      },
      {
        titulo: "2. Stock mínimo y alertas",
        pasos: [
          "Cada insumo tiene definido un nivel de stock mínimo por la instancia responsable.",
          "Cuando la existencia alcanza o desciende del mínimo, el sistema emite una alerta a los usuarios del módulo y la registra en el centro de notificaciones.",
          "Atender las alertas de forma oportuna permite reponer inventario y evitar interrupciones de las actividades municipales.",
        ],
      },
      {
        titulo: "3. Entradas y salidas",
        pasos: [
          "Las entradas se registran al recibir mercancía contra una orden de compra aprobada.",
          "Las salidas se realizan mediante vales de salida asociados a la dependencia solicitante.",
          "Todo movimiento actualiza automáticamente las existencias del insumo.",
        ],
      },
      {
        titulo: "4. Kardex",
        pasos: [
          "La pestaña de kardex presenta el historial completo de movimientos por insumo: fecha, documento de respaldo, entrada, salida y saldo resultante.",
          "El kardex permite auditar cualquier diferencia entre el inventario físico y el registrado en el sistema.",
        ],
      },
    ],
    notas: [
      "Reporte cualquier diferencia física al responsable de bodega el mismo día en que se detecte.",
      "El inventario del sistema es la fuente de verdad para las decisiones de compra.",
    ],
  },
  {
    id: "reportes",
    q: "Generar reporte de gastos",
    titulo: "Generación de reportes de gestión y gastos",
    archivo: "guia-reportes-gastos.pdf",
    intro:
      "El módulo de Reportes consolida la información de solicitudes, órdenes de compra, cotizaciones y facturación. Su propósito es sustentar la toma de decisiones y la rendición de cuentas ante la instancia correspondiente.",
    secciones: [
      {
        titulo: "1. Acceder y definir filtros",
        pasos: [
          "Seleccione «Reportes» en el menú lateral izquierdo.",
          "Defina el periodo de consulta y los filtros disponibles (dependencia, estado, proveedor).",
          "Los indicadores y tablas se recalculan automáticamente conforme al filtro aplicado.",
        ],
      },
      {
        titulo: "2. Revisar los indicadores",
        pasos: [
          "Monto solicitado: suma de las solicitudes registradas en el periodo.",
          "Monto adjudicado: suma de las órdenes de compra emitidas.",
          "Monto facturado: suma de las facturas recibidas y validadas.",
          "El tablero también presenta el número de procesos y el tiempo promedio de adjudicación.",
        ],
      },
      {
        titulo: "3. Exportar el reporte",
        pasos: [
          "Presione el botón de exportación y elija el formato requerido (Excel o PDF).",
          "El archivo se descarga a su equipo con los datos tal como están filtrados en ese momento.",
        ],
      },
    ],
    notas: [
      "Los reportes se generan con datos en vivo del sistema; no se almacenan copias previas.",
      "Para entregas oficiales, exporte siempre desde el sistema: así se conserva la trazabilidad de la información.",
    ],
  },
  {
    id: "proveedores",
    q: "Gestión de proveedores",
    titulo: "Gestión de proveedores y portal de cotizaciones",
    archivo: "guia-proveedores.pdf",
    intro:
      "El módulo de Proveedores administra el registro de las empresas proveedoras y sus accesos al portal de cotizaciones, desde donde envían proformas, facturas y documentos de entrega. Esta guía resume las operaciones administrativas más frecuentes.",
    secciones: [
      {
        titulo: "1. Registrar un proveedor",
        pasos: [
          "Ingrese al módulo «Proveedores» y presione «Nuevo proveedor».",
          "Capture la razón social, el NIT, el representante legal, el domicilio y los datos de contacto, incluyendo el correo electrónico institucional.",
          "Guarde el registro para crear al proveedor en el sistema.",
        ],
      },
      {
        titulo: "2. Credenciales del portal",
        pasos: [
          "El sistema genera el usuario de acceso del proveedor al portal de cotizaciones.",
          "Si el proveedor olvida su contraseña, restablézcala desde la lista de proveedores.",
          "Solo los usuarios activos pueden iniciar sesión en el portal.",
        ],
      },
      {
        titulo: "3. Activar o desactivar proveedores",
        pasos: [
          "La lista de proveedores permite filtrar por estado y reactivar registros cuando sea necesario.",
          "Un proveedor inactivo no recibe invitaciones ni puede enviar cotizaciones.",
        ],
      },
      {
        titulo: "4. Invitaciones y cotizaciones",
        pasos: [
          "Al publicar un proceso de cotización, seleccione los proveedores a invitar.",
          "Cada proveedor invitado recibe una notificación en su portal.",
          "Las proformas enviadas aparecen en el módulo de Proformas para su evaluación y adjudicación.",
        ],
      },
    ],
    notas: [
      "Mantenga actualizados los correos electrónicos: a ellos se envían las credenciales y los avisos del sistema.",
      "Toda adjudicación a un proveedor queda registrada en la bitácora del sistema.",
    ],
  },
]

export const FAQ_LINKS = GUIAS.map(({ id, q }) => ({ id, q }))
