const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

// All product routes require valid JWT
router.use(authenticateToken);

// Category endpoints
router.get('/categories', productController.getCategories);
router.post('/categories', authorizeRoles('ADMIN'), productController.createCategory);

// Product CRUD endpoints
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', authorizeRoles('ADMIN', 'STAFF'), productController.createProduct);
router.put('/:id', authorizeRoles('ADMIN', 'STAFF'), productController.updateProduct);
router.delete('/all', authorizeRoles('ADMIN'), productController.deleteAllProducts);
router.delete('/:id', authorizeRoles('ADMIN'), productController.deleteProduct);

module.exports = router;
