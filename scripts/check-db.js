require('dotenv').config();
const pool = require('../db');

async function checkDatabase() {
    try {
        console.log('🔍 Проверка подключения к базе данных...');

        // Проверка подключения
        const client = await pool.connect();
        console.log('✅ Подключение к PostgreSQL успешно');

        // Проверка существования таблицы users
        const tableCheck = await client.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'users'
            )`
        );

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Таблица users не существует');
            console.log('🔧 Выполняем миграцию...');

            // Создание таблицы пользователей
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
                    avatar_url VARCHAR(500),
                    bio TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            `);

            // Создание индексов
            await client.query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);

            // Создание администратора
            await client.query(`
                INSERT INTO users (username, email, password, role, bio)
                VALUES ('admin', 'admin@embromine.ru', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Администратор сервера EmbroMine')
                ON CONFLICT (username) DO NOTHING
            `);

            console.log('✅ Миграция выполнена успешно');
            console.log('👤 Создан администратор: admin / admin123');
        } else {
            console.log('✅ Таблица users существует');

            // Проверка количества пользователей
            const userCount = await client.query('SELECT COUNT(*) as count FROM users');
            console.log(`👥 Пользователей в базе: ${userCount.rows[0].count}`);
        }

        client.release();
        console.log('🎉 Проверка завершена успешно');

    } catch (error) {
        console.error('❌ Ошибка при проверке базы данных:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

checkDatabase();