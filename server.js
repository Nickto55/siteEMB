const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Импортируем маршруты
const authRoutes = require('./routes/auth');
const reportsRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware безопасности
app.use(helmet());

// CORS конфигурация
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Здравоохранительный эндпоинт
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Сервер работает' });
});

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

// Обработчик несуществующих маршрутов
app.use((req, res) => {
    res.status(404).json({ message: 'Маршрут не найден' });
});

// Обработчик ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({
        message: 'Внутренняя ошибка сервера',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📝 Окружение: ${process.env.NODE_ENV || 'development'}`);
});
