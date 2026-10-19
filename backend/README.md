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

> Los módulos de roles/permisos, categorías/productos, pedidos, entregas,
> ventas, reseñas y dashboard se agregan progresivamente en `src/routes/index.js`.

## Estado del proyecto

- [x] Esqueleto, conexión a BD y manejo de errores
- [x] Acceso y usuarios
- [ ] Roles y permisos
- [ ] Categorías y productos
- [ ] Pedidos
- [ ] Entregas
- [ ] Ventas
- [ ] Reseñas
- [ ] Dashboard
