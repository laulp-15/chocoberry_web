# ChocoBerry — Backend

API REST del backend de **ChocoBerry (Fresas Medellín)**, construida con
Node.js + Express (JavaScript, ES Modules) y MySQL.

## Stack

| Área | Tecnología |
| --- | --- |
| Runtime | Node.js (>= 18), ES Modules (`"type": "module"`) |
| Servidor | Express |
| Base de datos | MySQL con `mysql2/promise` (pool + consultas parametrizadas) |
| Validación | Zod |
| Autenticación | JWT + bcrypt |
| Utilidades | dotenv, cors, helmet, morgan, multer |
| Pruebas | Jest + Supertest |

## Requisitos

- Node.js >= 18
- MySQL con la base de datos creada a partir de:
  1. `../database/chocoberry_bd.sql` (estructura)
  2. `../database/chocoberry_datos_iniciales.sql` (datos mínimos)

## Instalación

```bash
cd backend
npm install
cp .env.example .env   # en Windows: copy .env.example .env
# Ajusta .env con tus credenciales de MySQL
```

## Variables de entorno

Se definen en `.env` (nunca se sube al repositorio):

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del servidor |
| `DB_HOST` / `DB_PORT` | Host y puerto de MySQL |
| `DB_USER` / `DB_PASSWORD` | Credenciales de MySQL |
| `DB_NAME` | Nombre de la base de datos (`chocoberry`) |
| `DB_SSL` | `true` si la BD está en la nube y exige SSL |
| `JWT_SECRET` | Secreto para firmar los tokens |
| `JWT_EXPIRES_IN` | Vigencia del token (ej. `1d`) |
| `FRONTEND_URL` | Único origen permitido por CORS |

## Scripts

```bash
npm run dev            # desarrollo con recarga automática (nodemon)
npm start              # producción (node src/server.js)
npm test               # pruebas con Jest + Supertest
npm run seed:catalogo  # carga el catálogo inicial (categorías, productos, etc.)
npm run seed:pedidos   # crea 15 pedidos de demostración con el catálogo real
npm run seed:resenas   # crea 10 reseñas de demostración con clientes reales
```

El seed de pedidos no escribe etiquetas visibles en los pedidos. Guarda los IDs
del lote en `scripts/.seed-pedidos.json` (ignorado por git) para poder
reemplazarlo después. Para borrar el lote anterior y volver a crearlo:

```bash
npm run seed:pedidos -- --reset
```

Ese `--reset` solo elimina los pedidos del manifiesto y los seeds antiguos
marcados con `[SEED-xx]`; no toca pedidos reales. El lote incluye pedidos
recientes en `Pendiente`, pedidos antiguos `Entregado` y algunos casos
`Rechazado`/`Cancelado`. Varios pedidos quedan sin comprobante para simular
pagos pendientes; los entregados se crean sin evidencia, porque esa carga es
exclusiva del repartidor.

El seed de reseñas usa clientes activos, preferiblemente con pedidos entregados,
y reparte 10 comentarios en los últimos meses. Guarda sus IDs en
`scripts/.seed-resenas.json` (ignorado por git). Para reemplazar el lote:

```bash
npm run seed:resenas -- --reset
```

## Estructura

```
src/
├── config/        # variables de entorno (env.js) y pool de MySQL (db.js)
├── controllers/   # manejo de request/response
├── services/      # reglas de negocio
├── models/        # acceso a datos (única capa que habla con MySQL)
├── routes/        # definición de endpoints (solo enrutan)
├── middlewares/   # autenticación, validación, manejo de errores
├── utils/         # helpers reutilizables
├── errors/        # errores personalizados (AppError y subclases)
├── validators/    # esquemas de validación con Zod
├── app.js         # configuración de Express
└── server.js      # punto de entrada
tests/             # pruebas unitarias y de integración
```

## Arquitectura (en capas)

```
routes → controllers → services → models → MySQL
```

- **routes:** solo definen endpoints y middlewares.
- **controllers:** manejan `req`/`res` y llaman a los services.
- **services:** contienen las reglas de negocio (no la BD).
- **models:** única capa que ejecuta SQL (parametrizado).
- **middlewares:** autenticación (JWT), autorización por permisos, validación (Zod) y errores.

## Formato de respuesta

Éxito:

```json
{ "success": true, "message": "Operación exitosa.", "data": {} }
```

Error:

```json
{ "success": false, "message": "Descripción del error.", "data": null }
```

## Endpoints

Base: `/api`

### Salud

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/api/health` | Comprobación de salud del servicio | Público |

### Acceso (`/api/auth`)

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| POST | `/auth/register` | Registro de cuenta de cliente (rol Cliente) | Público |
| POST | `/auth/login` | Inicio de sesión (devuelve JWT) | Público |
| POST | `/auth/forgot-password` | Solicita enlace de recuperación | Público |
| POST | `/auth/reset-password` | Restablece contraseña con el token | Público |
| POST | `/auth/logout` | Cierra la sesión | Autenticado |
| GET | `/auth/me` | Perfil del usuario autenticado | Autenticado |
| PUT | `/auth/me` | Actualiza el propio perfil | Autenticado |
| PUT | `/auth/me/password` | Cambia la propia contraseña | Autenticado |

### Usuarios (`/api/usuarios`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/usuarios` | Lista con filtros `nombre`, `correo`, `rol`, `id_rol`, `estado` | Usuarios · Ver |
| GET | `/usuarios/:id` | Detalle de un usuario | Usuarios · Ver |
| POST | `/usuarios` | Crea usuario/empleado | Usuarios · Crear |
| PUT | `/usuarios/:id` | Actualiza un usuario | Usuarios · Editar |
| PATCH | `/usuarios/:id/estado` | Activa/desactiva (cuerpo `{ "estado": true }`) | Usuarios · Cambiar estado |
| DELETE | `/usuarios/:id` | Elimina (bloqueado si tiene pedidos) | Usuarios · Eliminar |

> La gestión de clientes se hace desde este mismo módulo filtrando por rol:
> `GET /api/usuarios?rol=cliente`.

### Categorías (`/api/categorias`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/categorias` | Lista con filtros `nombre`, `estado` | Categorías · Ver |
| GET | `/categorias/:id` | Detalle de una categoría | Categorías · Ver |
| POST | `/categorias` | Crea una categoría (`{ nombre, estado? }`) | Categorías · Crear |
| PUT | `/categorias/:id` | Actualiza una categoría | Categorías · Editar |
| PATCH | `/categorias/:id/estado` | Activa/desactiva (`{ estado: true }`) | Categorías · Cambiar estado |
| DELETE | `/categorias/:id` | Elimina (bloqueado con `409` si tiene productos) | Categorías · Eliminar |

### Productos (`/api/productos`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/productos` | Lista con filtros `nombre`, `idCategoria`/`id_categoria`, `categoria`, `estado` | Productos · Ver |
| GET | `/productos/:id` | Detalle de un producto | Productos · Ver |
| POST | `/productos` | Crea un producto (ver nota de imagen) | Productos · Crear |
| PUT | `/productos/:id` | Actualiza un producto | Productos · Editar |
| PATCH | `/productos/:id/estado` | Activa/desactiva (`{ estado: true }`) | Productos · Cambiar estado |
| DELETE | `/productos/:id` | Elimina (bloqueado con `409` si está en pedidos) | Productos · Eliminar |

> **Imagen del producto:** se envía como archivo con `Content-Type:
> multipart/form-data` en el campo `imagen` (PNG, JPG o WEBP, máx. 5 MB). El
> archivo se guarda en `backend/uploads` y se sirve como estático en
> `GET /uploads/<archivo>`; en `producto.imagen` solo se persiste la **ruta**
> (`/uploads/...`). También se acepta un cuerpo JSON con `imagen` como texto
> (ruta o URL) para no obligar a un archivo.
>
> El campo de categoría acepta `id_categoria` / `idCategoria` (id) o `categoria`
> (nombre). La respuesta devuelve `categoria: { id, nombre }`.

### Presentaciones (`/api/presentaciones`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/presentaciones` | Lista con filtros `cantidadFresas`, `estado` | Productos · Ver |
| GET | `/presentaciones/:id` | Detalle de una presentación | Productos · Ver |
| POST | `/presentaciones` | Crea (`{ cantidadFresas, precio, estado? }`) | Productos · Crear |
| PUT | `/presentaciones/:id` | Actualiza una presentación | Productos · Editar |
| PATCH | `/presentaciones/:id/estado` | Activa/desactiva (`{ estado: true }`) | Productos · Cambiar estado |
| DELETE | `/presentaciones/:id` | Elimina (bloqueado con `409` si está en pedidos) | Productos · Eliminar |

> No existe un módulo "Presentaciones" en la tabla `modulo`, así que estas rutas
> reutilizan los permisos del módulo **Productos** (las presentaciones hacen
> parte del catálogo de productos).

### Catálogo de la tienda (`/api/catalogo`) — Público

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/catalogo/categorias` | Categorías activas | Público |
| GET | `/catalogo/presentaciones` | Presentaciones activas | Público |
| GET | `/catalogo/productos` | Productos activos (filtros `nombre`, `categoria`, `idCategoria`) | Público |
| GET | `/catalogo/productos/:id` | Detalle de un producto activo (`404` si está inactivo) | Público |
| GET | `/catalogo/municipios` | Municipios activos con su precio de domicilio | Público |
| GET | `/catalogo/glaseados` | Colores de glaseado activos (`codigoHex`) | Público |

> Rutas **sin sesión**, pensadas para la tienda. Devuelven únicamente registros
> con `estado = true`, de modo que el panel (`/categorias`, `/productos`,
> `/municipios`, `/glaseados`) conserva el chequeo de permisos y la tienda no
> necesita token.

> **Reglas de negocio del catálogo:**
> - Los nombres de **categoría** y **producto** son únicos sin distinguir
>   mayúsculas/minúsculas → `409` (la BD no lo impone; se valida en el service).
> - `cantidad_fresas` es única en **presentaciones** → `409`.
> - No se elimina una categoría con productos (`409`), ni un producto o
>   presentación que aparezca en algún pedido (`409`). Se sugiere desactivarlos.

> Los módulos de entregas y dashboard se agregan progresivamente en
> `src/routes/index.js`.

### Pedidos (`/api/pedidos`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/pedidos` | Lista con filtros `estado`, `idEstado`, `idMunicipio`, `idUsuario`, `cliente`, `fechaDesde`, `fechaHasta` | Pedidos · Ver |
| GET | `/pedidos/:id` | Detalle de un pedido | Pedidos · Ver |
| GET | `/pedidos/mios` | Pedidos del usuario autenticado | Pedidos · Ver |
| GET | `/pedidos/mios/:id` | Detalle de un pedido propio | Pedidos · Ver |
| POST | `/pedidos` | Crea un pedido con su comprobante (multipart) | Pedidos · Crear |
| PUT | `/pedidos/:id` | Edita la cabecera (no las líneas) | Pedidos · Editar |
| PATCH | `/pedidos/:id/estado` | Cambia el estado (`{ estado }`) | Pedidos · Cambiar estado |
| PATCH | `/pedidos/:id/rechazar` | Rechaza con motivo (`{ motivo }`) | Pedidos · Cambiar estado |
| PATCH | `/pedidos/:id/entrega` | Evidencia y observaciones del repartidor | Pedidos · Editar + solo Repartidor |
| DELETE | `/pedidos/:id` | Elimina el pedido y sus líneas | Pedidos · Eliminar |

> **Alcance por rol:** un **Cliente** solo ve sus propios pedidos (tanto en
> `/pedidos` como en `/pedidos/mios`); el **Repartidor** ve todos pero solo
> puede registrar la evidencia de entrega, nunca cambiar el estado ni editar la
> cabecera. El panel (Administrador) gestiona todo el ciclo, pero **no sube ni
> actualiza evidencia de entrega**: esa acción es exclusiva del Repartidor.

> **Estados y transiciones:**
> `Pendiente → En preparación / Rechazado` · `En preparación → Despachado` ·
> `Despachado → Entregado / Cancelado`. **Entregado, Rechazado y Cancelado son
> finales** (no admiten más cambios de estado). El rechazo solo aplica desde
> `Pendiente` y exige `motivo`; para rechazar se usa su endpoint, no el de
> cambio de estado.

> **Creación (multipart/form-data):** campo `comprobante`
> (PNG/JPG/WEBP, máx. 5 MB) + `fechaEntrega` (`YYYY-MM-DD`, se guarda a las
> 00:00), `direccion`, `barrio`, `idMunicipio`, `nombreReceptor`,
> `telefonoReceptor`, `lineas` (array JSON **como texto**) y los opcionales
> `mensajeTarjeta`, `instruccionesEntrega`, `idUsuario` (solo el admin puede
> crear a nombre de otro usuario). Cada línea es
> `{ idProducto, idPresentacion, cantidadProductos, idColorGlaseado, mensajePersonalizado?, personalizacionAdicional? }`.

> **Precios:** se calculan siempre en el servidor con `presentacion.precio`.
> `pedido.precio_domicilio` es un **snapshot** del precio del municipio al
> momento de crear el pedido; el total es derivado (`subtotal + domicilio`) y
> no existe como columna.

> **Mensaje personalizado (letras de chocolate):** por línea, el máximo de
> caracteres es la `cantidad_fresas` de la presentación (una letra por fresa) y
> nunca más de 255 → `422`.

> **Evidencia de entrega:** solo el rol **Repartidor** puede registrarla o
> actualizarla. Se envía como archivo en el campo `evidencia` y solo se permite
> con el pedido **Despachado** o **Entregado**; registrarla no cambia el estado.
> Si el pedido aún no tiene evidencia, la foto es obligatoria.

### Ventas (`/api/ventas`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/ventas` | Lista las ventas con filtros `estado`, `idMunicipio`, `idUsuario`, `cliente`, `fechaDesde`, `fechaHasta` | Ventas · Ver |
| GET | `/ventas/:id` | Detalle de una venta | Ventas · Ver |

> **Ventas no es una tabla nueva:** es una vista de solo lectura sobre
> `pedido`/`productoPedido`. No existen endpoints para crear, editar ni
> eliminar ventas; el ciclo de vida sigue viviendo en Pedidos.

> **Qué cuenta como venta:** un pedido en **En preparación**, **Despachado**,
> **Entregado** o **Cancelado**. Se excluyen **Pendiente** y **Rechazado**
> porque el pago aún no está aprobado. Por eso un pedido cancelado sigue
> apareciendo en Ventas: su pago ya estaba confirmado.

> **Detalle:** `GET /ventas/:id` responde `404` si el pedido existe pero está
> en un estado que no es venta. Los filtros por un estado no vendible
> (`pendiente` o `rechazado`) responden `422`. El listado conserva el orden
> `fecha DESC, id DESC` de Pedidos y devuelve el mismo contrato de pedido.

> Hoy el permiso **Ventas · Ver** solo lo tiene el rol **Administrador**. Los
> reportes (`Generar reporte` y `Exportar reporte`) y la generación de
> comprobantes quedan para una fase posterior.

### Reseñas (`/api/resenas`, `/api/catalogo/resenas`)

| Método | Ruta | Descripción | Acceso |
| --- | --- | --- | --- |
| GET | `/catalogo/resenas` | Reseñas activas para la tienda; filtro opcional `calificacion` | Público |
| GET | `/resenas` | Panel: todas las reseñas; filtros `cliente`, `calificacion`, `estado` | Administrador + Reseñas · Ver |
| GET | `/resenas/:id` | Detalle de una reseña | Administrador + Reseñas · Ver |
| POST | `/resenas` | Crea una reseña con `{ calificacion, comentario }` | Reseñas · Crear |
| PATCH | `/resenas/:id/estado` | Activa/desactiva (`{ estado: true }`) | Administrador + Reseñas · Cambiar estado |

> **La reseña es general:** no está asociada a un producto ni a un pedido. El
> esquema permite varias reseñas por usuario (1:N), así que no se impone una
> sola por persona.

> **El servidor controla los campos sensibles:** `id_usuario` sale del token de
> sesión, `fecha` la define la BD y `estado` nace activo. Si el cliente envía
> `clientName`, `fecha` o `estado`, se ignoran. El nombre que se muestra es el
> del usuario autenticado.

> **Reglas:** `calificacion` debe ser un entero entre 1 y 5; `comentario` es
> obligatorio y admite hasta 300 caracteres. La vista pública solo devuelve
> reseñas activas; el panel incluye activas e inactivas.

> **Panel:** por ahora no existen endpoints para editar el contenido ni para
> eliminar reseñas. El panel actual solo consulta el detalle y cambia el estado.
> La creación está disponible para **Cliente** y **Administrador**; el
> **Repartidor** no tiene el permiso.

### Municipios y glaseados (`/api/municipios`, `/api/glaseados`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/municipios` | Lista con filtros `nombre`, `estado` | Productos · Ver |
| GET | `/municipios/:id` | Detalle de un municipio | Productos · Ver |
| POST | `/municipios` | Crea (`{ nombre, precioDomicilio }` o alias `costoEnvio`) | Productos · Crear |
| PUT | `/municipios/:id` | Actualiza nombre, precio y/o estado | Productos · Editar |
| PATCH | `/municipios/:id/estado` | Activa/desactiva (`{ estado: true }`) | Productos · Cambiar estado |
| DELETE | `/municipios/:id` | Elimina (bloqueado con `409` si tiene pedidos) | Productos · Eliminar |
| GET | `/glaseados` | Lista con filtros `nombre`, `estado` | Productos · Ver |
| GET | `/glaseados/:id` | Detalle de un glaseado | Productos · Ver |
| POST | `/glaseados` | Crea (`{ nombre, codigoHex }` o alias `hex`) | Productos · Crear |
| PUT | `/glaseados/:id` | Actualiza nombre, color y/o estado | Productos · Editar |
| PATCH | `/glaseados/:id/estado` | Activa/desactiva (`{ estado: true }`) | Productos · Cambiar estado |
| DELETE | `/glaseados/:id` | Elimina (bloqueado con `409` si está en pedidos) | Productos · Eliminar |

> No existe un módulo "Municipios" ni "Glaseados" en la tabla `modulo`, así que
> estas rutas reutilizan los permisos del módulo **Productos**, igual que
> Presentaciones. La tienda los consulta sin sesión en
> `/catalogo/municipios` y `/catalogo/glaseados` (solo activos).

> **Reglas de negocio:**
> - El nombre de municipios y glaseados es único sin distinguir
>   mayúsculas/minúsculas → `409`.
> - El costo de envío debe ser un número ≥ 0; el color se normaliza a
>   `#RRGGBB` (acepta `#abcdef` o `abcdef`) → `422` si no es válido.
> - No se elimina un municipio con pedidos (`409`) ni un glaseado usado en
>   líneas de pedido (`409`). Se sugiere desactivarlos.
> - Un usuario sin rol administrador que consulte estas rutas solo ve los
>   registros activos (el Cliente hereda `Productos · Ver`).

### Roles (`/api/roles`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/roles` | Lista de roles con conteo de permisos y usuarios (filtro `nombre`) | Roles · Ver |
| GET | `/roles/:id` | Detalle de un rol | Roles · Ver |
| POST | `/roles` | Crea un rol (cuerpo `{ nombre, permisos: [ids] }`) | Roles · Crear |
| PUT | `/roles/:id` | Actualiza un rol (`permisos` opcional: si no viene, se conservan) | Roles · Editar |
| DELETE | `/roles/:id` | Elimina un rol (bloqueado con `409` si tiene usuarios) | Roles · Eliminar |
| GET | `/roles/:id/permisos` | Permisos asignados al rol | Roles · Ver |
| PUT | `/roles/:id/permisos` | Reemplaza la asignación (`{ permisos: [ids] }`) | Roles · Editar |

### Módulos (`/api/modulos`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/modulos` | Catálogo de módulos (filtro `nombre`) | Roles · Ver |
| GET | `/modulos/:id` | Detalle de un módulo | Roles · Ver |
| POST | `/modulos` | Crea un módulo | Roles · Crear |
| PUT | `/modulos/:id` | Actualiza un módulo | Roles · Editar |
| DELETE | `/modulos/:id` | Elimina (bloqueado con `409` si tiene permisos) | Roles · Eliminar |

### Acciones (`/api/acciones`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/acciones` | Catálogo de acciones (filtro `nombre`) | Roles · Ver |
| GET | `/acciones/:id` | Detalle de una acción | Roles · Ver |
| POST | `/acciones` | Crea una acción | Roles · Crear |
| PUT | `/acciones/:id` | Actualiza una acción | Roles · Editar |
| DELETE | `/acciones/:id` | Elimina (bloqueado con `409` si tiene permisos) | Roles · Eliminar |

### Permisos (`/api/permisos`)

| Método | Ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| GET | `/permisos` | Lista de permisos (filtros `modulo`, `accion`) | Roles · Ver |
| GET | `/permisos/:id` | Detalle de un permiso | Roles · Ver |
| POST | `/permisos` | Crea permiso (`{ id_modulo, id_accion, nombre? }`) | Roles · Crear |
| PUT | `/permisos/:id` | Actualiza un permiso | Roles · Editar |
| DELETE | `/permisos/:id` | Elimina (bloqueado con `409` si está en uso) | Roles · Eliminar |

> **Reglas de negocio del módulo:**
> - Un rol debe tener nombre único y al menos un permiso.
> - No se elimina un rol con usuarios asignados (`409`).
> - No se modifica ni elimina un permiso asignado a un rol **con usuarios** (`409`);
>   si el rol no tiene usuarios, sí se permite.
> - No se elimina un módulo o acción con permisos asociados (`409`).
> - Cualquier cambio en roles/permisos **invalida la caché** de autorización, por lo
>   que aplica de inmediato sin reiniciar el servidor.

## Estado del proyecto

- [x] Esqueleto, conexión a BD y manejo de errores
- [x] Acceso y usuarios
- [x] Roles y permisos
- [x] Categorías, productos y presentaciones (+ catálogo público)
- [x] Pedidos + maestros (municipios y glaseados, con CRUD)
- [x] Ventas (vista de solo lectura de pedidos confirmados)
- [x] Reseñas (lectura pública, creación autenticada y moderación)
- [ ] Entregas
- [ ] Dashboard
