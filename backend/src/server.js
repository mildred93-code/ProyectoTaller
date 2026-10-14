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
app.post('/api/auth/register', userController.register);

// Rutas de Productos e Inventario (Lotes y Caducidades)
app.get('/api/products', productController.getProducts);
app.post('/api/products', productController.createProduct);

// Ruta de prueba general
app.get('/', (req, res) => {
  res.json({ message: 'API de Sistema de Farmacia funcionando correctamente 🚀' });
});

// Levantar servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});