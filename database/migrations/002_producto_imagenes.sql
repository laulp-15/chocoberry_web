-- =============================================================================
-- 002_producto_imagenes.sql
-- Permite hasta 4 imágenes por producto.
--
-- Se puede ejecutar más de una vez sobre bases de datos ya creadas. Las bases
-- nuevas ya incluyen esta estructura en chocoberry_bd.sql.
--
-- Copia la imagen actual de `producto.imagen` como portada (orden = 1) sin
-- duplicarla si la migración ya se había aplicado, y después elimina la columna
-- solo si todavía existe. Los productos sin imagen quedan con 0 imágenes hasta
-- que se les agregue una desde el panel.
-- =============================================================================

USE chocoberry;

CREATE TABLE IF NOT EXISTS imagenProducto (
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

SET @tiene_columna_imagen := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'producto'
       AND COLUMN_NAME = 'imagen'
);

SET @sql_copiar_portadas := IF(
    @tiene_columna_imagen > 0,
    'INSERT INTO imagenProducto (id_producto, url, orden)
     SELECT p.id, p.imagen, 1
       FROM producto p
      WHERE p.imagen IS NOT NULL
        AND CHAR_LENGTH(TRIM(p.imagen)) > 0
     ON DUPLICATE KEY UPDATE url = url',
    'SELECT 1'
);

PREPARE stmt FROM @sql_copiar_portadas;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_eliminar_columna := IF(
    @tiene_columna_imagen > 0,
    'ALTER TABLE producto DROP COLUMN imagen',
    'SELECT 1'
);

PREPARE stmt FROM @sql_eliminar_columna;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
