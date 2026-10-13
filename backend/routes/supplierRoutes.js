const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/', supplierController.getSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', authorizeRoles('ADMIN', 'STAFF'), supplierController.createSupplier);
router.put('/:id', authorizeRoles('ADMIN', 'STAFF'), supplierController.updateSupplier);
router.delete('/all', authorizeRoles('ADMIN'), supplierController.deleteAllSuppliers);
router.delete('/:id', authorizeRoles('ADMIN'), supplierController.deleteSupplier);

module.exports = router;
