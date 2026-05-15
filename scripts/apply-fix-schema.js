require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function applyFixSchema() {
    console.log('[FIX] Applying schema fixes...');

    const sqlPath = path.join(__dirname, 'fix-schema.sql');
    if (!fs.existsSync(sqlPath)) {
        console.error('[ERROR] fix-schema.sql not found');
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');

    try {
        await pool.query(sql);
        console.log('[OK] Schema fixes applied successfully');
    } catch (error) {
        console.error('[ERROR] Failed to apply schema fixes:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

applyFixSchema();
