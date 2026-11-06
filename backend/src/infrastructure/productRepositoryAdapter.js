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

  // Registra una salida de inventario aplicando FEFO (First Expired, First Out):
  // descuenta primero del lote que vence antes y, si no alcanza, sigue con el siguiente.
  // Los lotes caducados nunca se usan para vender. Todo ocurre en una sola transacción:
  // o se descuentan todos los lotes necesarios y se guardan sus movimientos, o no se guarda nada.
  async registerExit(name, quantity, userId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lotes vigentes del medicamento, del que vence primero al que vence después.
      // FOR UPDATE bloquea esas filas: si dos personas dan salida al mismo tiempo,
      // la segunda espera y ya ve el stock actualizado (no se vende dos veces lo mismo).
      const lots = await client.query(
        `SELECT l.id, l.numero_lote AS "batchNumber", l.stock
           FROM lotes l
           JOIN medicamentos m ON m.id = l.medicamento_id
          WHERE m.nombre = $1
            AND l.stock > 0
            AND l.fecha_caducidad >= CURRENT_DATE
          ORDER BY l.fecha_caducidad ASC, l.id ASC
          FOR UPDATE OF l`,
        [name]
      );

      const available = lots.rows.reduce((sum, row) => sum + row.stock, 0);
      if (lots.rows.length === 0) {
        throw new Error('No hay existencias vigentes de ese medicamento');
      }
      if (available < quantity) {
        throw new Error(`Stock insuficiente: solo hay ${available} unidades vigentes de ${name}`);
      }

      let remaining = quantity;
      const taken = [];
      for (const lot of lots.rows) {
        if (remaining === 0) break;
        const take = Math.min(lot.stock, remaining);

        await client.query('UPDATE lotes SET stock = stock - $1 WHERE id = $2', [take, lot.id]);
        await client.query(
          `INSERT INTO movimientos_inventario (lote_id, usuario_id, tipo_movimiento, cantidad)
           VALUES ($1, $2, 'SALIDA', $3)`,
          [lot.id, userId, take]
        );

        taken.push({ id: lot.id, batchNumber: lot.batchNumber, taken: take, remaining: lot.stock - take });
        remaining -= take;
      }

      await client.query('COMMIT');
      return { name, quantity, lots: taken };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = ProductRepositoryAdapter;
