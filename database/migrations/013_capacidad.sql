-- =============================================================================
-- 013_capacidad.sql
-- Control de capacidad diaria de producción (fresas por fecha de entrega).
-- Es idempotente: se puede ejecutar más de una vez.
-- =============================================================================

USE chocoberry;

-- Tope por día. Un día SIN fila usa el tope estándar de `configuracion`.
-- max_fresas = 0 significa día bloqueado.
CREATE TABLE IF NOT EXISTS capacidadDia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    max_fresas INT NOT NULL,
    CONSTRAINT uq_capacidadDia_fecha UNIQUE (fecha),
    CONSTRAINT ck_capacidadDia_max_fresas CHECK (max_fresas >= 0)
) ENGINE=InnoDB;

-- Configuración clave/valor del sistema.
-- capacidad_dia_max_fresas = tope estándar para días sin excepción.
CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(100) NOT NULL,
    valor VARCHAR(255) NOT NULL,
    PRIMARY KEY (clave)
) ENGINE=InnoDB;

-- Se crea el tope estándar solo si no existe (no pisa un valor ya editado).
INSERT INTO configuracion (clave, valor)
VALUES ('capacidad_dia_max_fresas', '200')
ON DUPLICATE KEY UPDATE clave = VALUES(clave);

-- Módulo "Capacidad" con permisos Ver (consultar) y Editar.
INSERT INTO modulo (nombre) VALUES ('Capacidad')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

SET @id_modulo_capacidad = (SELECT id FROM modulo WHERE nombre = 'Capacidad');
SET @id_accion_ver = (SELECT id FROM accion WHERE nombre = 'Ver');
SET @id_accion_editar = (SELECT id FROM accion WHERE nombre = 'Editar');

INSERT INTO permiso (nombre, id_modulo, id_accion)
VALUES ('Ver Capacidad', @id_modulo_capacidad, @id_accion_ver)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO permiso (nombre, id_modulo, id_accion)
VALUES ('Editar Capacidad', @id_modulo_capacidad, @id_accion_editar)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- El rol Administrador recibe los dos permisos nuevos.
INSERT IGNORE INTO rolPermiso (id_rol, id_permiso)
SELECT r.id, p.id
  FROM rol r
  JOIN permiso p ON p.id_modulo = @id_modulo_capacidad
 WHERE r.nombre_rol = 'Administrador';
