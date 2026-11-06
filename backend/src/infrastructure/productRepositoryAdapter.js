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

  // Retiro de lotes caducados: saca del inventario el stock de un lote caducado (o de todos).
  // Es una SALIDA que deja el lote en 0 y queda registrada con el usuario que la hizo.
  // FOR UPDATE bloquea las filas para que dos retiros simultáneos no se pisen.
  async registerExit({ lotId = null, all = false }, userId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const base = `SELECT l.id, m.nombre AS name, l.numero_lote AS "batchNumber", l.stock,
                           (l.fecha_caducidad < CURRENT_DATE) AS expired
                      FROM lotes l
                      JOIN medicamentos m ON m.id = l.medicamento_id`;
      let lots;
      if (all) {
        lots = await client.query(
          `${base} WHERE l.stock > 0 AND l.fecha_caducidad < CURRENT_DATE ORDER BY l.fecha_caducidad, l.id FOR UPDATE OF l`
        );
        if (lots.rows.length === 0) {
          throw new Error('No hay lotes caducados con existencias para retirar');
        }
      } else {
        lots = await client.query(`${base} WHERE l.id = $1 FOR UPDATE OF l`, [lotId]);
        if (lots.rows.length === 0) throw new Error('El lote no existe');
        if (!lots.rows[0].expired) throw new Error('Solo se pueden retirar lotes caducados');
        if (lots.rows[0].stock <= 0) throw new Error('Ese lote ya no tiene existencias');
      }

      const retired = [];
      for (const lot of lots.rows) {
        await client.query('UPDATE lotes SET stock = 0 WHERE id = $1', [lot.id]);
        await client.query(
          `INSERT INTO movimientos_inventario (lote_id, usuario_id, tipo_movimiento, cantidad)
           VALUES ($1, $2, 'SALIDA', $3)`,
          [lot.id, userId, lot.stock]
        );
        retired.push({ id: lot.id, name: lot.name, batchNumber: lot.batchNumber, quantity: lot.stock });
      }

      await client.query('COMMIT');
      return { total: retired.reduce((s, l) => s + l.quantity, 0), lots: retired };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Historial de movimientos de inventario (entradas y salidas), del más reciente al más antiguo.
  // LEFT JOIN con usuarios: si el usuario ya no existe (o el movimiento es antiguo y no tiene usuario),
  // el movimiento sigue apareciendo, solo sin correo.
  async findMovements(limit = 200) {
    const result = await pool.query(
      `SELECT m.id,
              m.fecha            AS date,
              m.tipo_movimiento  AS type,
              m.cantidad         AS quantity,
              med.nombre         AS name,
              l.numero_lote      AS "batchNumber",
              u.email            AS "userEmail"
         FROM movimientos_inventario m
         JOIN lotes l          ON l.id = m.lote_id
         JOIN medicamentos med ON med.id = l.medicamento_id
         LEFT JOIN usuarios u  ON u.id = m.usuario_id
        ORDER BY m.fecha DESC, m.id DESC
        LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
}

module.exports = ProductRepositoryAdapter;
