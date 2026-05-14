const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const EXCLUDE_FILES = new Set([
    'admin-panel.html',
    'content-manager-demo.html',
    'login.html'
]);

// Placeholder для загрузки контента
const PLACEHOLDER_HTML = `
<div id="dynamic-content" class="min-h-[50vh] flex items-center justify-center transition-opacity duration-300 opacity-0" data-page-content="true">
    <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
        <p class="mt-2 text-gray-400 text-sm">Загрузка контента...</p>
    </div>
</div>
`.trim();

function transformPage(filename) {
    const filePath = path.join(PUBLIC_DIR, filename);
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Пропустить, если уже преобразован
    if ($('#dynamic-content[data-page-content="true"]').length > 0) {
        console.log(`⏭ ${filename} уже преобразован`);
        return false;
    }

    const main = $('main');
    if (!main.length) {
        console.warn(`⚠ ${filename}: нет <main>, пропускаем`);
        return false;
    }

    // Заменить innerHTML <main> на placeholder
    main.html(PLACEHOLDER_HTML);

    // Добавить content-manager.js перед </body>, если ещё не добавлен
    const alreadyHasManager = $('script[src="content-manager.js"]').length > 0 ||
                              $('script[src="/content-manager.js"]').length > 0;
    if (!alreadyHasManager) {
        $('body').append('<script src="content-manager.js" defer></script>');
    }

    // Сохранить файл
    fs.writeFileSync(filePath, $.html(), 'utf-8');
    console.log(`✓ ${filename} преобразован`);
    return true;
}

function main() {
    console.log('🔄 Начинаем преобразование страниц...\n');

    const files = fs.readdirSync(PUBLIC_DIR)
        .filter(f => f.endsWith('.html') && !EXCLUDE_FILES.has(f));

    let transformed = 0;
    for (const filename of files) {
        if (transformPage(filename)) {
            transformed++;
        }
    }

    console.log(`\n✓ Преобразование завершено: ${transformed} файлов обновлено`);
}

main();
