<<<<<<< HEAD
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
=======
# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.
>>>>>>> 4731c30859373cffd3be22c2f7510afd4945d42c
