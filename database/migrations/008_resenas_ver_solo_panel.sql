-- =============================================================================
-- 008_resenas_ver_solo_panel.sql
-- Quita "Ver Reseñas" al rol Cliente. El listado del panel (/api/resenas) pasa
-- a requerir solo ese permiso, así que no debe pertenecer al perfil de tienda.
-- La lectura pública sigue disponible en /api/catalogo/resenas y los clientes
-- conservan "Crear Reseñas" para publicar.
--
-- Es repetible: si la asignación ya no existe, no hace nada.
-- =============================================================================

USE chocoberry;

DELETE rp
  FROM rolPermiso rp
  JOIN rol r ON r.id = rp.id_rol
  JOIN permiso p ON p.id = rp.id_permiso
  JOIN modulo m ON m.id = p.id_modulo
  JOIN accion a ON a.id = p.id_accion
 WHERE r.nombre_rol = 'Cliente'
   AND m.nombre = 'Reseñas'
   AND a.nombre = 'Ver';
