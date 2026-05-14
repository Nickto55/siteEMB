require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const pool = require('./db');
const { Logger } = require('./utils/logger');

const logger = new Logger('Server');

// Импорт роутов
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const contentRoutes = require('./routes/content');
const ticketsRoutes = require('./routes/tickets');
const setupRoutes = require('./routes/setup');

const app = express();
const PORT = process.env.PORT || 3000;

// Безопасность - Helmet (настроено для работы с inline скриптами)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
        }
    }
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Парсинг JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'public')));
app.use('/static', express.static(path.join(__dirname, 'static')));

// Логирование запросов
app.use(Logger.requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// Основные роуты API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/setup', setupRoutes);

// API информация
app.get('/api', (req, res) => {
    res.json({
        message: 'Express.js REST API для управления пользователями и отчетами',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                profile: 'PUT /api/auth/profile',
                changePassword: 'PUT /api/auth/change-password'
            },
            admin: {
                stats: 'GET /api/admin/stats',
                users: 'GET /api/admin/users',
                logs: 'GET /api/admin/logs',
                getUser: 'GET /api/admin/users/:id',
                updateRole: 'PUT /api/admin/users/:id/role',
                deleteUser: 'DELETE /api/admin/users/:id'
            },
            setup: {
                check: 'POST /api/setup/check',
                migrate: 'POST /api/setup/migrate',
                initContent: 'POST /api/setup/init-content',
                createAdmin: 'POST /api/setup/create-admin',
                full: 'POST /api/setup/full'
            },
            tickets: {
                create: 'POST /api/tickets',
                getAll: 'GET /api/tickets',
                getById: 'GET /api/tickets/:id',
                updateStatus: 'PUT /api/tickets/:id/status',
                updatePriority: 'PUT /api/tickets/:id/priority',
                delete: 'DELETE /api/tickets/:id'
            },
            reports: {
                getAll: 'GET /api/reports',
                getById: 'GET /api/reports/:id',
                create: 'POST /api/reports',
                update: 'PUT /api/reports/:id',
                delete: 'DELETE /api/reports/:id'
            },
            content: {
                getPage: 'GET /api/content/:pageName',
                getAll: 'GET /api/content/admin/all',
                update: 'PUT /api/content/:pageName',
                create: 'POST /api/content/page',
                delete: 'DELETE /api/content/:pageName',
                history: 'GET /api/content/:pageName/history'
            }
        }
    });
});

// Корневой роут - веб-интерфейс
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 обработчик
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

// Обработчик ошибок
app.use(Logger.errorLogger);
app.use((err, req, res, next) => {
    logger.error('Внутренняя ошибка сервера', {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Запуск сервера
const server = app.listen(PORT, () => {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('🚀 Сервер запущен');
    logger.info(`📍 Порт: ${PORT}`);
    logger.info(`🌐 URL: http://localhost:${PORT}`);
    logger.info(`🔒 Окружение: ${process.env.NODE_ENV || 'development'}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Корректное завершение
process.on('SIGTERM', () => {
    logger.info('SIGTERM получен, закрываем сервер...');
    server.close(() => {
        logger.info('Сервер закрыт');
        pool.end();
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT получен, закрываем сервер...');
    server.close(() => {
        logger.info('Сервер закрыт');
        pool.end();
        process.exit(0);
    });
});

// Обработка необработанных ошибок
process.on('uncaughtException', (err) => {
    logger.fatal('Необработанное исключение', { error: err.message, stack: err.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Необработанный reject', { reason });
});

module.exports = app;
