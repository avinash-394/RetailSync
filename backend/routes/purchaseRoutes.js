const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/', purchaseController.getPurchases);
router.get('/:id', purchaseController.getPurchaseById);
router.post('/', authorizeRoles('ADMIN', 'STAFF'), purchaseController.createPurchase);
router.delete('/all', authorizeRoles('ADMIN'), purchaseController.deleteAllPurchases);

module.exports = router;
