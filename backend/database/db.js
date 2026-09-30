/**
 * Database Module (SQLite via Node.js native node:sqlite)
 * Zero configuration required, perfectly portable for student demonstrations.
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'inventory.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

let dbInstance = null;

function getDb() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath);
    // Enable WAL mode for high concurrency & foreign keys
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    dbInstance.exec('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

function initDb() {
  const db = getDb();
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    console.log('[DB] SQLite database initialized successfully at:', dbPath);
  }
}

// Helper methods to abstract queries
function query(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

function get(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

function run(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

function exec(sql) {
  const db = getDb();
  return db.exec(sql);
}

module.exports = {
  getDb,
  initDb,
  query,
  get,
  run,
  exec,
  dbPath
};
