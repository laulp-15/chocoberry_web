-- =============================================================================
-- 010_mensaje_tarjeta_por_producto.sql
-- El mensaje de tarjeta pasa de la cabecera del pedido a cada línea de producto.
-- También renombra productoPedido.mensaje_personalizado -> letras_fresas.
--
-- Es repetible: comprueba la existencia de columnas antes de alterarlas.
-- =============================================================================

USE chocoberry;

-- 1. Agregar productoPedido.mensaje_tarjeta después de mensaje_personalizado
SET @existe_mensaje_tarjeta_pp := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'productoPedido'
       AND COLUMN_NAME = 'mensaje_tarjeta'
);

SET @sql_agregar_mensaje_tarjeta := IF(
    @existe_mensaje_tarjeta_pp = 0,
    'ALTER TABLE productoPedido ADD COLUMN mensaje_tarjeta VARCHAR(500) NULL AFTER mensaje_personalizado',
    'SELECT 1'
);

PREPARE stmt FROM @sql_agregar_mensaje_tarjeta;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Copiar el mensaje existente de pedido a cada una de sus líneas
SET @existe_mensaje_tarjeta_pedido := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'mensaje_tarjeta'
);

SET @sql_copiar_mensaje_tarjeta := IF(
    @existe_mensaje_tarjeta_pedido = 1,
    'UPDATE productoPedido pp JOIN pedido p ON p.id = pp.id_pedido SET pp.mensaje_tarjeta = p.mensaje_tarjeta',
    'SELECT 1'
);

PREPARE stmt FROM @sql_copiar_mensaje_tarjeta;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Eliminar pedido.mensaje_tarjeta
SET @existe_mensaje_tarjeta_pedido := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'mensaje_tarjeta'
);

SET @sql_eliminar_mensaje_tarjeta := IF(
    @existe_mensaje_tarjeta_pedido = 1,
    'ALTER TABLE pedido DROP COLUMN mensaje_tarjeta',
    'SELECT 1'
);

PREPARE stmt FROM @sql_eliminar_mensaje_tarjeta;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Renombrar mensaje_personalizado -> letras_fresas
SET @existe_mensaje_personalizado := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'productoPedido'
       AND COLUMN_NAME = 'mensaje_personalizado'
);

SET @existe_letras_fresas := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'productoPedido'
       AND COLUMN_NAME = 'letras_fresas'
);

SET @sql_renombrar := IF(
    @existe_mensaje_personalizado = 1 AND @existe_letras_fresas = 0,
    'ALTER TABLE productoPedido CHANGE COLUMN mensaje_personalizado letras_fresas VARCHAR(255) NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql_renombrar;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
