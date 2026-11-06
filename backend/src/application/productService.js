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

  // Valida el retiro de caducados: o se retira todo (all) o un lote concreto (lotId)
  validateExit(data) {
    if (data.all === true) return { all: true, lotId: null };
    const lotId = Number(data.lotId);
    if (!Number.isInteger(lotId) || lotId <= 0) {
      throw new Error('Elige el lote caducado que quieres retirar');
    }
    return { all: false, lotId };
  }

  // Retira del inventario lotes caducados (salida) y devuelve cuáles se retiraron
  async registerExit(data, userId = null) {
    const clean = this.validateExit(data);
    return this.productRepositoryPort.registerExit(clean, userId);
  }

  // Historial de movimientos. El límite se acota para no devolver tablas enormes por accidente.
  async getMovements(limit) {
    const parsed = Number.parseInt(limit, 10);
    const safeLimit = Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 500) : 200;
    return this.productRepositoryPort.findMovements(safeLimit);
  }
}

module.exports = ProductService;
