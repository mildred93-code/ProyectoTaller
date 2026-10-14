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

  async save(product) {
    // Primero busca o crea el medicamento
    const medQuery = `
      INSERT INTO medicamentos (nombre, descripcion, precio)
      VALUES ($1, '', 0)
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    let medResult = await pool.query(medQuery, [product.name]);
    let medicamentoId;
    if (medResult.rows.length > 0) {
      medicamentoId = medResult.rows[0].id;
    } else {
      const findMed = await pool.query('SELECT id FROM medicamentos WHERE nombre = $1', [product.name]);
      medicamentoId = findMed.rows[0].id;
    }

    const query = `
      INSERT INTO lotes (medicamento_id, numero_lote, stock, fecha_caducidad) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, numero_lote as "batchNumber", stock, fecha_caducidad as "expirationDate"
    `;
    const values = [medicamentoId, product.batchNumber, product.stock, product.expirationDate];
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    return new Product(row.id, product.name, row.batchNumber, row.stock, row.expirationDate, 'VIGENTE');
  }
}

module.exports = ProductRepositoryAdapter;