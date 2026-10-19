# AGENTS.md

## Sin backend

Toda la información está simulada: usuarios y sesión en `localStorage`, catálogo/pedidos en arreglos en memoria. No busques endpoints ni servidor.

## No hay tests

No existe script `test`. La verificación es `npm run lint` + `npm run build` + revisión manual con `npm run dev`.

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # producción
npm run lint     # ESLint
npm run preview  # preview del build
```

## Autenticación en localStorage

Usuarios semilla con roles `cliente`, `administrador`, `repartidor`. `RequireAuth` maneja autenticación y autorización por rol. Ver `src/features/login/hooks/useAuth.jsx` para la API mock completa.

## Arquitectura por features

Código de dominio en `src/features/<domain>/` (pages, hooks, services, components, data). UI transversal en `src/shared/`. Rutas en `src/routes/`.

## Tema claro/oscuro

Mediante atributo `data-theme` en `<html>`, controlado por variables CSS en `src/shared/css/tokens.css`. No es CSS-in-JS.

## React Compiler activado

Configurado vía `babel-plugin-react-compiler` en `vite.config.js`. No agregar `useMemo`/`useCallback` manuales para memoización salvo que lo exija un perfilado.

## Dos librerías UI coexisten

MUI 9 (panel admin, formularios) y Bootstrap 5 (layout tienda). Verificar cuál usa la página destino antes de agregar componentes.

## Español

Rutas, texto de UI y mayoría de comentarios en español. Mantener esta convención.

## Moneda

Usar `src/shared/utils/formatPrice.js` (locale es-CO, formato `$85.000`) en lugar de formatear precios manualmente.

## ESLint

Config flat, ignora `dist/`. Solo lintea `js`/`jsx`.

## Capa de datos

Algunos archivos `services/` existen (ej. `categoryService.js`) pero los hooks correspondientes usan estado inline. No asumir que el service es la fuente de verdad — revisar el hook.
