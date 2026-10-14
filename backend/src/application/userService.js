const bcrypt = require('bcrypt');
const User = require('../domain/user');

class UserService {
  constructor(userRepositoryPort) {
    this.userRepositoryPort = userRepositoryPort;
  }

  async login(email, password) {
    const user = await this.userRepositoryPort.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }

  async register(email, password, role) {
    const existingUser = await this.userRepositoryPort.findByEmail(email);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User(null, email, passwordHash, role || 'farmaceutico');
    const savedUser = await this.userRepositoryPort.save(newUser);

    return {
      id: savedUser.id,
      email: savedUser.email,
      role: savedUser.role
    };
  }
}

module.exports = UserService;