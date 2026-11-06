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
      const { name, batchNumber, stock, expirationDate } = req.body;
      // req.user lo deja el middleware de autenticación: así queda registrado quién dio la entrada
      const userId = req.user ? req.user.id : null;
      const product = await this.productService.createProduct(
        { name, batchNumber, stock, expirationDate },
        userId
      );
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = ProductController;
