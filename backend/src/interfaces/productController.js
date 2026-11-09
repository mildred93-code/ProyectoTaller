class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  getProducts = async (req, res) => {
    try {
      const products = await this.productService.getAllProducts();
      res.status(200).json({ success: true, data: products });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createProduct = async (req, res) => {
    try {
      const { name, batchNumber, stock, expirationDate, barcode } = req.body;
      // req.user lo deja el middleware de autenticación: así queda registrado quién dio la entrada
      const userId = req.user ? req.user.id : null;
      const product = await this.productService.createProduct(
        { name, batchNumber, stock, expirationDate, barcode },
        userId
      );
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // Busca el medicamento que corresponde a un código de barras (para autocompletar el formulario)
  getByBarcode = async (req, res) => {
    try {
      const found = await this.productService.getByBarcode(req.params.code);
      if (!found) {
        return res.status(404).json({ success: false, message: 'No hay un medicamento con ese código de barras' });
      }
      res.status(200).json({ success: true, data: found });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  exitProduct = async (req, res) => {
    try {
      const { lotId, all } = req.body;
      const userId = req.user ? req.user.id : null;
      const result = await this.productService.registerExit({ lotId, all }, userId);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  getMovements = async (req, res) => {
    try {
      const movements = await this.productService.getMovements(req.query.limit);
      res.status(200).json({ success: true, data: movements });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

module.exports = ProductController;
