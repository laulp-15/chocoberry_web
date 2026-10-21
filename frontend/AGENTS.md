# AGENTS.md

## Backend real (conexión por módulos)

Existe un backend Express en `../backend` (`http://localhost:4000/api`). La
conexión se está haciendo **módulo por módulo**, de forma incremental:

- **Conectado:** módulo de **acceso** (login, registro, sesión, perfil,
  cambiar contraseña, logout, bloqueo por intentos, recuperar contraseña),
  **usuarios del panel** (`features/admin/users`, contra `/api/usuarios`),
  **catálogo** (categorías, productos, presentaciones, municipios y glaseados
  del panel contra `/api/categorias`, `/api/productos`,
  `/api/presentaciones`, `/api/municipios` y `/api/glaseados`; tienda contra
  el catálogo público `/api/catalogo`), **pedidos de la tienda** (el checkout
  crea contra `/api/pedidos` y “Mis pedidos” lista `/api/pedidos/mios` a
  través de `features/orders/services`) y **pedidos del panel**
  (`features/admin/orders` contra `/api/pedidos`: listado, detalle, alta,
  edición de cabecera, transiciones y rechazo). La evidencia de entrega es
  exclusiva del repartidor; el panel solo la muestra en el detalle, sin subirla
  ni actualizarla. **Ventas** (`features/admin/sales` contra `/api/ventas`:
  listado y detalle de pedidos confirmados; los botones de comprobante siguen
  pendientes). **Reseñas** (`features/reviews` contra
  `/api/catalogo/resenas` para lectura y `/api/resenas` para publicar;
  `features/admin/admin-reviews` contra `/api/resenas` para listado y cambio
  de estado).
- **Aún simulado:** entregas y dashboard. Siguen usando datos mock en
  memoria/localStorage.

No asumas que un `services/` existe porque el módulo esté conectado: revisa
si el hook llama al API o al mock.

## No hay tests

No existe script `test`. La verificación es `npm run lint` + `npm run build` + revisión manual con `npm run dev`.

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # producción
npm run lint     # ESLint
npm run preview  # preview del build
```

## Cliente HTTP y sesión

- `src/shared/api/client.js`: cliente `fetch` único. Toma la URL base de
  `VITE_API_URL` (ver `.env.example`) y adjunta el token automáticamente.
  Desenvuelve `{ success, message, data }` y lanza `ApiError` con `status`,
  `code` y `errors`.
- `src/shared/api/session.js`: único lugar que sabe dónde vive la sesión
  (usuario + token). "Recordarme" decide `localStorage` vs `sessionStorage`.
- Traducción de nombres y errores del backend ↔ front (por módulo) en
  `features/<dominio>/services/mappers.js`.
- Al agregar un módulo conectado: **no** llames a `fetch` desde el hook;
  crea su `services/` y usa `api` de `shared/api/client.js`.

## Autenticación (JWT por API)

`useAuth()` mantiene la misma API pública (`user`, `isAuthenticated`, `role`,
`login`, `register`, `requestPasswordReset`, `changePassword`, `logout`,
`updateUser`) pero ahora habla con el backend a través de
`features/login/services/authService.js`. La sesión y el token se guardan con
`shared/api/session.js`. `RequireAuth` sigue manejando autenticación y
autorización por rol (`cliente`, `administrador`, `repartidor`).

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

Existen dos situaciones y hay que distinguirlas:

- **Módulo conectado** (hoy: acceso, usuarios del panel, catálogo, maestros
  de municipios/glaseados, pedidos de la tienda, pedidos del panel, ventas y
  reseñas): el hook o la página delega en su `services/*.js`, que usa
  `shared/api/client.js`.
- **Módulo aún simulado:** archivos `services/` que existen de relleno
  (ej. `categoryService.js`) mientras el hook usa estado inline o mocks en
  `data/`. No asumir que el service es la fuente de verdad — revisar el hook.
- `features/cart/data/Shipping.js` todavía se usa en el dashboard simulado y
  en helpers de presentación de Pedidos. `features/catalog/data/Products.js`,
  `Pricing.js` y `Colors.js` ya no son fuente de datos para los módulos
  conectados (tienda, carrito, checkout, “Mis pedidos”, Pedidos y Ventas).
