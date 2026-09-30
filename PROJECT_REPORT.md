# Project Report: Optimized Retail Inventory Management System (RetailSync)

**Degree:** Bachelor of Technology (B.Tech) in Computer Science & Engineering (3rd Year Capstone)  
**Project Track:** Enterprise Web Application Development & Inventory Optimization  
**Industry Guidance:** Under Mentorship of an HCL Trainee  

---

## 1. Abstract
Retail inventory management has traditionally relied on paper registers or static spreadsheets, leading to frequent stockouts, tied-up working capital, manual logging discrepancies, and delayed vendor replenishment. **RetailSync** is an optimized, web-based retail inventory management system designed using a modern 3-tier architecture (React.js, Node.js/Express.js, and Relational Database). 

The system automates the complete lifecycle of store inventory—from procurement and supplier orders to counter point-of-sale (POS) billing and invoice generation. Most importantly, the platform incorporates a deterministic inventory optimization engine implementing **Reorder Point (ROP)** formula calculations:
$$\text{Reorder Point} = (\text{Average Daily Sales} \times \text{Lead Time}) + \text{Safety Stock}$$

The platform identifies fast-moving vs. slow-moving stock, issues proactive stockout warnings, and automates purchase order generation.

---

## 2. Problem Statement & Objectives

### 2.1 Existing System Deficiencies
1. **Human Error in Stock Counting:** Over-reliance on physical register tallying results in inaccurate stock records.
2. **Untimely Reordering:** Store managers often order stock only after products are completely sold out, resulting in lost customer revenue.
3. **Overstocking and Locked Capital:** Excess ordering of slow-moving goods ties up critical store capital and increases expiration/damage risks.
4. **Lack of Auditability:** Absence of transactional movement logs makes tracking inventory shrinkage or cashier theft impossible.

### 2.2 Project Objectives
- Build a modular, responsive web application for retail store staff and administrators.
- Provide real-time inventory tracking with atomic stock updates during purchases and sales.
- Implement an automated Reorder Point calculation model based on historical sales velocity.
- Maintain an immutable, tamper-resistant transaction audit log for every stock adjustment.
- Generate digital tax invoices and comprehensive analytics on daily/weekly sales and gross profit margins.

---

## 3. System Requirements Specification (SRS)

### 3.1 Functional Requirements
1. **User Authentication & Role-Based Access Control (RBAC):**
   - Secure login using password hashing (bcrypt) and JSON Web Tokens (JWT).
   - Roles: `ADMIN` (Full administrative & configuration rights) and `STAFF` (Counter POS sales & stock ingestion).
2. **Catalog Management:** Full CRUD operations on products, categorized by category and linked to primary suppliers.
3. **Procurement / Inbound Stock:** Generation of Purchase Orders (POs) with itemized costs, immediately incrementing product stock upon completion.
4. **Point of Sale (POS) Billing:** Interactive counter interface to add items to cart, validate stock availability, apply discounts/GST, and generate printable invoices.
5. **Inventory Audit Trail:** Automated logging of every quantity change with previous stock, new stock, operator ID, and reference invoice/PO numbers.
6. **Mathematical Optimization:** Automated calculation of Average Daily Sales (ADS), Lead Time Demand (LTD), Safety Stock, and Reorder Points.

### 3.2 Non-Functional Requirements
- **Performance:** Sub-100ms API response time on standard queries.
- **Portability:** Zero-configuration local database deployment (SQLite native support) with cross-compatibility with MySQL 8.0+.
- **Security:** Token-based stateless authentication, parameterized SQL queries preventing SQL Injection, and CORS policy enforcement.
- **Usability:** Intuitive UI built with modern design principles (KPI cards, badges, modal dialogs, and SVG charts).

---

## 4. Software Engineering Methodology & Architecture

The application adopts the **3-Tier MVC-style Web Architecture**:

1. **Presentation Tier (Frontend):**
   - React 18 single-page application built on Vite for rapid HMR and optimized production bundles.
   - Context API for global session management (`AuthContext`).
   - SVG vector iconography powered by Lucide-react and charting powered by Recharts.
2. **Application Tier (Backend API):**
   - RESTful Express.js micro-architecture.
   - Decoupled routing (`/api/auth`, `/api/products`, `/api/inventory`, `/api/sales`, etc.).
   - Deterministic Optimization Module calculating dynamic replenishment metrics.
3. **Data Tier (Database):**
   - Fully normalized (3NF) relational database.
   - Foreign key cascading and indexing on critical lookup columns (`sku`, `category_id`, `created_at`, `sale_date`).

---

## 5. Mathematical Optimization Formulation

A critical academic contribution of this capstone is the implementation of deterministic supply chain formulas:

### Formulation 1: Average Daily Sales (ADS)
$$\text{ADS} = \frac{\sum_{t=1}^{T} \text{Units Sold}_t}{T}$$
Where $T = 30 \text{ days}$ (historical analysis window).

### Formulation 2: Lead Time Demand (LTD)
$$\text{LTD} = \text{ADS} \times \text{Lead Time}$$
Where $\text{Lead Time}$ is the number of days required by the supplier to manufacture and ship the product to the store.

### Formulation 3: Reorder Point (ROP)
$$\mathbf{ROP} = \text{LTD} + \text{Safety Stock} = (\text{ADS} \times \text{Lead Time}) + \text{Safety Stock}$$
When:
$$\text{Current Stock} \le \text{ROP} \implies \text{Trigger Replenishment Alert}$$

### Formulation 4: Target Maximum Inventory Level
$$\text{Target Level} = \text{ROP} + (\text{ADS} \times 14) + \text{Safety Stock}$$
$$\text{Recommended Order Quantity} = \max(0, \text{Target Level} - \text{Current Stock})$$

---

## 6. Verification & Test Cases Matrix

| Test ID | Module | Test Scenario | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Authentication | Login with valid credentials (`admin@retail.com`) | 200 OK, JWT returned, user redirected to Dashboard | **PASS** |
| **TC-02** | Authentication | Login with incorrect password | 401 Unauthorized, descriptive error message | **PASS** |
| **TC-03** | Product Catalog | Attempt to insert duplicate SKU | 409 Conflict, duplicate SKU prevented | **PASS** |
| **TC-04** | Inventory Inbound | Complete Purchase Order of 15 units | Stock increments by +15, audit log entry recorded | **PASS** |
| **TC-05** | POS Checkout | Sale of 2 units of product | Stock decrements by -2, digital invoice created | **PASS** |
| **TC-06** | POS Validation | Attempt to sell quantity > available stock | 400 Bad Request, transaction blocked with stock error | **PASS** |
| **TC-07** | Optimization | Product stock falls below computed ROP | Flagged as "Reorder Required" in Optimization tab | **PASS** |
| **TC-08** | Audit Trail | Manual stock adjustment (e.g. Damage -3) | Product stock updated, audit trail records reason | **PASS** |

---

## 7. Viva Voce Preparation (Frequently Asked Questions)

### Q1: Why did you choose React and Node.js for this project?
**Answer:** React offers a modular, component-driven architecture that makes building reactive interfaces (such as live POS carts and dynamic dashboards) fast and maintainable. Node.js with Express provides a lightweight, non-blocking asynchronous event-driven runtime ideal for I/O heavy REST API micro-services.

### Q2: How does your database maintain referential integrity?
**Answer:** The database enforces foreign key constraints (`PRAGMA foreign_keys = ON;` in SQLite and `ENGINE=InnoDB` in MySQL). For instance, line items in `sale_items` cascade delete if a parent sale is deleted, while deleting a category sets `category_id` in `products` to `NULL` (`ON DELETE SET NULL`), preventing orphaned records.

### Q3: How does the Reorder Point formula help a retail store?
**Answer:** Without ROP, retail managers guess when to order. If they order too late, they experience stockouts and lose customers. If they order too early, money is wasted on unsold stock. ROP accounts for how fast an item sells ($\text{ADS}$) and how long the supplier takes to deliver ($\text{Lead Time}$), plus a safety buffer ($\text{Safety Stock}$). It flags an order precisely when stock reaches the minimum threshold needed to survive until the next delivery arrives.

### Q4: How is security handled in your system?
**Answer:** Passwords are never stored in plaintext; they are salted and hashed using `bcrypt` (10 rounds). User authentication is handled statelessly via JSON Web Tokens (JWT). Authorization middleware verifies both token integrity and role privileges (`ADMIN` vs `STAFF`) before executing privileged routes.

### Q5: What is the difference between an Admin and a Staff user in your app?
**Answer:** Staff members can perform counter POS sales, view the catalog, and log stock adjustments. Administrators have full system privileges, including deleting products, managing suppliers, registering new operators, and modifying sensitive system configurations.

---

## 8. Conclusion
The **Optimized Retail Inventory Management System (RetailSync)** successfully addresses the operational bottlenecks of retail store administration. By combining practical software engineering practices, role-based security, automated invoice printing, and mathematically grounded inventory replenishment algorithms, the project demonstrates a complete, defensible, and industry-aligned capstone suitable for a 3rd-year B.Tech CSE evaluation.
