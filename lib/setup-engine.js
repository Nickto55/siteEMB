const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { Logger } = require('../utils/logger');

const logger = new Logger('SetupEngine');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

class SetupEngine {
    constructor(options = {}) {
        this.options = options;
        this.logs = [];
        this.step = 'idle';
        this.progress = 0;
    }

    emit(level, message, meta = {}) {
        const entry = { level, message, meta, time: new Date().toISOString() };
        this.logs.push(entry);
        logger[level](message, meta);
        if (this.options.onLog) {
            this.options.onLog(entry);
        }
    }

    setStep(step, progress = null) {
        this.step = step;
        if (progress !== null) this.progress = progress;
        if (this.options.onStep) {
            this.options.onStep({ step, progress: this.progress });
        }
    }

    createPool() {
        const dbUrl = process.env.DATABASE_URL;
        if (dbUrl) {
            return new Pool({ connectionString: dbUrl });
        }
        return new Pool({
            host: process.env.DB_HOST || 'db_site-emb',
            port: parseInt(process.env.DB_PORT || '5432'),
            user: process.env.DB_USER || 'admin',
            password: process.env.DB_PASSWORD || 'mysecretpass',
            database: process.env.DB_NAME || 'app_db',
        });
    }

    async checkEnv() {
        this.setStep('check-env', 5);
        this.emit('info', 'Проверка переменных окружения...');
        const required = ['JWT_SECRET'];
        const missing = [];
        const warnings = [];

        for (const key of required) {
            if (!process.env[key] || process.env[key].includes('ЗАМЕНИТЕ')) {
                missing.push(key);
            }
        }

        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
            warnings.push('JWT_SECRET слишком короткий (рекомендуется минимум 32 символа)');
        }

        if (missing.length > 0) {
            this.emit('error', `Отсутствуют обязательные переменные: ${missing.join(', ')}`);
            return { ok: false, missing, warnings };
        }

        if (warnings.length > 0) {
            warnings.forEach(w => this.emit('warn', w));
        }

        this.emit('info', 'Переменные окружения в порядке');
        return { ok: true, missing, warnings };
    }

    async checkDbConnection() {
        this.setStep('check-db', 10);
        this.emit('info', 'Проверка подключения к PostgreSQL...');
        const pool = this.createPool();
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT version()');
            const version = result.rows[0].version.split(' ')[1];
            client.release();
            this.emit('info', `Подключение успешно: PostgreSQL ${version}`);
            await pool.end();
            return { ok: true, version };
        } catch (err) {
            this.emit('error', 'Не удалось подключиться к PostgreSQL', { error: err.message });
            await pool.end();
            return { ok: false, error: err.message };
        }
    }

    async runMigrations() {
        this.setStep('migrations', 30);
        this.emit('info', 'Выполнение миграций...');
        const pool = this.createPool();
        const client = await pool.connect();
        try {
            let files = fs.readdirSync(MIGRATIONS_DIR)
                .filter(f => f.endsWith('.sql'));

            // Fix dependency order
            const priorityOrder = {
                '002_create_users_table.sql': 1,
                '003_create_tickets_table.sql': 2
            };
            files.sort((a, b) => {
                const pa = priorityOrder[a] || 99;
                const pb = priorityOrder[b] || 99;
                return pa - pb || a.localeCompare(b);
            });

            if (files.length === 0) {
                this.emit('warn', 'Миграции не найдены');
                await client.release();
                await pool.end();
                return { ok: true, executed: 0 };
            }

            for (const file of files) {
                const filePath = path.join(MIGRATIONS_DIR, file);
                const sql = fs.readFileSync(filePath, 'utf-8');
                this.emit('info', `→ ${file}`);
                await client.query(sql);
            }

            this.emit('info', `Выполнено миграций: ${files.length}`);
            await client.release();
            await pool.end();
            return { ok: true, executed: files.length };
        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            await client.release();
            await pool.end();
            this.emit('error', `Ошибка миграции: ${err.message}`);
            return { ok: false, error: err.message };
        }
    }

    async createDefaultAdmin() {
        this.setStep('create-admin', 60);
        this.emit('info', 'Проверка наличия администратора...');
        const pool = this.createPool();
        const client = await pool.connect();
        try {
            const result = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
            if (result.rows.length > 0) {
                this.emit('info', 'Администратор уже существует');
                await client.release();
                await pool.end();
                return { ok: true, created: false };
            }

            const username = 'admin';
            const email = 'admin@embromine.ru';
            const password = 'admin123';
            const hash = await bcrypt.hash(password, 10);

            await client.query(
                `INSERT INTO users (username, email, password, role, bio)
                 VALUES ($1, $2, $3, 'admin', 'Администратор сервера EmbroMine')`,
                [username, email, hash]
            );

            this.emit('info', `Создан администратор: ${username} / ${password}`);
            await client.release();
            await pool.end();
            return { ok: true, created: true, credentials: { username, email, password } };
        } catch (err) {
            await client.release();
            await pool.end();
            this.emit('error', `Ошибка создания администратора: ${err.message}`);
            return { ok: false, error: err.message };
        }
    }

    async initContent() {
        this.setStep('init-content', 80);
        if (this.options.skipContent) {
            this.emit('info', 'Пропуск инициализации контента');
            return { ok: true, loaded: 0, skipped: 0 };
        }

        this.emit('info', 'Инициализация контента страниц...');
        const pool = this.createPool();
        const client = await pool.connect();

        const EXPORT_FILE = path.join(PUBLIC_DIR, 'content_export.json');
        const EXCLUDE_FILES = new Set([
            'admin-panel.html', 'content-manager-demo.html', 'login.html'
        ]);

        try {
            let loaded = 0;
            let skipped = 0;
            let pagesToImport = [];

            if (fs.existsSync(EXPORT_FILE)) {
                this.emit('info', 'Найден content_export.json, импортируем из экспорта...');
                const exported = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'));
                pagesToImport = Object.values(exported);
            } else {
                this.emit('info', 'Экспорт не найден, сканируем HTML файлы...');
                const cheerio = require('cheerio');
                const files = fs.readdirSync(PUBLIC_DIR)
                    .filter(f => f.endsWith('.html') && !EXCLUDE_FILES.has(f));

                for (const filename of files) {
                    const filePath = path.join(PUBLIC_DIR, filename);
                    const htmlContent = fs.readFileSync(filePath, 'utf-8');
                    const $ = cheerio.load(htmlContent);
                    const pageTitle = $('title').text() || filename.replace('.html', '');
                    const pageName = filename.replace('.html', '');

                    const main = $('main');
                    if (!main.length) {
                        this.emit('warn', `Нет <main> в ${filename}, пропускаем`);
                        continue;
                    }

                    let pageContent = main.html() || '';
                    const body = $('body');
                    const mainEl = main[0];
                    const children = body.children().toArray();
                    let foundMain = false;
                    for (const child of children) {
                        if (child === mainEl) {
                            foundMain = true;
                            continue;
                        }
                        if (foundMain && child.tagName === 'script') {
                            if (!child.attribs.src || child.attribs.src === 'script.js' || child.attribs.src === '/script.js') {
                                continue;
                            }
                            pageContent += $.html(child);
                        }
                    }

                    pagesToImport.push({ page_name: pageName, title: pageTitle, content: pageContent });
                }
            }

            for (const page of pagesToImport) {
                const existing = await client.query(
                    'SELECT id FROM page_content WHERE page_name = $1',
                    [page.page_name]
                );

                if (existing.rows.length > 0 && !this.options.isFresh) {
                    skipped++;
                    continue;
                }

                if (existing.rows.length > 0 && this.options.isFresh) {
                    await client.query('DELETE FROM page_content WHERE page_name = $1', [page.page_name]);
                }

                await client.query(
                    `INSERT INTO page_content (page_name, title, content, is_active)
                     VALUES ($1, $2, $3, true)`,
                    [page.page_name, page.title, page.content]
                );

                loaded++;
                this.emit('info', `Загружена страница: ${page.page_name}`);
            }

            this.emit('info', `Контент загружен: ${loaded} новых, ${skipped} пропущено`);
            await client.release();
            await pool.end();
            return { ok: true, loaded, skipped };
        } catch (err) {
            await client.release();
            await pool.end();
            this.emit('error', `Ошибка инициализации контента: ${err.message}`);
            return { ok: false, error: err.message };
        }
    }

    async getStats() {
        this.setStep('stats', 95);
        this.emit('info', 'Сбор статистики...');
        const pool = this.createPool();
        const client = await pool.connect();
        try {
            const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
            const ticketsCount = await client.query('SELECT COUNT(*) as count FROM tickets');
            const reportsCount = await client.query('SELECT COUNT(*) as count FROM reports');
            const contentCount = await client.query('SELECT COUNT(*) as count FROM page_content');

            const stats = {
                users: parseInt(usersCount.rows[0].count),
                tickets: parseInt(ticketsCount.rows[0].count),
                reports: parseInt(reportsCount.rows[0].count),
                content: parseInt(contentCount.rows[0].count)
            };

            this.emit('info', `Статистика: ${stats.users} пользователей, ${stats.tickets} тикетов, ${stats.reports} отчетов, ${stats.content} страниц`);
            await client.release();
            await pool.end();
            return { ok: true, stats };
        } catch (err) {
            await client.release();
            await pool.end();
            this.emit('error', `Ошибка сбора статистики: ${err.message}`);
            return { ok: false, error: err.message };
        }
    }

    async runAll() {
        this.emit('info', '=== Начало установки / обновления ===');
        const results = [];

        const envCheck = await this.checkEnv();
        results.push({ step: 'env', ...envCheck });
        if (!envCheck.ok) {
            this.emit('fatal', 'Установка прервана: проблемы с окружением');
            this.setStep('failed', 100);
            return { ok: false, results };
        }

        const dbCheck = await this.checkDbConnection();
        results.push({ step: 'db', ...dbCheck });
        if (!dbCheck.ok) {
            this.emit('fatal', 'Установка прервана: нет подключения к БД');
            this.setStep('failed', 100);
            return { ok: false, results };
        }

        const migrations = await this.runMigrations();
        results.push({ step: 'migrations', ...migrations });

        if (!this.options.migrateOnly) {
            const admin = await this.createDefaultAdmin();
            results.push({ step: 'admin', ...admin });

            const content = await this.initContent();
            results.push({ step: 'content', ...content });

            const stats = await this.getStats();
            results.push({ step: 'stats', ...stats });
        }

        if (results.every(r => r.ok !== false)) {
            this.emit('info', '=== Установка / обновление завершено успешно ===');
            this.setStep('done', 100);
            return { ok: true, results };
        } else {
            this.emit('error', '=== Установка завершена с ошибками ===');
            this.setStep('failed', 100);
            return { ok: false, results };
        }
    }

    getReport() {
        return {
            step: this.step,
            progress: this.progress,
            logs: this.logs,
            completed: this.step === 'done' || this.step === 'failed'
        };
    }
}

module.exports = { SetupEngine };
