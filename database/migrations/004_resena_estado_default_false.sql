-- =============================================================================
-- 004_resena_estado_default_false.sql
-- Las reseñas nuevas nacen inactivas y solo se publican cuando un
-- administrador las activa desde el panel.
--
-- Se puede ejecutar más de una vez. Solo cambia el valor por defecto de la
-- columna: las reseñas existentes conservan el estado que ya tienen. Las bases
-- nuevas ya incluyen este default en chocoberry_bd.sql.
-- =============================================================================

USE chocoberry;

ALTER TABLE resena
  MODIFY COLUMN estado BOOLEAN NOT NULL DEFAULT FALSE;
