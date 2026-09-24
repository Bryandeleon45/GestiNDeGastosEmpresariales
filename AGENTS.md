# CadenaProveedores — Gestión de Gastos Empresariales

Prototipo de UI (Figma Make) para la gestión de gastos de la Municipalidad de Panajachel, Guatemala (moneda: quetzales "Q"). No hay backend todavía.

## Estructura

- `Backend/` — vacío (pendiente).
- `Fronted/` — el nombre del directorio es "Fronted" (typo), no "Frontend".
- `Fronted/GestiNDeGastosEmpresariales-main/` — la app real (React 19 + Vite 8 + Tailwind CSS v4 + Recharts).
- `Fronted/package-lock.json` — artefacto suelto con `"packages": {}`; ignorarlo, no es un paquete.

## Comandos

Ejecutar desde `Fronted/GestiNDeGastosEmpresariales-main/`.

- Gestor de paquetes: **pnpm** (`.mise.toml` fija pnpm 10.34.3 y Node 22). Existen `package-lock.json` y `pnpm-lock.yaml`; usar pnpm.
- `pnpm install`
- `pnpm dev` — Vite en `0.0.0.0`, puerto `$PORT` o 8443.
- `pnpm build` — `vite build`. **No** ejecuta `tsc` (no hay typecheck).
- `pnpm format` — oxfmt.
- No hay scripts de test, lint ni typecheck.

## Arquitectura

- `src/App.tsx` — archivo único y muy grande (~5300 líneas) con casi toda la UI: nav, búsqueda, notificaciones, alertas de stock, ticket de soporte, vistas de Dependencias/Solicitudes, bitácora, modales, pantalla de login, toast y FAB. La mayoría del trabajo ocurre aquí. Todo son datos mock hardcodeados.
- `src/features/users/UserManagement.tsx` — vista "Usuarios".
- `src/components/charts/DashboardCharts.tsx` — gráficas (recharts).
- `src/components/common/` — `Icons.tsx` (set de iconos) y `MunicipalSeal.tsx`.
- `src/constants/theme.ts` — tokens de diseño: `G` (#1E5E2F), `GL`, `GB`, `ACCENT_PALETTE`. Importar con `@/constants/theme`.
- Alias `@` → `src/` (definido en `tsconfig.json` y `vite.config.ts`).

## Estilo y convenciones

- UI en español (es-GT); textos y datos de muestra viven en `App.tsx` y `UserManagement.tsx`.
- Tailwind v4 sin `tailwind.config`/PostCSS; CSS global y variables de tema en `src/index.css`. Modo oscuro vía `[data-theme="dark"]`, modo compacto vía `[data-compact="true"]`.
- Usar comillas dobles para strings con apóstrofos (un apóstrofe sin escapar en string con comillas simples rompe el build).
- Exportar componentes como default export.

## Gotchas

- `vite.config.ts` importa `.figma/make/site.json`; el build falla si falta ese archivo (o el directorio `.figma`). La URL base usa `FIGMA_PUBLIC_URL`.
- El `AGENTS.md` dentro del proyecto frontend es auto-generado por Figma Make (asume un dev server ya corriendo en Figma); el `CLAUDE.md` solo hace `@AGENTS.md`.
