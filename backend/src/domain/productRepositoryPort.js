class ProductRepositoryPort {
  async findAll() {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  async save(product) {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }

  async findExpiringSoon() {
    throw new Error("ERR_METHOD_NOT_IMPLEMENTED");
  }
}

module.exports = ProductRepositoryPort;