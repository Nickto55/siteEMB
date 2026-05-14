require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');
const cheerio = require('cheerio');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const EXPORT_FILE = path.join(PUBLIC_DIR, 'content_export.json');

const EXCLUDE_FILES = new Set([
    'admin-panel.html',
    'content-manager-demo.html',
    'login.html'
]);

async function initializeContent() {
    console.log('[INIT] Starting content initialization...\n');

    try {
        const tableCheck = await pool.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'page_content'
            )`
        );

        if (!tableCheck.rows[0].exists) {
            console.error('[ERROR] Table page_content does not exist!');
            console.error('Please run migration: migrations/001_create_content_table.sql');
            process.exit(1);
        }

        console.log('[OK] Table page_content found\n');

        let pagesToImport = [];

        // Если есть content_export.json — загружаем из него (результат transform-pages)
        if (fs.existsSync(EXPORT_FILE)) {
            console.log('[INFO] Found content_export.json, importing from export...\n');
            const exported = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'));
            pagesToImport = Object.values(exported);
        } else {
            // Старая логика: сканировать HTML файлы
            console.log('[INFO] No export found, scanning HTML files...\n');
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
                    console.warn(`[WARN] No <main> in ${filename}, skipping`);
                    continue;
                }

                let pageContent = main.html() || '';

                // Добавить скрипты после <main>
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
                        pageContent += $.html(child);
                    }
                }

                pagesToImport.push({ page_name: pageName, title: pageTitle, content: pageContent });
            }
        }

        for (const page of pagesToImport) {
            const existingPage = await pool.query(
                'SELECT id FROM page_content WHERE page_name = $1',
                [page.page_name]
            );

            if (existingPage.rows.length > 0) {
                console.log(`[SKIP] Page '${page.page_name}' already exists in DB`);
                continue;
            }

            try {
                await pool.query(
                    `INSERT INTO page_content (page_name, title, content, is_active)
                     VALUES ($1, $2, $3, true)`,
                    [page.page_name, page.title, page.content]
                );
                console.log(`[OK] Loaded page: ${page.page_name} (${page.content.length} chars)`);
            } catch (error) {
                console.error(`[ERROR] Failed to load ${page.page_name}:`, error.message);
            }
        }

        console.log('\n[OK] Content initialization complete!');
        const stats = await pool.query('SELECT COUNT(*) as count FROM page_content');
        console.log(`[STATS] Total pages in DB: ${stats.rows[0].count}`);

    } catch (error) {
        console.error('[ERROR] Initialization failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initializeContent();
