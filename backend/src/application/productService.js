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

  // Valida y limpia los datos que llegan del formulario de registro de lote
  validateNewProduct(data) {
    const name = String(data.name ?? '').trim();
    const batchNumber = String(data.batchNumber ?? '').trim();
    const stock = Number(data.stock);
    const expirationDate = String(data.expirationDate ?? '').trim();

    if (!name) {
      throw new Error('El nombre del medicamento es obligatorio');
    }
    if (!batchNumber) {
      throw new Error('El número de lote es obligatorio');
    }
    if (!Number.isInteger(stock) || stock <= 0) {
      throw new Error('La cantidad debe ser un número entero mayor a 0');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expirationDate) || isNaN(new Date(expirationDate))) {
      throw new Error('La fecha de caducidad no es válida');
    }

    // Fecha de hoy en formato YYYY-MM-DD (hora local), para comparar sin problemas de zona horaria
    const today = new Date().toLocaleDateString('en-CA');
    if (expirationDate < today) {
      throw new Error('No se puede registrar un lote que ya caducó');
    }

    return { name, batchNumber, stock, expirationDate };
  }

  async createProduct(data, userId = null) {
    const clean = this.validateNewProduct(data);

    const newProduct = new Product(
      null,
      clean.name,
      clean.batchNumber,
      clean.stock,
      clean.expirationDate
    );
    const saved = await this.productRepositoryPort.save(newProduct, userId);

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
