/**
 * Database Seeder
 * Populates realistic sample data for student demo & evaluation.
 */

const bcrypt = require('bcryptjs');
const db = require('./db');

function seedDatabase() {
  console.log('[SEED] Initializing database schema...');
  db.initDb();

  // Clear existing records to ensure clean state
  console.log('[SEED] Clearing existing records...');
  db.exec(`
    DELETE FROM inventory_transactions;
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM purchase_items;
    DELETE FROM purchases;
    DELETE FROM products;
    DELETE FROM suppliers;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  console.log('[SEED] Inserting users...');
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const staffHash = bcrypt.hashSync('staff123', salt);

  const adminResult = db.run(
    `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)`,
    ['Admin Officer (Karan Sharma)', 'admin@retail.com', adminHash, 'ADMIN', '+91 98765 00001']
  );
  const adminId = Number(adminResult.lastInsertRowid);

  const staffResult = db.run(
    `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)`,
    ['Staff Operator (Priya Patel)', 'staff@retail.com', staffHash, 'STAFF', '+91 98765 00002']
  );
  const staffId = Number(staffResult.lastInsertRowid);

  console.log('[SEED] Inserting categories...');
  const categoryNames = [
    { name: 'Electronics & Smart Tech', desc: 'Peripherals, cables, chargers, and accessories' },
    { name: 'Grocery & Staples', desc: 'Rice, flour, oils, spices, and grains' },
    { name: 'Beverages & Dairy', desc: 'Coffee, tea, juices, dairy products' },
    { name: 'Personal Care & Hygiene', desc: 'Soaps, dental, skincare essentials' },
    { name: 'Household & Cleaning', desc: 'Detergents, cleaners, and paper products' }
  ];

  const catMap = {};
  for (const c of categoryNames) {
    const res = db.run('INSERT INTO categories (name, description) VALUES (?, ?)', [c.name, c.desc]);
    catMap[c.name] = Number(res.lastInsertRowid);
  }

  console.log('[SEED] Inserting suppliers...');
  const suppliers = [
    {
      name: 'Apex Global Electronics Ltd',
      contact: 'Rajesh Verma',
      email: 'sales@apextech.in',
      phone: '+91 98111 22334',
      address: 'Plot 14, Electronics City, Bangalore, Karnataka'
    },
    {
      name: 'Prime FMCG Wholesalers',
      contact: 'Sunil Mehta',
      email: 'orders@primefmcg.com',
      phone: '+91 98222 33445',
      address: 'APMC Market Yard, Navi Mumbai, Maharashtra'
    },
    {
      name: 'Heritage Foods & Dairy Co',
      contact: 'Anita Deshmukh',
      email: 'distribution@heritagefoods.in',
      phone: '+91 98333 44556',
      address: 'Industrial Area Phase 2, Chandigarh'
    },
    {
      name: 'CleanCare Essentials Pvt Ltd',
      contact: 'Vikram Joshi',
      email: 'supply@cleancare.co.in',
      phone: '+91 98444 55667',
      address: 'Ambattur Industrial Estate, Chennai, Tamil Nadu'
    }
  ];

  const supMap = {};
  for (const s of suppliers) {
    const res = db.run(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, status) VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [s.name, s.contact, s.email, s.phone, s.address]
    );
    supMap[s.name] = Number(res.lastInsertRowid);
  }

  console.log('[SEED] Inserting products...');
  const productDefinitions = [
    // Electronics
    {
      sku: 'ELEC-101',
      name: 'Logitech B100 Optical USB Mouse',
      category: 'Electronics & Smart Tech',
      supplier: 'Apex Global Electronics Ltd',
      brand: 'Logitech',
      unit: 'pcs',
      cost: 240.0,
      price: 399.0,
      stock: 45,
      minThresh: 15,
      leadTime: 4
    },
    {
      sku: 'ELEC-102',
      name: 'Braided Type-C Fast Charging Cable 1.5m',
      category: 'Electronics & Smart Tech',
      supplier: 'Apex Global Electronics Ltd',
      brand: 'Portronics',
      unit: 'pcs',
      cost: 110.0,
      price: 249.0,
      stock: 6, // LOW STOCK
      minThresh: 20,
      leadTime: 5
    },
    {
      sku: 'ELEC-103',
      name: 'SanDisk Ultra 64GB MicroSD Card',
      category: 'Electronics & Smart Tech',
      supplier: 'Apex Global Electronics Ltd',
      brand: 'SanDisk',
      unit: 'pcs',
      cost: 380.0,
      price: 599.0,
      stock: 0, // OUT OF STOCK
      minThresh: 10,
      leadTime: 6
    },
    {
      sku: 'ELEC-104',
      name: 'Boat BassHeads 100 Wired Earphones',
      category: 'Electronics & Smart Tech',
      supplier: 'Apex Global Electronics Ltd',
      brand: 'Boat',
      unit: 'pcs',
      cost: 220.0,
      price: 399.0,
      stock: 28,
      minThresh: 10,
      leadTime: 4
    },
    {
      sku: 'ELEC-105',
      name: 'Wipro 16A Smart WiFi Plug with Energy Monitor',
      category: 'Electronics & Smart Tech',
      supplier: 'Apex Global Electronics Ltd',
      brand: 'Wipro',
      unit: 'pcs',
      cost: 650.0,
      price: 999.0,
      stock: 14,
      minThresh: 8,
      leadTime: 7
    },

    // Grocery & Staples
    {
      sku: 'GROC-201',
      name: 'Daawat Rozana Super Basmati Rice 5kg',
      category: 'Grocery & Staples',
      supplier: 'Prime FMCG Wholesalers',
      brand: 'Daawat',
      unit: 'pack',
      cost: 380.0,
      price: 495.0,
      stock: 35,
      minThresh: 15,
      leadTime: 3
    },
    {
      sku: 'GROC-202',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L',
      category: 'Grocery & Staples',
      supplier: 'Prime FMCG Wholesalers',
      brand: 'Fortune',
      unit: 'pouch',
      cost: 115.0,
      price: 145.0,
      stock: 8, // LOW STOCK
      minThresh: 25,
      leadTime: 3
    },
    {
      sku: 'GROC-203',
      name: 'Aashirvaad Superior Sharbati Atta 10kg',
      category: 'Grocery & Staples',
      supplier: 'Prime FMCG Wholesalers',
      brand: 'Aashirvaad',
      unit: 'bag',
      cost: 410.0,
      price: 510.0,
      stock: 22,
      minThresh: 10,
      leadTime: 4
    },
    {
      sku: 'GROC-204',
      name: 'Tata Salt Vacuum Evaporated Iodized 1kg',
      category: 'Grocery & Staples',
      supplier: 'Prime FMCG Wholesalers',
      brand: 'Tata',
      unit: 'pkt',
      cost: 21.0,
      price: 28.0,
      stock: 90,
      minThresh: 30,
      leadTime: 2
    },
    {
      sku: 'GROC-205',
      name: 'Catch Super Garam Masala Powder 100g',
      category: 'Grocery & Staples',
      supplier: 'Prime FMCG Wholesalers',
      brand: 'Catch',
      unit: 'box',
      cost: 62.0,
      price: 88.0,
      stock: 4, // LOW STOCK
      minThresh: 12,
      leadTime: 4
    },

    // Beverages & Dairy
    {
      sku: 'BEV-301',
      name: 'Nescafe Classic Instant Coffee Jar 100g',
      category: 'Beverages & Dairy',
      supplier: 'Heritage Foods & Dairy Co',
      brand: 'Nescafe',
      unit: 'jar',
      cost: 260.0,
      price: 340.0,
      stock: 32,
      minThresh: 15,
      leadTime: 5
    },
    {
      sku: 'BEV-302',
      name: 'Tata Tea Gold Leaf Pouch 500g',
      category: 'Beverages & Dairy',
      supplier: 'Heritage Foods & Dairy Co',
      brand: 'Tata Tea',
      unit: 'pouch',
      cost: 240.0,
      price: 310.0,
      stock: 40,
      minThresh: 12,
      leadTime: 3
    },
    {
      sku: 'BEV-303',
      name: 'Amul Taaza Homogenised Toned Milk 1L Tetra',
      category: 'Beverages & Dairy',
      supplier: 'Heritage Foods & Dairy Co',
      brand: 'Amul',
      unit: 'tetra',
      cost: 58.0,
      price: 74.0,
      stock: 5, // LOW STOCK
      minThresh: 20,
      leadTime: 2
    },
    {
      sku: 'BEV-304',
      name: 'Cadbury Bournvita Health Drink 500g Refill',
      category: 'Beverages & Dairy',
      supplier: 'Heritage Foods & Dairy Co',
      brand: 'Cadbury',
      unit: 'pack',
      cost: 195.0,
      price: 255.0,
      stock: 18,
      minThresh: 8,
      leadTime: 4
    },
    {
      sku: 'BEV-305',
      name: 'Real Fruit Power Alphonso Mango Nectar 1L',
      category: 'Beverages & Dairy',
      supplier: 'Heritage Foods & Dairy Co',
      brand: 'Real',
      unit: 'tetra',
      cost: 92.0,
      price: 130.0,
      stock: 0, // OUT OF STOCK
      minThresh: 15,
      leadTime: 3
    },

    // Personal Care
    {
      sku: 'CARE-401',
      name: 'Dettol Original Germ Protection Soap (Pack of 4)',
      category: 'Personal Care & Hygiene',
      supplier: 'CleanCare Essentials Pvt Ltd',
      brand: 'Dettol',
      unit: 'pack',
      cost: 165.0,
      price: 215.0,
      stock: 52,
      minThresh: 20,
      leadTime: 4
    },
    {
      sku: 'CARE-402',
      name: 'Colgate Total Advanced Health Toothpaste 150g',
      category: 'Personal Care & Hygiene',
      supplier: 'CleanCare Essentials Pvt Ltd',
      brand: 'Colgate',
      unit: 'tube',
      cost: 105.0,
      price: 145.0,
      stock: 38,
      minThresh: 15,
      leadTime: 3
    },
    {
      sku: 'CARE-403',
      name: 'Head & Shoulders Anti-Dandruff Shampoo 340ml',
      category: 'Personal Care & Hygiene',
      supplier: 'CleanCare Essentials Pvt Ltd',
      brand: 'Head & Shoulders',
      unit: 'bottle',
      cost: 280.0,
      price: 375.0,
      stock: 7, // LOW STOCK
      minThresh: 12,
      leadTime: 5
    },

    // Household & Cleaning
    {
      sku: 'HOUS-501',
      name: 'Surf Excel Matic Top Load Liquid Detergent 2L',
      category: 'Household & Cleaning',
      supplier: 'CleanCare Essentials Pvt Ltd',
      brand: 'Surf Excel',
      unit: 'bottle',
      cost: 345.0,
      price: 450.0,
      stock: 24,
      minThresh: 10,
      leadTime: 4
    },
    {
      sku: 'HOUS-502',
      name: 'Vim Dishwash Gel Lemon Squeeze Bottle 750ml',
      category: 'Household & Cleaning',
      supplier: 'CleanCare Essentials Pvt Ltd',
      brand: 'Vim',
      unit: 'bottle',
      cost: 135.0,
      price: 180.0,
      stock: 65,
      minThresh: 20,
      leadTime: 3
    },
    {
      sku: 'HOUS-503',
      name: 'Lizol Disinfectant Surface Cleaner Citrus 2L',
      category: 'Household & Cleaning',
      supplier: 'CleanCare Essentials Pvt Ltd',
      brand: 'Lizol',
      unit: 'bottle',
      cost: 290.0,
      price: 385.0,
      stock: 19,
      minThresh: 10,
      leadTime: 4
    }
  ];

  const createdProducts = [];
  for (const p of productDefinitions) {
    let status = 'IN_STOCK';
    if (p.stock === 0) status = 'OUT_OF_STOCK';
    else if (p.stock <= p.minThresh) status = 'LOW_STOCK';

    const res = db.run(
      `INSERT INTO products (
        sku, name, category_id, supplier_id, brand, unit,
        cost_price, selling_price, quantity, min_threshold, lead_time_days, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.sku,
        p.name,
        catMap[p.category],
        supMap[p.supplier],
        p.brand,
        p.unit,
        p.cost,
        p.price,
        p.stock,
        p.minThresh,
        p.leadTime,
        status
      ]
    );

    const prodId = Number(res.lastInsertRowid);
    createdProducts.push({ id: prodId, ...p, status });

    // Initial stock transaction
    if (p.stock > 0) {
      db.run(
        `INSERT INTO inventory_transactions (
          product_id, user_id, type, quantity_change, previous_stock, new_stock, reference_id, reason
        ) VALUES (?, ?, 'ADJUSTMENT_IN', ?, 0, ?, 'INITIAL-OPENING', 'Opening Inventory Setup')`,
        [prodId, adminId, p.stock, p.stock]
      );
    }
  }

  console.log('[SEED] Inserting historical purchases...');
  const purchaseOrders = [
    {
      supplier: 'Apex Global Electronics Ltd',
      daysAgo: 20,
      items: [
        { sku: 'ELEC-101', qty: 30, cost: 240.0 },
        { sku: 'ELEC-102', qty: 25, cost: 110.0 },
        { sku: 'ELEC-104', qty: 20, cost: 220.0 }
      ]
    },
    {
      supplier: 'Prime FMCG Wholesalers',
      daysAgo: 15,
      items: [
        { sku: 'GROC-201', qty: 40, cost: 380.0 },
        { sku: 'GROC-202', qty: 30, cost: 115.0 },
        { sku: 'GROC-204', qty: 80, cost: 21.0 }
      ]
    },
    {
      supplier: 'Heritage Foods & Dairy Co',
      daysAgo: 10,
      items: [
        { sku: 'BEV-301', qty: 25, cost: 260.0 },
        { sku: 'BEV-302', qty: 30, cost: 240.0 },
        { sku: 'BEV-304', qty: 20, cost: 195.0 }
      ]
    },
    {
      supplier: 'CleanCare Essentials Pvt Ltd',
      daysAgo: 5,
      items: [
        { sku: 'CARE-401', qty: 40, cost: 165.0 },
        { sku: 'HOUS-501', qty: 20, cost: 345.0 },
        { sku: 'HOUS-502', qty: 50, cost: 135.0 }
      ]
    }
  ];

  for (let i = 0; i < purchaseOrders.length; i++) {
    const po = purchaseOrders[i];
    const poNumber = `PO-2026-00${i + 1}`;
    let totalAmt = 0;
    const poItems = po.items.map(it => {
      const prod = createdProducts.find(p => p.sku === it.sku);
      const subtotal = it.qty * it.cost;
      totalAmt += subtotal;
      return { prod, qty: it.qty, cost: it.cost, subtotal };
    });

    const purRes = db.run(
      `INSERT INTO purchases (po_number, supplier_id, user_id, purchase_date, total_amount, status, notes)
       VALUES (?, ?, ?, datetime('now', '-' || ? || ' days'), ?, 'COMPLETED', ?)`,
      [poNumber, supMap[po.supplier], adminId, po.daysAgo, totalAmt, 'Stock replenishment order']
    );
    const purId = Number(purRes.lastInsertRowid);

    for (const item of poItems) {
      db.run(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [purId, item.prod.id, item.qty, item.cost, item.subtotal]
      );
    }
  }

  console.log('[SEED] Inserting 28 historical sales transactions across past 30 days...');
  const customerNames = [
    'Rahul Sen', 'Sneha Kapoor', 'Anand Kulkarni', 'Meera Nair', 'Vikramaditya Roy',
    'Deepak Nair', 'Kavita Sundaram', 'Amitabh Chawla', 'Siddharth Rao', 'Pooja Reddy',
    'Rohan Singhania', 'Tarun Bhatia', 'Walk-in Customer'
  ];

  const paymentModes = ['CASH', 'UPI', 'CARD', 'UPI'];

  // Seed sales over 28 different days with realistic items
  for (let s = 1; s <= 28; s++) {
    const daysAgo = 28 - s;
    const customer = customerNames[s % customerNames.length];
    const payment = paymentModes[s % paymentModes.length];
    const invNum = `INV-2026-${(1000 + s).toString()}`;

    // Select 2 to 4 random products for this sale
    const p1 = createdProducts[s % createdProducts.length];
    const p2 = createdProducts[(s + 3) % createdProducts.length];
    const p3 = createdProducts[(s + 7) % createdProducts.length];

    const saleLines = [
      { prod: p1, qty: 1 + (s % 3), price: p1.price },
      { prod: p2, qty: 1 + ((s + 1) % 2), price: p2.price },
      { prod: p3, qty: 1, price: p3.price }
    ];

    let subtotal = 0;
    for (const line of saleLines) {
      line.subtotal = Number((line.qty * line.price).toFixed(2));
      subtotal += line.subtotal;
    }

    const discount = (s % 5 === 0) ? 50.0 : 0.0;
    const tax = Number((subtotal * 0.05).toFixed(2)); // 5% GST
    const totalAmount = Number((subtotal - discount + tax).toFixed(2));

    const saleRes = db.run(
      `INSERT INTO sales (
        invoice_number, user_id, customer_name, customer_phone,
        sale_date, subtotal, tax_amount, discount_amount, total_amount, payment_method, notes
      ) VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days', '+' || ? || ' hours'), ?, ?, ?, ?, ?, ?)`,
      [
        invNum,
        staffId,
        customer,
        `+91 98${Math.floor(10000000 + Math.random() * 89999999)}`,
        daysAgo,
        (s * 2) % 24,
        subtotal,
        tax,
        discount,
        totalAmount,
        payment,
        'Counter POS checkout'
      ]
    );

    const saleId = Number(saleRes.lastInsertRowid);

    for (const line of saleLines) {
      db.run(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, line.prod.id, line.qty, line.price, line.subtotal]
      );
    }
  }

  console.log('[SEED] Completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Login credentials:');
  console.log('Admin: admin@retail.com / admin123');
  console.log('Staff: staff@retail.com / staff123');
  console.log('----------------------------------------------------');
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
