-- DROP DATABASE IF EXISTS chocoberry;  -- descomentar SOLO para recrear desde cero (borra todos los datos)

CREATE DATABASE IF NOT EXISTS chocoberry
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_spanish_ci;

USE chocoberry;

-- ROLES, PERMISOS Y USUARIOS

CREATE TABLE rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE modulo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE accion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE permiso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    id_modulo INT NOT NULL,
    id_accion INT NOT NULL,
    -- Un permiso es una combinación única módulo + acción
    CONSTRAINT uq_permiso_modulo_accion UNIQUE (id_modulo, id_accion),
    CONSTRAINT fk_permiso_modulo
        FOREIGN KEY (id_modulo) REFERENCES modulo(id),
    CONSTRAINT fk_permiso_accion
        FOREIGN KEY (id_accion) REFERENCES accion(id)
) ENGINE=InnoDB;

CREATE TABLE rolPermiso (
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT fk_rolPermiso_rol
        FOREIGN KEY (id_rol) REFERENCES rol(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_rolPermiso_permiso
        FOREIGN KEY (id_permiso) REFERENCES permiso(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    barrio VARCHAR(100),
    direccion VARCHAR(200),
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    id_rol INT NOT NULL DEFAULT 3, -- por defecto: Cliente (id 3)
    CONSTRAINT uq_usuario_numero_documento UNIQUE (numero_documento),
    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol) REFERENCES rol(id)
) ENGINE=InnoDB;

-- CATÁLOGOS: PRODUCTOS, PRESENTACIONES, COLORES, ESTADOS, MUNICIPIOS

CREATE TABLE categoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE producto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    estado BOOLEAN NOT NULL DEFAULT TRUE,
    id_categoria INT NOT NULL,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria) REFERENCES categoria(id)
) ENGINE=InnoDB;

-- Hasta 4 imágenes por producto. `orden = 1` es la portada.
CREATE TABLE imagenProducto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    orden INT NOT NULL,
    CONSTRAINT fk_imagenProducto_producto
        FOREIGN KEY (id_producto) REFERENCES producto(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_imagenProducto_orden UNIQUE (id_producto, orden),
    CONSTRAINT ck_imagenProducto_orden CHECK (orden BETWEEN 1 AND 4)
) ENGINE=InnoDB;

CREATE TABLE presentacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cantidad_fresas INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE colorGlaseado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    codigo_hex VARCHAR(7) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE estadosPedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE estadosComprobante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE municipio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio_domicilio DECIMAL(10,2) NOT NULL,
    estado BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- PEDIDOS

CREATE TABLE pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mensaje_tarjeta VARCHAR(255),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega DATETIME,
    direccion VARCHAR(200) NOT NULL,
    barrio VARCHAR(100) NOT NULL,
    precio_domicilio DECIMAL(10,2) NOT NULL,
    nombre_receptor VARCHAR(100) NOT NULL,
    telefono_receptor VARCHAR(20) NOT NULL,
    motivo_rechazo VARCHAR(255),
    fecha_cancelacion DATETIME,
    -- Entregas
    instrucciones_entrega VARCHAR(255),
    observaciones_entrega VARCHAR(255),
    evidencia_entrega VARCHAR(255),
    id_usuario INT NOT NULL,
    id_estado INT NOT NULL,
    id_municipio INT NOT NULL,
    CONSTRAINT fk_pedido_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id),
    CONSTRAINT fk_pedido_estado
        FOREIGN KEY (id_estado) REFERENCES estadosPedido(id),
    CONSTRAINT fk_pedido_municipio
        FOREIGN KEY (id_municipio) REFERENCES municipio(id)
) ENGINE=InnoDB;

CREATE TABLE productoPedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    id_presentacion INT NOT NULL,
    cantidad_productos INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    mensaje_personalizado VARCHAR(255),
    id_color_glaseado INT,
    personalizacion_adicional VARCHAR(255),
    CONSTRAINT fk_prodPedido_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedido(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_prodPedido_producto
        FOREIGN KEY (id_producto) REFERENCES producto(id),
    CONSTRAINT fk_prodPedido_presentacion
        FOREIGN KEY (id_presentacion) REFERENCES presentacion(id),
    CONSTRAINT fk_prodPedido_color
        FOREIGN KEY (id_color_glaseado) REFERENCES colorGlaseado(id)
) ENGINE=InnoDB;

-- COMPROBANTES DE PAGO (puede haber varios por pedido)

CREATE TABLE comprobantePago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo_rechazo VARCHAR(255),
    id_pedido INT NOT NULL,
    id_estado INT NOT NULL,
    CONSTRAINT fk_comprobantePago_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedido(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comprobantePago_estado
        FOREIGN KEY (id_estado) REFERENCES estadosComprobante(id)
) ENGINE=InnoDB;

-- RESEÑAS (por usuario)

CREATE TABLE resena (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    comentario VARCHAR(500),
    fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
    estado BOOLEAN NOT NULL DEFAULT FALSE,
    id_usuario INT NOT NULL,
    CONSTRAINT fk_resena_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id)
) ENGINE=InnoDB;