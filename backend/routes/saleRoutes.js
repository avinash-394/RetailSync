const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/', saleController.getSales);
router.get('/:id', saleController.getSaleById);
router.post('/', authorizeRoles('ADMIN', 'STAFF'), saleController.createSale);
router.delete('/all', authorizeRoles('ADMIN'), saleController.deleteAllSales);

module.exports = router;
