-- =============================================================================
-- 007_eliminar_barrio_personalizacion.sql
-- Elimina el barrio de usuarios y pedidos, y la personalización adicional de
-- las líneas de pedido. La dirección de entrega pasa a incluir el barrio.
--
-- ATENCIÓN: elimina también los valores históricos de pedidos ya registrados.
-- Se puede ejecutar más de una vez sobre bases de datos ya creadas. Las bases
-- nuevas ya no incluyen estas columnas en chocoberry_bd.sql.
-- =============================================================================

USE chocoberry;

SET @tiene_barrio_usuario := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'usuario'
       AND COLUMN_NAME = 'barrio'
);

SET @sql_eliminar_barrio_usuario := IF(
    @tiene_barrio_usuario = 1,
    'ALTER TABLE usuario DROP COLUMN barrio',
    'SELECT 1'
);

PREPARE stmt FROM @sql_eliminar_barrio_usuario;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @tiene_barrio_pedido := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'barrio'
);

SET @sql_eliminar_barrio_pedido := IF(
    @tiene_barrio_pedido = 1,
    'ALTER TABLE pedido DROP COLUMN barrio',
    'SELECT 1'
);

PREPARE stmt FROM @sql_eliminar_barrio_pedido;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @tiene_personalizacion_adicional := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'productoPedido'
       AND COLUMN_NAME = 'personalizacion_adicional'
);

SET @sql_eliminar_personalizacion_adicional := IF(
    @tiene_personalizacion_adicional = 1,
    'ALTER TABLE productoPedido DROP COLUMN personalizacion_adicional',
    'SELECT 1'
);

PREPARE stmt FROM @sql_eliminar_personalizacion_adicional;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
