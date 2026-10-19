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
npm run dev      # desarrollo con recarga automática (nodemon)
npm start        # producción (node src/server.js)
npm test         # pruebas con Jest + Supertest
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

> Los módulos de categorías/productos, pedidos, entregas, ventas, reseñas y
> dashboard se agregan progresivamente en `src/routes/index.js`.

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
- [ ] Categorías y productos
- [ ] Pedidos
- [ ] Entregas
- [ ] Ventas
- [ ] Reseñas
- [ ] Dashboard
