-- =============================================================================
-- 003_pedido_fecha_cancelacion.sql
-- Guarda la fecha en que un pedido pasa a Cancelado para limitar la
-- reprogramación de la entrega a las primeras 48 horas.
--
-- Se puede ejecutar más de una vez sobre bases de datos ya creadas. Las bases
-- nuevas ya incluyen esta columna en chocoberry_bd.sql.
-- =============================================================================

USE chocoberry;

SET @tiene_columna_fecha_cancelacion := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'fecha_cancelacion'
);

SET @sql_agregar_columna := IF(
    @tiene_columna_fecha_cancelacion = 0,
    'ALTER TABLE pedido ADD COLUMN fecha_cancelacion DATETIME NULL AFTER motivo_rechazo',
    'SELECT 1'
);

PREPARE stmt FROM @sql_agregar_columna;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Aproximación conservadora para pedidos cancelados antes de esta migración:
-- se usa la fecha de creación. Los pedidos antiguos quedan fuera de la ventana.
UPDATE pedido p
  JOIN estadosPedido e ON e.id = p.id_estado
   SET p.fecha_cancelacion = p.fecha
 WHERE e.nombre = 'Cancelado'
   AND p.fecha_cancelacion IS NULL;
