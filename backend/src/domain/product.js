class Product {
  constructor(id, name, batchNumber, stock, expirationDate, status) {
    this.id = id;
    this.name = name;
    this.batchNumber = batchNumber;
    this.stock = stock;
    this.expirationDate = new Date(expirationDate);
    this.status = status || null;
  }

  getExpirationStatus() {
    // Si ya viene calculado desde la BD, lo usamos directamente
    if (this.status) return this.status;

    const today = new Date();
    const diffTime = this.expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'CADUCADO';
    if (diffDays <= 90) return 'POR_VENCER';
    return 'VIGENTE';
  }
}

module.exports = Product;