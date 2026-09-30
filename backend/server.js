const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const db = require('./database/db');
const { seedDatabase } = require('./database/seed');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database schema
db.initDb();

// Auto-seed if database has no users yet (convenient for first-time launch)
try {
  const userCount = db.get('SELECT COUNT(*) as count FROM users');
  if (!userCount || userCount.count === 0) {
    console.log('[SERVER] No existing users found. Seeding initial demo data...');
    seedDatabase();
  }
} catch (err) {
  console.warn('[SERVER] Auto-seed check notice:', err.message);
}

// Middleware
app.use(cors({
  origin: '*', // Allow requests from React frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Retail Inventory Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/optimization', optimizationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Retail Inventory Backend Server running on port ${PORT}`);
  console.log(`   API Base URL: http://localhost:${PORT}/api`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
