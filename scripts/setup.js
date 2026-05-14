require('dotenv').config();
const { SetupEngine } = require('../lib/setup-engine');

const args = process.argv.slice(2);
const options = {
    isFresh: args.includes('--fresh'),
    migrateOnly: args.includes('--migrate-only'),
    initContentOnly: args.includes('--init-content'),
    skipContent: args.includes('--skip-content'),
    onLog: (entry) => {
        const prefix = entry.level === 'error' ? '✗' : entry.level === 'warn' ? '⚠' : '✓';
        console.log(`[${prefix}] ${entry.message}`);
    }
};

async function main() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           🚀 EmbroMine — Setup & Update Tool                 ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Режим: ${(options.isFresh ? 'Чистая установка (--fresh)' : options.migrateOnly ? 'Только миграции' : options.initContentOnly ? 'Только контент' : 'Обновление / Установка').padEnd(46)}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const engine = new SetupEngine(options);

    if (options.initContentOnly) {
        const dbCheck = await engine.checkDbConnection();
        if (!dbCheck.ok) process.exit(1);
        const content = await engine.initContent();
        process.exit(content.ok ? 0 : 1);
    }

    const result = await engine.runAll();
    process.exit(result.ok ? 0 : 1);
}

main();
