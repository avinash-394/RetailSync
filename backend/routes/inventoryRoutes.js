const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/overview', inventoryController.getInventoryOverview);
router.get('/transactions', inventoryController.getTransactions);
router.post('/adjust', authorizeRoles('ADMIN', 'STAFF'), inventoryController.adjustStock);

module.exports = router;
