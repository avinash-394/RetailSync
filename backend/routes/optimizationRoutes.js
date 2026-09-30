const express = require('express');
const router = express.Router();
const optimizationController = require('../controllers/optimizationController');
const { authenticateToken } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/role');

router.use(authenticateToken);

router.get('/analysis', optimizationController.getOptimizationAnalysis);
router.get('/reorders', optimizationController.getReorderAlerts);
router.post('/auto-po', authorizeRoles('ADMIN', 'STAFF'), optimizationController.autoGeneratePO);

module.exports = router;
