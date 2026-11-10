-- =============================================================================
-- 006_token_contrasena.sql
-- Tokens de un solo uso para recuperación de contraseña y activación de cuentas.
-- Se guarda únicamente el hash SHA-256 del token; el valor original solo viaja
-- en el enlace enviado por correo.
-- =============================================================================

USE chocoberry;

CREATE TABLE IF NOT EXISTS tokenContrasena (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    tipo ENUM('recuperacion','activacion') NOT NULL,
    fecha_expiracion DATETIME NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_tokenContrasena_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id)
        ON DELETE CASCADE,
    INDEX idx_token_usuario_tipo_usado (id_usuario, tipo, usado)
) ENGINE=InnoDB;
