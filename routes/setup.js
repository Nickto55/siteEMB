const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { SetupEngine } = require('../lib/setup-engine');
const { Logger } = require('../utils/logger');

const logger = new Logger('SetupAPI');

router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/setup/check - Проверить статус системы
router.post('/check', async (req, res) => {
    try {
        const engine = new SetupEngine();
        const envCheck = await engine.checkEnv();
        const dbCheck = await engine.checkDbConnection();

        res.json({
            success: true,
            env: envCheck,
            database: dbCheck,
            ready: envCheck.ok && dbCheck.ok,
            logs: engine.logs
        });
    } catch (error) {
        logger.error('Ошибка проверки системы', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

// POST /api/setup/migrate - Выполнить миграции
router.post('/migrate', async (req, res) => {
    try {
        const engine = new SetupEngine();
        const result = await engine.runMigrations();

        res.json({
            success: result.ok,
            result,
            logs: engine.logs
        });
    } catch (error) {
        logger.error('Ошибка миграций', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

// POST /api/setup/init-content - Инициализировать контент
router.post('/init-content', async (req, res) => {
    try {
        const engine = new SetupEngine({ isFresh: req.body.fresh === true });
        const result = await engine.initContent();

        res.json({
            success: result.ok,
            result,
            logs: engine.logs
        });
    } catch (error) {
        logger.error('Ошибка инициализации контента', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

// POST /api/setup/create-admin - Создать администратора по умолчанию
router.post('/create-admin', async (req, res) => {
    try {
        const engine = new SetupEngine();
        const result = await engine.createDefaultAdmin();

        res.json({
            success: result.ok,
            result: {
                ...result,
                credentials: result.credentials ? {
                    username: result.credentials.username,
                    email: result.credentials.email,
                    password: result.credentials.password ? '(скрыт)' : undefined
                } : undefined
            },
            logs: engine.logs
        });
    } catch (error) {
        logger.error('Ошибка создания администратора', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

// POST /api/setup/full - Полная установка / обновление
router.post('/full', async (req, res) => {
    try {
        const engine = new SetupEngine({
            isFresh: req.body.fresh === true,
            skipContent: req.body.skipContent === true,
            migrateOnly: req.body.migrateOnly === true,
            onLog: (entry) => {
                // Логи также пишем в системный логгер
                logger[entry.level](`[Setup] ${entry.message}`);
            }
        });

        const result = await engine.runAll();

        res.json({
            success: result.ok,
            results: result.results,
            logs: engine.logs
        });
    } catch (error) {
        logger.error('Ошибка полной установки', { error: error.message });
        res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
});

module.exports = router;
