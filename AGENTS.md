# MuniCompras — Gestión de Compras y Cadena de Proveedores

Sistema de gestión de compras, proveedores, bodega, facturación y portal de proveedores para la Municipalidad de Panajachel, Guatemala (moneda: quetzales "Q").

## Estructura

- `Backend/` — API REST (Node + Express) en el puerto **4000**, base de datos **PostgreSQL** (`GestionCadenadeProveedores`).
- `Frontend/municompras-web/` — app web (React 19 + Vite 8 + Tailwind CSS v4 + Recharts).
- `kardex/` — Excel fuente (`CARDEX..xlsx`) del kardex importado.
- `plan/` — documentos de planificación de módulos (referencia, no es código).
- `Referencia/` — imágenes de referencia (ej. formato de vales).

## Comandos

Ejecutar desde la carpeta correspondiente.

### Backend (`Backend/`)

- `npm install`
- `npm start` — `node src/index.js` (puerto 4000).
- `npm run dev` — `node --watch src/index.js`.
- No hay tests ni lint.

### Frontend (`Frontend/municompras-web/`)

- `npm install`
- `npm run dev` — Vite en `0.0.0.0`, puerto `$PORT` (default 8443). Proxy `/api` → `http://localhost:4000`.
- `npm run build` — `vite build` (no ejecuta `tsc`; no hay typecheck).
- `npm run format` — oxfmt.

## Arquitectura backend

- `src/index.js` — entrada; monta rutas y middleware (helmet, CORS, rate-limit).
- `src/db.js` — pool `pg` con env `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`.
- `src/config/env.js` — carga y valida variables (`.env`; plantilla en `.env.example`).
- `src/middlewares/` — `authenticate.js` (JWT) y `authorize.js` (roles).
- `src/routes/` — auth, users, roles, menus, dependencies, catalogos, configuracion, periodosFiscales, puestos, proveedores, proformas, requisiciones, facturacion, bodega, portal, reportes, dashboard, notificaciones, bitacora.
- `src/services/` — mailer, whatsapp, bitacora, notificaciones, alertas, presupuesto, menu, parametros, eventos.
- `src/utils/jwt.js` — firma/verificación de tokens (`JWT_SECRET`).
- `migrations/` — migraciones SQL numeradas. `seeds/` — datos semilla.
- `scripts/` — utilidades: `run_migration.cjs`, `run_sql.cjs`, `test_api.cjs`, `test-mail.mjs`, `importar-kardex.mjs`, `cargar-dependencias.mjs`.

### Variables de entorno (`.env`)

`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `JWT_SECRET`, `BASE_URL`, `PORT`, y configuración SMTP para recuperación de contraseña.

## Arquitectura frontend

- `src/main.tsx` — entrypoint; importa `src/index.css` y monta `src/App.tsx`.
- `src/App.tsx` — componente principal y punto de partida de la UI.
- `src/constants/theme.ts` — tokens de diseño: `G` (#1E5E2F), `GL`, `GB`, `ACCENT_PALETTE`. Importar con `@/constants/theme`.
- Alias `@` → `src/` (definido en `tsconfig.json` y `vite.config.ts`).
- Datos reales vía API (`VITE_API_URL`, proxy `/api`); no usar mocks.

## Estilo y convenciones

- UI en español (es-GT); formato de fechas `d/m/aaaa`, locale `es-GT`.
- Tailwind CSS v4 sin `tailwind.config`/PostCSS; CSS global y variables de tema en `src/index.css`. Modo oscuro vía `[data-theme="dark"]`, modo compacto vía `[data-compact="true"]`.
- Usar comillas dobles para strings con apóstrofos (un apóstrofe sin escapar en string con comillas simples rompe el build).
- Exportar componentes como default export.
- No hay scripts de test, lint ni typecheck; validar cambios con `npm run build`.

## Gotchas

- `kardex` y `bitacora` tienen triggers de inmutabilidad (`trg_kardex_inmutable`, `trg_bitacora_inmutable`): bloquean UPDATE/DELETE; TRUNCATE e INSERT sí pasan.
- La restricción `kardex_check` (que obligaba Entrada→id_recepcion / Salida→id_vale_salida) está **dropeada** para permitir el kardex histórico cargado.
- Los respaldos de base de datos viven en `Backend/backups/`.
