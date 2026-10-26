-- =============================================================================
-- 001_usuario_numero_documento_unique.sql
-- Impide que dos usuarios compartan el mismo número de documento.
--
-- Ejecutar UNA vez sobre bases de datos ya creadas. Las bases nuevas ya
-- incluyen esta restricción en chocoberry_bd.sql.
--
-- Antes de ejecutar, verifica que no existan duplicados:
--
--   SELECT numero_documento, COUNT(*) AS total
--   FROM usuario
--   GROUP BY numero_documento
--   HAVING COUNT(*) > 1;
--
-- Si la consulta devuelve filas, corrige esos documentos antes de aplicar
-- la restricción.
-- =============================================================================

USE chocoberry;

ALTER TABLE usuario
  ADD CONSTRAINT uq_usuario_numero_documento UNIQUE (numero_documento);
