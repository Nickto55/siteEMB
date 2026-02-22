const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_URL.includes('amazonaws.com')
        ? { rejectUnauthorized: false }
        : false
});

// Проверка подключения
pool.on('connect', () => {
    console.log('✓ Подключение к базе данных PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к БД:', err);
    process.exit(-1);
});

module.exports = pool;
