const UserRepositoryPort = require('../domain/userRepositoryPort');
const User = require('../domain/user.js');
const pool = require('./db');

class UserRepositoryAdapter extends UserRepositoryPort {
  async findByEmail(email) {
    const query = `
      SELECT u.id, u.email, u.password_hash as "passwordHash", r.nombre as "role"
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.email = $1
    `;
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return new User(row.id, row.email, row.passwordHash, row.role);
  }

  async save(user) {
    const query = `
      INSERT INTO usuarios (nombre, email, password_hash, rol_id) 
      VALUES ($1, $2, $3, (SELECT id FROM roles WHERE nombre = $4 LIMIT 1)) 
      RETURNING id, email, password_hash as "passwordHash"
    `;
    const values = [user.email, user.email, user.passwordHash, user.role || 'Farmaceutico'];
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    return new User(row.id, row.email, row.passwordHash, user.role);
  }
}

module.exports = UserRepositoryAdapter;