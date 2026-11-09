-- Migración 03: código de barras por medicamento
-- Ejecutar sobre la base farmacia_inventario (Query Tool de pgAdmin o psql).
-- El código de barras identifica al medicamento (no al lote). Es opcional.

ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(50);

-- Un código de barras no puede pertenecer a dos medicamentos (los vacíos sí se pueden repetir)
CREATE UNIQUE INDEX IF NOT EXISTS medicamentos_codigo_barras_unico
  ON medicamentos (codigo_barras)
  WHERE codigo_barras IS NOT NULL;
