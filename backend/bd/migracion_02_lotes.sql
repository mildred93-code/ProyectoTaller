-- Migración 02: reglas para el registro de lotes
-- Ejecutar sobre la base farmacia_inventario (Query Tool de pgAdmin).
--
-- ANTES de ejecutarla, revisa que no haya medicamentos repetidos:
--   SELECT nombre, COUNT(*) FROM medicamentos GROUP BY nombre HAVING COUNT(*) > 1;
-- Si devuelve filas, hay que limpiarlas primero (el índice único fallaría).

-- 1. Un medicamento no puede repetirse por nombre
CREATE UNIQUE INDEX IF NOT EXISTS medicamentos_nombre_unico
  ON medicamentos (nombre);

-- 2. Un número de lote no puede repetirse para el mismo medicamento
CREATE UNIQUE INDEX IF NOT EXISTS lotes_medicamento_lote_unico
  ON lotes (medicamento_id, numero_lote);

-- 3. El stock nunca puede ser negativo
--    (se permite 0 porque un lote se agota cuando se vende todo)
ALTER TABLE lotes DROP CONSTRAINT IF EXISTS lotes_stock_positivo;
ALTER TABLE lotes DROP CONSTRAINT IF EXISTS lotes_stock_no_negativo;
ALTER TABLE lotes ADD CONSTRAINT lotes_stock_no_negativo CHECK (stock >= 0);
