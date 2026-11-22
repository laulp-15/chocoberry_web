-- =============================================================================
-- 012_comprobante_devuelto.sql
-- Renombra el estado de comprobante Rechazado a Devuelto y el motivo de
-- rechazo a motivo de devolución. Se puede ejecutar más de una vez.
-- No modifica el rechazo de pedidos.
-- =============================================================================

USE chocoberry;

UPDATE estadosComprobante
   SET nombre = 'Devuelto'
 WHERE nombre = 'Rechazado';

SET @tiene_motivo_rechazo := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'comprobantePago'
       AND COLUMN_NAME = 'motivo_rechazo'
);

SET @sql_renombrar_motivo := IF(
    @tiene_motivo_rechazo = 1,
    'ALTER TABLE comprobantePago CHANGE COLUMN motivo_rechazo motivo_devolucion VARCHAR(255) NULL',
    'SELECT 1'
);

PREPARE stmt FROM @sql_renombrar_motivo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
