-- =============================================================================
-- 005_comprobantes_pago.sql
-- Permite varios comprobantes de pago por pedido, cada uno con su propio estado
-- (Pendiente, Aprobado o Rechazado), monto verificado y motivo de rechazo.
--
-- Migra la antigua columna pedido.comprobante_pago como un comprobante
-- Pendiente con monto NULL y luego elimina la columna. Se puede ejecutar más
-- de una vez. Las bases nuevas ya incluyen todo en chocoberry_bd.sql y
-- chocoberry_datos_iniciales.sql.
-- =============================================================================

USE chocoberry;

CREATE TABLE IF NOT EXISTS estadosComprobante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO estadosComprobante (id, nombre) VALUES
    (1, 'Pendiente'),
    (2, 'Aprobado'),
    (3, 'Rechazado')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

CREATE TABLE IF NOT EXISTS comprobantePago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    monto DECIMAL(10,2),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo_rechazo VARCHAR(255),
    id_pedido INT NOT NULL,
    id_estado INT NOT NULL,
    CONSTRAINT fk_comprobantePago_pedido
        FOREIGN KEY (id_pedido) REFERENCES pedido(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comprobantePago_estado
        FOREIGN KEY (id_estado) REFERENCES estadosComprobante(id)
) ENGINE=InnoDB;

SET @tiene_columna_comprobante_pago := (
    SELECT COUNT(*)
      FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pedido'
       AND COLUMN_NAME = 'comprobante_pago'
);

-- Cada valor heredado se convierte en un comprobante Pendiente sin monto.
-- NOT EXISTS evita duplicarlo si la migración se ejecutó parcialmente antes.
SET @sql_migrar_comprobantes := IF(
    @tiene_columna_comprobante_pago = 1,
    'INSERT INTO comprobantePago (url, monto, fecha, id_pedido, id_estado)
     SELECT p.comprobante_pago, NULL, p.fecha, p.id, ec.id
       FROM pedido p
       JOIN estadosComprobante ec ON ec.nombre = ''Pendiente''
      WHERE p.comprobante_pago IS NOT NULL
        AND NOT EXISTS (
              SELECT 1
                FROM comprobantePago cp
               WHERE cp.id_pedido = p.id
                 AND cp.url = p.comprobante_pago
        )',
    'SELECT 1'
);

PREPARE stmt FROM @sql_migrar_comprobantes;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_eliminar_columna := IF(
    @tiene_columna_comprobante_pago = 1,
    'ALTER TABLE pedido DROP COLUMN comprobante_pago',
    'SELECT 1'
);

PREPARE stmt FROM @sql_eliminar_columna;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
