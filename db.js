const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'db_site-emb',
    port: 5432,
    user: 'admin',
    password: 'mysecretpass',
    database: 'app_db',
});

module.exports = pool;
pool.on('connect', () => {
    console.log('✓ Подключение к базе данных PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к БД:', err);
    process.exit(-1);
});

module.exports = pool;
