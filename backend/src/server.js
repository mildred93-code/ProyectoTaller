const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importación de Adaptadores de Base de Datos y Controladores
const UserRepositoryAdapter = require('./infrastructure/userRepositoryAdapter');
const UserService = require('./application/userService');
const UserController = require('./interfaces/userController');

const ProductRepositoryAdapter = require('./infrastructure/productRepositoryAdapter');
const ProductService = require('./application/productService');
const ProductController = require('./interfaces/productController');

const { requireAuth, requireRole } = require('./interfaces/authMiddleware');

// Sin clave secreta no se pueden firmar ni validar sesiones: mejor no arrancar
if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env. El servidor no puede iniciar.');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(cors());

// Instanciar dependencias (Inyección manual para Arquitectura Hexagonal)
const userRepository = new UserRepositoryAdapter();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const productRepository = new ProductRepositoryAdapter();
const productService = new ProductService(productRepository);
const productController = new ProductController(productService);

// ==========================================
// RUTAS DE LA API
// ==========================================

// Rutas de Usuarios / Autenticación
app.post('/api/auth/login', userController.login);
// Crear usuarios: solo un administrador con sesión iniciada
app.post('/api/auth/register', requireAuth, requireRole('admin'), userController.register);

// Rutas de Productos e Inventario (Lotes y Caducidades): requieren sesión
app.get('/api/products', requireAuth, productController.getProducts);
app.post('/api/products', requireAuth, productController.createProduct);

// Ruta de prueba general
app.get('/', (req, res) => {
  res.json({ message: 'API de Sistema de Farmacia funcionando correctamente 🚀' });
});

// Levantar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
