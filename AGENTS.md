# figma-make-app

Aplicación React + Vite + Tailwind CSS que se ejecuta dentro de Figma Make.

## Servidor de Desarrollo

Un servidor de desarrollo Vite **ya está ejecutándose** en `$PORT` (predeterminado 8443). No necesitas iniciarlo manualmente.

- URL de vista previa: el usuario puede acceder a la aplicación ejecutándose a través del panel de vista previa
- Recarga caliente: los cambios en los archivos de origen se reflejan de inmediato

## Estructura del Proyecto

Archivos clave (orden canónico):

- `src/main.tsx` — Punto de entrada de React; monta `src/App.tsx` en `#root`
- `src/App.tsx` — Componente principal de la aplicación
- `src/index.css` — CSS global + importación de Tailwind CSS v4
- `vite.config.ts` — Configuración de Vite con React, Tailwind v4 y plugins de Figma Make
- `package.json` — Dependencias y scripts
- `index.html` — Cáscara HTML de Vite con `#root`

### Alias

- `'@'` se resuelve a `import.meta.dirname` + `/src` (línea 29 de `vite.config.ts`)
- **No uses `__dirname`** — fue reemplazado con `import.meta.dirname` para corregir advertencias de Vite

### Dependencias

- Tiempo de ejecución: React 19, React DOM 19, Recharts
- Estilizado: Tailwind CSS v4 con plugin `@tailwindcss/vite`
- Herramientas de construcción: Vite 8, TypeScript 5.7, `@vitejs/plugin-react`
- Formato: oxfmt

### Scripts

- `dev` — inicia el servidor Vite (host: 0.0.0.0)
- `build` — `vite build`
- `preview` — `vite preview`
- `format` — `oxfmt` (formatea todos los archivos)

### Estilizado

- Tailwind CSS v4 — no se necesita configuración PostCSS
- Utiliza clases utility de Tailwind en JSX
- CSS global o personalización de tema Tailwind v4 va en `src/index.css`
- Mantén las declaraciones `@import` al principio en `src/index.css`

### Calidad de Código

- Usa **comillas dobles** para cadenas que contengan apóstrofes (`"we're"`). Una apóstrofe sin escapar en cadenas entre comillas simples rompe el build.
- Asegúrate de que las etiquetas JSX estén cerradas y las llaves estén balanceadas.
- Exporta los componentes como **exportaciones por defecto**.

### Advertencias de Vite corregidas (2024)

Dos advertencias fueron eliminadas con estos cambios:

1. **Línea 6**: `import siteConfiguration from './.figma/make/site.json' with { type: 'json' }` — se agregaron los atributos de importación JSON
2. **Línea 29**: `'@': path.resolve(import.meta.dirname, './src')` — reemplazó `__dirname` con `import.meta.dirname`