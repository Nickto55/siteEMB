const { Pool } = require('pg');
require('dotenv').config();
const { Logger } = require('./utils/logger');
const logger = new Logger('DB');

const pool = new Pool({
    host: 'db_site-emb',
    port: 5432,
    user: 'admin',
    password: 'mysecretpass',
    database: 'app_db',
});

pool.on('connect', () => {
    logger.info('Подключение к базе данных PostgreSQL установлено');
});

pool.on('error', (err) => {
    logger.error('Ошибка подключения к БД:', { error: err.message });
    process.exit(-1);
});

module.exports = pool;
