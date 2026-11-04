class UserRepositoryPort {
  async findByEmail(email) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  async save(user) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }
}

module.exports = UserRepositoryPort;