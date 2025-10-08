BEGIN;

-- Grupos
INSERT INTO catalogo_grupos (codigo, nombre, descripcion) VALUES
  ('VISITA_STATUS','Estados de visita','Ciclo de vida de visitas'),
  ('VISITA_PRIORITY','Prioridades de visita','Niveles de urgencia'),
  ('VISITA_TYPE','Tipos de visita','Clasificación por tipo')
ON CONFLICT (codigo) DO NOTHING;

-- STATUS
WITH g AS (SELECT id FROM catalogo_grupos WHERE codigo='VISITA_STATUS')
INSERT INTO catalogo_items (grupo_id, codigo, etiqueta, orden, color, por_defecto, activo)
SELECT g.id, x.codigo, x.etiqueta, x.orden, x.color, x.por_defecto, TRUE
FROM g, (VALUES
  ('nuevo','Nuevo',1,'#64748b',TRUE),
  ('asignada','Asignada',2,'#6366f1',FALSE),
  ('en_progreso','En progreso',3,'#0ea5e9',FALSE),
  ('reprogramada','Reprogramada',4,'#eab308',FALSE),
  ('resuelta','Resuelta',5,'#10b981',FALSE),
  ('cancelada','Cancelada',6,'#ef4444',FALSE)
) AS x(codigo,etiqueta,orden,color,por_defecto)
ON CONFLICT DO NOTHING;

-- PRIORITY
WITH g AS (SELECT id FROM catalogo_grupos WHERE codigo='VISITA_PRIORITY')
INSERT INTO catalogo_items (grupo_id, codigo, etiqueta, orden, color, por_defecto, activo)
SELECT g.id, x.codigo, x.etiqueta, x.orden, x.color, x.por_defecto, TRUE
FROM g, (VALUES
  ('baja','Baja',1,'#94a3b8',FALSE),
  ('media','Media',2,'#3b82f6',TRUE),
  ('alta','Alta',3,'#f97316',FALSE),
  ('critica','Crítica',4,'#dc2626',FALSE)
) AS x(codigo,etiqueta,orden,color,por_defecto)
ON CONFLICT DO NOTHING;

-- TYPE
WITH g AS (SELECT id FROM catalogo_grupos WHERE codigo='VISITA_TYPE')
INSERT INTO catalogo_items (grupo_id, codigo, etiqueta, orden, color, por_defecto, activo)
SELECT g.id, x.codigo, x.etiqueta, x.orden, x.color, x.por_defecto, TRUE
FROM g, (VALUES
  ('instalacion','Instalación',1,NULL,FALSE),
  ('mantenimiento','Mantenimiento',2,NULL,TRUE),
  ('soporte','Soporte',3,NULL,FALSE),
  ('inspeccion','Inspección',4,NULL,FALSE)
) AS x(codigo,etiqueta,orden,color,por_defecto)
ON CONFLICT DO NOTHING;

COMMIT;
