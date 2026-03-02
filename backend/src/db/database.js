/**
 * database.js - JSON file database using lowdb v1
 * Replaces SQLite with a pure-JS JSON file store (no native compilation needed)
 */

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const adapter = new FileSync(path.join(dataDir, 'mandala.json'));
const db = low(adapter);

// Default structure
db.defaults({
    projects: [],
    ai_logs: []
}).write();

module.exports = db;
