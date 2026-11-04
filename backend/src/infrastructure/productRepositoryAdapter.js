const ProductRepositoryPort = require('../domain/productRepositoryPort');
const Product = require('../domain/product');
const pool = require('./db');

class ProductRepositoryAdapter extends ProductRepositoryPort {
  async findAll() {
    const query = `
      SELECT
        l.id,
        m.nombre      AS name,
        l.numero_lote AS "batchNumber",
        l.stock,
        l.fecha_caducidad AS "expirationDate",
        CASE
          WHEN l.fecha_caducidad < CURRENT_DATE THEN 'CADUCADO'
          WHEN l.fecha_caducidad <= CURRENT_DATE + INTERVAL '90 days' THEN 'POR_VENCER'
          ELSE 'VIGENTE'
        END AS status
      FROM lotes l
      JOIN medicamentos m ON l.medicamento_id = m.id
      ORDER BY l.fecha_caducidad ASC
    `;
    const result = await pool.query(query);

    return result.rows.map(row => new Product(
      row.id,
      row.name,
      row.batchNumber,
      row.stock,
      row.expirationDate,
      row.status
    ));
  }

  // Registra un lote nuevo. Todo ocurre en una sola transacción:
  // o se guardan el medicamento, el lote y el movimiento de entrada, o no se guarda nada.
  async save(product, userId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Busca el medicamento por nombre; si no existe, lo crea (sin duplicarlo)
      const med = await client.query(
        `INSERT INTO medicamentos (nombre, descripcion, precio)
         VALUES ($1, '', 0)
         ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
         RETURNING id`,
        [product.name]
      );
      const medicamentoId = med.rows[0].id;

      // 2. Guarda el lote
      const lote = await client.query(
        `INSERT INTO lotes (medicamento_id, numero_lote, stock, fecha_caducidad)
         VALUES ($1, $2, $3, $4)
         RETURNING id, numero_lote AS "batchNumber", stock, fecha_caducidad AS "expirationDate"`,
        [medicamentoId, product.batchNumber, product.stock, product.expirationDate]
      );
      const row = lote.rows[0];

      // 3. Registra el movimiento de entrada en el historial
      await client.query(
        `INSERT INTO movimientos_inventario (lote_id, usuario_id, tipo_movimiento, cantidad)
         VALUES ($1, $2, 'ENTRADA', $3)`,
        [row.id, userId, row.stock]
      );

      await client.query('COMMIT');

      return new Product(row.id, product.name, row.batchNumber, row.stock, row.expirationDate, 'VIGENTE');
    } catch (err) {
      await client.query('ROLLBACK');
      if (err.code === '23505') {
        throw new Error('Ese número de lote ya está registrado para este medicamento');
      }
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = ProductRepositoryAdapter;
