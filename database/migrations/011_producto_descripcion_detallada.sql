-- =============================================================================
-- 011_producto_descripcion_detallada.sql
-- Amplía la descripción del producto para permitir fichas más detalladas.
--
-- Es repetible: MODIFY deja la columna en el mismo tipo si ya se ejecutó.
-- =============================================================================

USE chocoberry;

ALTER TABLE producto
    MODIFY descripcion VARCHAR(1000) NULL;
