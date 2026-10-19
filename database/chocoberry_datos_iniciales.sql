-- =============================================================================
-- chocoberry_datos_iniciales.sql
-- Datos mínimos para que el sistema funcione.
-- Ejecutar UNA sola vez, DESPUÉS de chocoberry_bd.sql (sobre una BD vacía).
-- =============================================================================

USE chocoberry;

-- -----------------------------------------------------------------------------
-- ROLES (el orden/ids importan: Administrador=1, Repartidor=2, Cliente=3)
-- -----------------------------------------------------------------------------
INSERT INTO rol (id, nombre_rol) VALUES
    (1, 'Administrador'),
    (2, 'Repartidor'),
    (3, 'Cliente');

-- -----------------------------------------------------------------------------
-- ESTADOS DE PEDIDO
-- Según lo confirmado: "No entregado" queda unificado en "Cancelado",
-- por eso no se inserta como estado propio.
-- -----------------------------------------------------------------------------
INSERT INTO estadosPedido (id, nombre) VALUES
    (1, 'Pendiente'),
    (2, 'En preparación'),
    (3, 'Despachado'),
    (4, 'Rechazado'),
    (5, 'Entregado'),
    (6, 'Cancelado');

-- -----------------------------------------------------------------------------
-- MÓDULOS (mismas claves que el catálogo del front: Permissions.js)
-- -----------------------------------------------------------------------------
INSERT INTO modulo (id, nombre) VALUES
    (1, 'Dashboard'),
    (2, 'Roles'),
    (3, 'Usuarios'),
    (4, 'Categorías'),
    (5, 'Productos'),
    (6, 'Carrito'),
    (7, 'Reseñas'),
    (8, 'Pedidos'),
    (9, 'Ventas');

-- -----------------------------------------------------------------------------
-- ACCIONES
-- -----------------------------------------------------------------------------
INSERT INTO accion (id, nombre) VALUES
    (1, 'Ver'),
    (2, 'Crear'),
    (3, 'Editar'),
    (4, 'Eliminar'),
    (5, 'Cambiar estado'),
    (6, 'Generar reporte'),
    (7, 'Exportar reporte');

-- -----------------------------------------------------------------------------
-- PERMISOS (combinación única módulo + acción)
-- Nombre: "<Acción> <Módulo>". El orden replica el autoincremental del front.
-- -----------------------------------------------------------------------------
INSERT INTO permiso (id, nombre, id_modulo, id_accion) VALUES
    -- Dashboard: ver, generar reporte, exportar reporte
    (1,  'Ver Dashboard',              1, 1),
    (2,  'Generar reporte Dashboard',  1, 6),
    (3,  'Exportar reporte Dashboard', 1, 7),
    -- Roles
    (4,  'Ver Roles',              2, 1),
    (5,  'Crear Roles',            2, 2),
    (6,  'Editar Roles',           2, 3),
    (7,  'Eliminar Roles',         2, 4),
    (8,  'Cambiar estado Roles',   2, 5),
    -- Usuarios
    (9,  'Ver Usuarios',               3, 1),
    (10, 'Crear Usuarios',             3, 2),
    (11, 'Editar Usuarios',            3, 3),
    (12, 'Eliminar Usuarios',          3, 4),
    (13, 'Cambiar estado Usuarios',    3, 5),
    -- Categorías
    (14, 'Ver Categorías',             4, 1),
    (15, 'Crear Categorías',           4, 2),
    (16, 'Editar Categorías',          4, 3),
    (17, 'Eliminar Categorías',        4, 4),
    (18, 'Cambiar estado Categorías',  4, 5),
    -- Productos
    (19, 'Ver Productos',              5, 1),
    (20, 'Crear Productos',            5, 2),
    (21, 'Editar Productos',           5, 3),
    (22, 'Eliminar Productos',         5, 4),
    (23, 'Cambiar estado Productos',   5, 5),
    -- Carrito
    (24, 'Ver Carrito',                6, 1),
    (25, 'Crear Carrito',              6, 2),
    (26, 'Editar Carrito',             6, 3),
    (27, 'Eliminar Carrito',           6, 4),
    (28, 'Cambiar estado Carrito',     6, 5),
    -- Reseñas
    (29, 'Ver Reseñas',                7, 1),
    (30, 'Crear Reseñas',              7, 2),
    (31, 'Editar Reseñas',             7, 3),
    (32, 'Eliminar Reseñas',           7, 4),
    (33, 'Cambiar estado Reseñas',     7, 5),
    -- Pedidos
    (34, 'Ver Pedidos',                8, 1),
    (35, 'Crear Pedidos',              8, 2),
    (36, 'Editar Pedidos',             8, 3),
    (37, 'Eliminar Pedidos',           8, 4),
    (38, 'Cambiar estado Pedidos',     8, 5),
    -- Ventas: ver, generar reporte, exportar reporte
    (39, 'Ver Ventas',                 9, 1),
    (40, 'Generar reporte Ventas',     9, 6),
    (41, 'Exportar reporte Ventas',    9, 7);

-- -----------------------------------------------------------------------------
-- ROL_PERMISO
-- Administrador: TODOS los permisos.
-- Repartidor y Cliente: perfil base (para que el sistema sea usable).
-- -----------------------------------------------------------------------------
-- Administrador (id 1) = todos los permisos → se resuelve con un SELECT.
INSERT INTO rolPermiso (id_rol, id_permiso)
    SELECT 1, id FROM permiso;

-- Repartidor (id 2): dashboard ver + pedidos ver/editar (incluye entregas)
INSERT INTO rolPermiso (id_rol, id_permiso) VALUES
    (2, 1),   -- Ver Dashboard
    (2, 34),  -- Ver Pedidos
    (2, 36);  -- Editar Pedidos

-- Cliente (id 3): catálogo, carrito, pedidos propios y reseñas
INSERT INTO rolPermiso (id_rol, id_permiso) VALUES
    (3, 14),  -- Ver Categorías
    (3, 19),  -- Ver Productos
    (3, 24),  -- Ver Carrito
    (3, 25),  -- Crear Carrito
    (3, 26),  -- Editar Carrito
    (3, 34),  -- Ver Pedidos
    (3, 35),  -- Crear Pedidos
    (3, 29),  -- Ver Reseñas
    (3, 30);  -- Crear Reseñas

-- -----------------------------------------------------------------------------
-- USUARIO ADMINISTRADOR INICIAL
-- Correo: admin@chocoberry.com   Contraseña: Admin123!  (hash bcrypt, coste 10)
-- -----------------------------------------------------------------------------
INSERT INTO usuario
    (nombres, apellidos, tipo_documento, numero_documento, correo, contrasena,
     telefono, barrio, direccion, estado, id_rol)
VALUES
    ('Admin', 'ChocoBerry', 'CC', '1000000000', 'admin@chocoberry.com',
     '$2b$10$pSqq5nMdX/2W0iKbNF37LeCzGEqcMcyPrSwXV4iQmAxQLoadrZ8I2',
     '3000000000', NULL, NULL, TRUE, 1);

-- =============================================================================
-- CATÁLOGOS PARA QUE LA TIENDA FUNCIONE
-- Estos datos hoy están "hardcodeados" en el front y son necesarios para
-- armar el carrito y calcular el domicilio.
-- =============================================================================

-- Presentaciones (cantidad de fresas + precio) — de catalog/data/Pricing.js
INSERT INTO presentacion (id, cantidad_fresas, precio, estado) VALUES
    (1, 6,  35000.00,  TRUE),
    (2, 8,  45000.00,  TRUE),
    (3, 12, 55000.00,  TRUE),
    (4, 16, 75000.00,  TRUE),
    (5, 30, 130000.00, TRUE);

-- Colores de glaseado — de catalog/data/Colors.js
INSERT INTO colorGlaseado (id, nombre, codigo_hex, estado) VALUES
    (1, 'Rosa',      '#EF818A', TRUE),
    (2, 'Azul',      '#3B82F6', TRUE),
    (3, 'Morado',    '#A855F7', TRUE),
    (4, 'Amarillo',  '#FACC15', TRUE),
    (5, 'Verde',     '#4ADE80', TRUE),
    (6, 'Chocolate', '#3B2415', TRUE),
    (7, 'Blanco',    '#FFFFFF', TRUE);

-- Municipios (precio de domicilio) — de cart/data/Shipping.js
INSERT INTO municipio (id, nombre, precio_domicilio, estado) VALUES
    (1, 'Medellín',    10000.00, TRUE),
    (2, 'Bello',       12000.00, TRUE),
    (3, 'Copacabana',  15000.00, TRUE),
    (4, 'Barbosa',     20000.00, TRUE),
    (5, 'Itagüí',      10000.00, TRUE),
    (6, 'Envigado',    10000.00, TRUE),
    (7, 'Sabaneta',    12000.00, TRUE),
    (8, 'La Estrella', 13000.00, TRUE);

-- Categorías — de catalog/data/Products.js (CATEGORIES)
INSERT INTO categoria (id, nombre, estado) VALUES
    (1, 'Fechas especiales', TRUE),
    (2, 'Cumpleaños',        TRUE),
    (3, 'Aniversarios',      TRUE),
    (4, 'Regalos',           TRUE);
