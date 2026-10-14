const Product = require('../domain/product');

class ProductService {
  constructor(productRepositoryPort) {
    this.productRepositoryPort = productRepositoryPort;
  }

  async getAllProducts() {
    const products = await this.productRepositoryPort.findAll();
    return products.map(p => ({
      id: p.id,
      name: p.name,
      batchNumber: p.batchNumber,
      stock: p.stock,
      expirationDate: p.expirationDate,
      status: p.getExpirationStatus()
    }));
  }

  async createProduct(data) {
    const newProduct = new Product(
      null, 
      data.name, 
      data.batchNumber, 
      data.stock, 
      data.expirationDate
    );
    const saved = await this.productRepositoryPort.save(newProduct);
    
    return {
      id: saved.id,
      name: saved.name,
      batchNumber: saved.batchNumber,
      stock: saved.stock,
      expirationDate: saved.expirationDate,
      status: saved.getExpirationStatus()
    };
  }
}

module.exports = ProductService;