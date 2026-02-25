require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const cheerio = require('cheerio');

const PUBLIC_DIR = path.join(__dirname, 'public');

// Основные HTML файлы для загрузки (исключаем login и admin-panel)
const HTML_FILES = [
    'index.html',
    'rules.html',
    'rules-overview.html',
    'rules-guide.html',
    'rules-glossary.html',
    'dashboard.html'
];

async function initializeContent() {
    console.log('🔄 Начинаем инициализацию контента страниц...\n');

    try {
        // Проверка существования таблицы
        const tableCheck = await pool.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'page_content'
            )`
        );

        if (!tableCheck.rows[0].exists) {
            console.error('❌ Таблица page_content не существует!');
            console.error('Пожалуйста, выполните миграцию SQL файла: migrations/001_create_content_table.sql');
            process.exit(1);
        }

        console.log('✓ Таблица page_content найдена\n');

        for (const filename of HTML_FILES) {
            const filePath = path.join(PUBLIC_DIR, filename);

            // Проверка существования файла
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠ Файл не найден: ${filename}`);
                continue;
            }

            const htmlContent = fs.readFileSync(filePath, 'utf-8');
            const $ = cheerio.load(htmlContent);

            // Получить название страницы из title тега
            const pageTitle = $('title').text() || filename.replace('.html', '');

            // Получить название страницы для ключа в БД
            const pageName = filename.replace('.html', '');

            // Получить основной контент (все что внутри body, но исключить скрипты и стили)
            $('script').remove();
            $('link[rel="stylesheet"]').remove();
            const bodyHtml = $('body').html() || '';

            try {
                // Проверить существует ли уже такая страница
                const existingPage = await pool.query(
                    'SELECT id FROM page_content WHERE page_name = $1',
                    [pageName]
                );

                if (existingPage.rows.length > 0) {
                    console.log(`⚠ Страница '${pageName}' уже существует в БД, пропускаем`);
                    continue;
                }

                // Вставить контент
                await pool.query(
                    `INSERT INTO page_content (page_name, title, content, is_active)
                     VALUES ($1, $2, $3, true)`,
                    [pageName, pageTitle, htmlContent]
                );

                console.log(`✓ Загружена страница: ${pageName} (${htmlContent.length} символов)`);
            } catch (error) {
                console.error(`✗ Ошибка при загрузке ${pageName}:`, error.message);
            }
        }

        console.log('\n✓ Инициализация контента завершена!');

        // Показать статистику
        const stats = await pool.query('SELECT COUNT(*) as count FROM page_content');
        console.log(`📊 Всего страниц в БД: ${stats.rows[0].count}`);

    } catch (error) {
        console.error('❌ Ошибка при инициализации:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Запустить инициализацию
initializeContent();
