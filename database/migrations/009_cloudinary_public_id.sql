-- =============================================================================
-- 009_cloudinary_public_id.sql
-- Agrega el identificador público de Cloudinary a las imágenes de producto,
-- los comprobantes de pago y la evidencia de entrega. Las URLs se amplían a
-- VARCHAR(500) para soportar las URLs seguras de Cloudinary.
--
-- Las filas existentes quedan con public_id NULL: se consideran imágenes
-- antiguas y nunca se intentan borrar de Cloudinary.
--
-- Es repetible: las columnas se agregan solo si no existen.
-- =============================================================================

USE chocoberry;

-- -----------------------------------------------------------------------------
-- imagenProducto
-- -----------------------------------------------------------------------------
SET @tiene_public_id_imagen := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'imagenProducto'
       AND COLUMN_NAME = 'public_id'
);

SET @sql_agregar_public_id_imagen := IF(
    @tiene_public_id_imagen = 0,
    'ALTER TABLE imagenProducto ADD COLUMN public_id VARCHAR(255) NULL AFTER url',
    'SELECT 1'
);

PREPARE stmt FROM @sql_agregar_public_id_imagen;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE imagenProducto
    MODIFY url VARCHAR(500) NOT NULL;

-- -----------------------------------------------------------------------------
-- comprobantePago
-- -----------------------------------------------------------------------------
SET @tiene_public_id_comprobante := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'comprobantePago'
       AND COLUMN_NAME = 'public_id'
);

SET @sql_agregar_public_id_comprobante := IF(
    @tiene_public_id_comprobante = 0,
    'ALTER TABLE comprobantePago ADD COLUMN public_id VARCHAR(255) NULL AFTER url',
    'SELECT 1'
);

PREPARE stmt FROM @sql_agregar_public_id_comprobante;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE comprobantePago
    MODIFY url VARCHAR(500) NOT NULL;

-- -----------------------------------------------------------------------------
-- pedido.evidencia_entrega
-- -----------------------------------------------------------------------------
SET @tiene_evidencia_public_id := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'evidencia_public_id'
);

SET @sql_agregar_evidencia_public_id := IF(
    @tiene_evidencia_public_id = 0,
    'ALTER TABLE pedido ADD COLUMN evidencia_public_id VARCHAR(255) NULL AFTER evidencia_entrega',
    'SELECT 1'
);

PREPARE stmt FROM @sql_agregar_evidencia_public_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE pedido
    MODIFY evidencia_entrega VARCHAR(500) NULL;
